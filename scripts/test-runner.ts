/**
 * Enhanced Test Runner for NCRemedies
 * Orchestrates comprehensive testing across all phases
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'

interface TestPhase {
  name: string
  description: string
  commands: string[]
  required: boolean
  dependencies?: string[]
}

interface TestResults {
  phase: string
  success: boolean
  duration: number
  output: string
  errors?: string[]
}

class TestRunner {
  private workspaceRoot: string
  private results: TestResults[] = []

  constructor() {
    this.workspaceRoot = process.cwd()
  }

  private phases: TestPhase[] = [
    {
      name: 'database-setup',
      description: 'Database setup and validation',
      commands: [
        'npm run db:reset',
        'npm run db:migrate',
        'npm run db:seed'
      ],
      required: true
    },
    {
      name: 'database-validation',
      description: 'Database schema and RLS validation',
      commands: [
        'npx vitest run tests/database/'
      ],
      required: true,
      dependencies: ['database-setup']
    },
    {
      name: 'unit-tests',
      description: 'Unit tests for components and utilities',
      commands: [
        'npx vitest run tests/unit/ --coverage'
      ],
      required: true
    },
    {
      name: 'integration-tests',
      description: 'Integration tests for services and APIs',
      commands: [
        'npx vitest run tests/integration/'
      ],
      required: true,
      dependencies: ['database-setup']
    },
    {
      name: 'e2e-critical',
      description: 'Critical user journey E2E tests',
      commands: [
        'npx playwright test tests/e2e/user-flows/ --project=chromium'
      ],
      required: true,
      dependencies: ['database-setup']
    },
    {
      name: 'e2e-full',
      description: 'Complete E2E test suite (all browsers)',
      commands: [
        'npx playwright test tests/e2e/'
      ],
      required: false,
      dependencies: ['e2e-critical']
    },
    {
      name: 'performance',
      description: 'Performance and load testing',
      commands: [
        'npm run test:lighthouse',
        'npm run test:load'
      ],
      required: false,
      dependencies: ['e2e-critical']
    },
    {
      name: 'security',
      description: 'Security vulnerability scanning',
      commands: [
        'npm audit --audit-level=moderate',
        'npm run test:security'
      ],
      required: false
    },
    {
      name: 'accessibility',
      description: 'Accessibility compliance testing',
      commands: [
        'npm run test:a11y'
      ],
      required: false,
      dependencies: ['e2e-critical']
    }
  ]

  async runPhase(phase: TestPhase): Promise<TestResults> {
    console.log(`\\n🔄 Running Phase: ${phase.name}`)
    console.log(`📝 ${phase.description}`)
    
    const startTime = Date.now()
    let success = true
    let output = ''
    const errors: string[] = []

    try {
      for (const command of phase.commands) {
        console.log(`\\n  ▶️  Executing: ${command}`)
        
        try {
          const result = execSync(command, {
            cwd: this.workspaceRoot,
            encoding: 'utf8',
            stdio: 'pipe'
          })
          output += `\\n=== ${command} ===\\n${result}`
          console.log(`  ✅ Success: ${command}`)
        } catch (error: any) {
          success = false
          const errorMessage = error.message || String(error)
          errors.push(`Command failed: ${command}\\n${errorMessage}`)
          console.log(`  ❌ Failed: ${command}`)
          console.log(`     Error: ${errorMessage.slice(0, 200)}...`)
          
          if (phase.required) {
            break // Stop on first failure for required phases
          }
        }
      }
    } catch (error: any) {
      success = false
      errors.push(`Phase execution error: ${error.message}`)
    }

    const duration = Date.now() - startTime
    const result: TestResults = {
      phase: phase.name,
      success,
      duration,
      output,
      errors: errors.length > 0 ? errors : undefined
    }

    this.results.push(result)
    
    if (success) {
      console.log(`\\n✅ Phase ${phase.name} completed successfully (${duration}ms)`)
    } else {
      console.log(`\\n❌ Phase ${phase.name} failed (${duration}ms)`)
      console.log(`   Errors: ${errors.length}`)
    }

    return result
  }

  checkDependencies(phase: TestPhase): boolean {
    if (!phase.dependencies) return true

    for (const depName of phase.dependencies) {
      const depResult = this.results.find(r => r.phase === depName)
      if (!depResult || !depResult.success) {
        console.log(`⚠️  Skipping ${phase.name}: dependency ${depName} failed`)
        return false
      }
    }
    return true
  }

  async runAll(options: { skipOptional?: boolean; parallel?: boolean } = {}) {
    console.log('🚀 Starting NCRemedies Comprehensive Test Suite')
    console.log('=' .repeat(60))
    
    const startTime = Date.now()
    
    for (const phase of this.phases) {
      // Skip optional phases if requested
      if (options.skipOptional && !phase.required) {
        console.log(`⏭️  Skipping optional phase: ${phase.name}`)
        continue
      }

      // Check dependencies
      if (!this.checkDependencies(phase)) {
        continue
      }

      await this.runPhase(phase)
      
      // Stop on critical failure
      const lastResult = this.results[this.results.length - 1]
      if (!lastResult.success && phase.required) {
        console.log(`\\n🛑 Critical phase failed: ${phase.name}`)
        console.log('   Stopping test execution')
        break
      }
    }

    const totalDuration = Date.now() - startTime
    this.generateReport(totalDuration)
  }

  async runSpecific(phaseNames: string[]) {
    console.log(`🎯 Running specific phases: ${phaseNames.join(', ')}`)
    
    for (const phaseName of phaseNames) {
      const phase = this.phases.find(p => p.name === phaseName)
      if (!phase) {
        console.log(`❌ Unknown phase: ${phaseName}`)
        continue
      }

      if (!this.checkDependencies(phase)) {
        // Try to run dependencies first
        if (phase.dependencies) {
          console.log(`🔄 Running dependencies for ${phaseName}`)
          await this.runSpecific(phase.dependencies)
        }
      }

      await this.runPhase(phase)
    }

    this.generateReport()
  }

  generateReport(totalDuration?: number) {
    console.log('\\n\\n📊 TEST EXECUTION REPORT')
    console.log('=' .repeat(60))
    
    const successful = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const total = this.results.length
    
    console.log(`\\n📈 SUMMARY:`)
    console.log(`   Total Phases: ${total}`)
    console.log(`   ✅ Successful: ${successful}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📊 Success Rate: ${((successful / total) * 100).toFixed(1)}%`)
    
    if (totalDuration) {
      console.log(`   ⏱️  Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(1)}s)`)
    }

    console.log(`\\n📋 PHASE DETAILS:`)
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌'
      const duration = `${result.duration}ms`
      console.log(`   ${status} ${result.phase.padEnd(20)} ${duration.padStart(8)}`)
      
      if (result.errors) {
        console.log(`      🐛 Errors: ${result.errors.length}`)
      }
    }

    // Generate detailed report file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        successful,
        failed,
        successRate: (successful / total) * 100,
        totalDuration
      },
      phases: this.results
    }

    const reportPath = join(this.workspaceRoot, 'test-results', 'comprehensive-test-report.json')
    writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    console.log(`\\n📄 Detailed report saved: ${reportPath}`)

    // Exit with appropriate code
    const hasFailures = failed > 0
    if (hasFailures) {
      console.log(`\\n❌ Test suite completed with failures`)
      process.exit(1)
    } else {
      console.log(`\\n✅ All tests passed successfully!`)
      process.exit(0)
    }
  }

  listPhases() {
    console.log('📋 Available Test Phases:')
    console.log('=' .repeat(40))
    
    for (const phase of this.phases) {
      const required = phase.required ? '🔴 Required' : '🔵 Optional'
      const deps = phase.dependencies ? ` (depends: ${phase.dependencies.join(', ')})` : ''
      
      console.log(`\\n${required} ${phase.name}${deps}`)
      console.log(`   📝 ${phase.description}`)
      console.log(`   🔧 Commands: ${phase.commands.join(' && ')}`)
    }
  }
}

// CLI Interface
async function main() {
  const runner = new TestRunner()
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
NCRemedies Test Runner

Usage:
  npm run test:all                    # Run all tests
  npm run test:all --skip-optional    # Run only required tests
  npm run test:specific <phase>...    # Run specific phases
  npm run test:list                   # List available phases

Examples:
  npm run test:specific database-setup unit-tests
  npm run test:specific e2e-critical
  npm run test:all --skip-optional
`)
    return
  }

  if (args.includes('--list')) {
    runner.listPhases()
    return
  }

  if (args.includes('--specific')) {
    const phaseIndex = args.indexOf('--specific')
    const phases = args.slice(phaseIndex + 1)
    if (phases.length === 0) {
      console.log('❌ No phases specified for --specific')
      return
    }
    await runner.runSpecific(phases)
    return
  }

  // Default: run all tests
  const skipOptional = args.includes('--skip-optional')
  await runner.runAll({ skipOptional })
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}

export { TestRunner }
