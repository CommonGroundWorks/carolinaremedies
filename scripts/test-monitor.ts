/**
 * Test Status Monitor
 * Real-time monitoring and reporting of test execution
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface TestStatus {
  phase: string
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
  startTime?: number
  endTime?: number
  duration?: number
  coverage?: number
  errors?: string[]
  warnings?: string[]
}

interface TestSuite {
  name: string
  timestamp: string
  environment: string
  phases: TestStatus[]
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    successRate: number
    totalDuration: number
  }
}

class TestMonitor {
  private workspaceRoot: string
  private suite: TestSuite
  private statusFile: string

  constructor() {
    this.workspaceRoot = process.cwd()
    this.statusFile = join(this.workspaceRoot, 'test-results', 'test-status.json')
    
    this.suite = {
      name: 'NCRemedies Comprehensive Test Suite',
      timestamp: new Date().toISOString(),
      environment: this.getEnvironment(),
      phases: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        totalDuration: 0
      }
    }
  }

  private getEnvironment(): string {
    const env = process.env.NODE_ENV || 'development'
    const ci = process.env.CI ? 'CI' : 'local'
    return `${env}-${ci}`
  }

  initializePhases() {
    const phases = [
      'database-setup',
      'database-validation', 
      'unit-tests',
      'integration-tests',
      'e2e-critical',
      'e2e-full',
      'performance',
      'security',
      'accessibility'
    ]

    this.suite.phases = phases.map(phase => ({
      phase,
      status: 'pending'
    }))

    this.suite.summary.total = phases.length
    this.saveStatus()
  }

  startPhase(phaseName: string) {
    const phase = this.suite.phases.find(p => p.phase === phaseName)
    if (phase) {
      phase.status = 'running'
      phase.startTime = Date.now()
      this.saveStatus()
      this.logPhaseUpdate(phaseName, 'started')
    }
  }

  completePhase(phaseName: string, success: boolean, errors?: string[], warnings?: string[]) {
    const phase = this.suite.phases.find(p => p.phase === phaseName)
    if (phase) {
      phase.status = success ? 'passed' : 'failed'
      phase.endTime = Date.now()
      phase.duration = phase.endTime - (phase.startTime || phase.endTime)
      phase.errors = errors
      phase.warnings = warnings

      // Update summary
      if (success) {
        this.suite.summary.passed++
      } else {
        this.suite.summary.failed++
      }

      this.updateSummary()
      this.saveStatus()
      this.logPhaseUpdate(phaseName, success ? 'passed' : 'failed')
    }
  }

  skipPhase(phaseName: string, reason: string) {
    const phase = this.suite.phases.find(p => p.phase === phaseName)
    if (phase) {
      phase.status = 'skipped'
      phase.warnings = [reason]
      this.suite.summary.skipped++
      this.updateSummary()
      this.saveStatus()
      this.logPhaseUpdate(phaseName, 'skipped', reason)
    }
  }

  updateCoverage(phaseName: string, coverage: number) {
    const phase = this.suite.phases.find(p => p.phase === phaseName)
    if (phase) {
      phase.coverage = coverage
      this.saveStatus()
    }
  }

  private updateSummary() {
    const completed = this.suite.summary.passed + this.suite.summary.failed
    this.suite.summary.successRate = completed > 0 ? (this.suite.summary.passed / completed) * 100 : 0
    
    this.suite.summary.totalDuration = this.suite.phases
      .filter(p => p.duration)
      .reduce((total, p) => total + (p.duration || 0), 0)
  }

  private saveStatus() {
    try {
      const dir = join(this.workspaceRoot, 'test-results')
      if (!existsSync(dir)) {
        execSync(`mkdir -p "${dir}"`, { cwd: this.workspaceRoot })
      }
      writeFileSync(this.statusFile, JSON.stringify(this.suite, null, 2))
    } catch (error) {
      console.error('Failed to save test status:', error)
    }
  }

  private logPhaseUpdate(phaseName: string, action: string, details?: string) {
    const timestamp = new Date().toISOString()
    const icon = this.getStatusIcon(action)
    const message = `${icon} ${timestamp} - Phase ${phaseName} ${action}`
    
    console.log(message)
    if (details) {
      console.log(`   ${details}`)
    }

    // Also append to log file
    const logFile = join(this.workspaceRoot, 'test-results', 'test-execution.log')
    const logEntry = details ? `${message} - ${details}\\n` : `${message}\\n`
    
    try {
      const fs = require('fs')
      fs.appendFileSync(logFile, logEntry)
    } catch (error) {
      // Ignore log file errors
    }
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      started: '🔄',
      passed: '✅',
      failed: '❌',
      skipped: '⏭️',
      pending: '⏳'
    }
    return icons[status] || '📝'
  }

  generateReport(): string {
    const report = []
    
    report.push('# NCRemedies Test Execution Report')
    report.push(`Generated: ${new Date().toISOString()}`)
    report.push(`Environment: ${this.suite.environment}`)
    report.push('')
    
    // Summary
    report.push('## Summary')
    report.push(`- **Total Phases:** ${this.suite.summary.total}`)
    report.push(`- **Passed:** ${this.suite.summary.passed} ✅`)
    report.push(`- **Failed:** ${this.suite.summary.failed} ❌`)
    report.push(`- **Skipped:** ${this.suite.summary.skipped} ⏭️`)
    report.push(`- **Success Rate:** ${this.suite.summary.successRate.toFixed(1)}%`)
    report.push(`- **Total Duration:** ${(this.suite.summary.totalDuration / 1000).toFixed(1)}s`)
    report.push('')

    // Phase Details
    report.push('## Phase Details')
    report.push('| Phase | Status | Duration | Coverage | Notes |')
    report.push('|-------|--------|----------|----------|-------|')
    
    for (const phase of this.suite.phases) {
      const status = this.getStatusIcon(phase.status) + ' ' + phase.status
      const duration = phase.duration ? `${(phase.duration / 1000).toFixed(1)}s` : '-'
      const coverage = phase.coverage ? `${phase.coverage.toFixed(1)}%` : '-'
      const notes = phase.errors?.length ? `${phase.errors.length} errors` : 
                   phase.warnings?.length ? `${phase.warnings.length} warnings` : '-'
      
      report.push(`| ${phase.phase} | ${status} | ${duration} | ${coverage} | ${notes} |`)
    }
    report.push('')

    // Failures Detail
    const failedPhases = this.suite.phases.filter(p => p.status === 'failed')
    if (failedPhases.length > 0) {
      report.push('## Failure Details')
      for (const phase of failedPhases) {
        report.push(`### ${phase.phase}`)
        if (phase.errors) {
          for (const error of phase.errors) {
            report.push(`- ${error}`)
          }
        }
        report.push('')
      }
    }

    // Recommendations
    report.push('## Recommendations')
    if (this.suite.summary.failed > 0) {
      report.push('- ❌ Fix failing tests before proceeding to production')
      report.push('- 🔍 Review error details above for specific issues')
    }
    
    if (this.suite.summary.skipped > 0) {
      report.push('- ⚠️ Review skipped tests - they may indicate missing dependencies')
    }
    
    const avgCoverage = this.getAverageCoverage()
    if (avgCoverage < 80) {
      report.push(`- 📊 Increase test coverage (current: ${avgCoverage.toFixed(1)}%, target: 80%+)`)
    }
    
    if (this.suite.summary.successRate === 100) {
      report.push('- ✅ All tests passing! Ready for deployment')
    }

    return report.join('\\n')
  }

  private getAverageCoverage(): number {
    const coveragePhases = this.suite.phases.filter(p => p.coverage !== undefined)
    if (coveragePhases.length === 0) return 0
    
    const totalCoverage = coveragePhases.reduce((sum, p) => sum + (p.coverage || 0), 0)
    return totalCoverage / coveragePhases.length
  }

  saveReport() {
    const report = this.generateReport()
    const reportPath = join(this.workspaceRoot, 'test-results', 'test-report.md')
    
    try {
      writeFileSync(reportPath, report)
      console.log(`\\n📄 Test report saved: ${reportPath}`)
    } catch (error) {
      console.error('Failed to save test report:', error)
    }
  }

  loadExistingStatus(): boolean {
    try {
      if (existsSync(this.statusFile)) {
        const data = readFileSync(this.statusFile, 'utf8')
        this.suite = JSON.parse(data)
        return true
      }
    } catch (error) {
      console.error('Failed to load existing test status:', error)
    }
    return false
  }

  getStatus(): TestSuite {
    return this.suite
  }

  printStatus() {
    console.log('\\n📊 Current Test Status:')
    console.log('=' .repeat(50))
    
    for (const phase of this.suite.phases) {
      const icon = this.getStatusIcon(phase.status)
      const duration = phase.duration ? ` (${(phase.duration / 1000).toFixed(1)}s)` : ''
      console.log(`${icon} ${phase.phase.padEnd(20)} ${phase.status}${duration}`)
    }
    
    console.log('')
    console.log(`📈 Success Rate: ${this.suite.summary.successRate.toFixed(1)}%`)
    console.log(`⏱️  Total Duration: ${(this.suite.summary.totalDuration / 1000).toFixed(1)}s`)
  }
}

// CLI Interface
async function main() {
  const monitor = new TestMonitor()
  const args = process.argv.slice(2)
  
  if (args.includes('--status')) {
    if (monitor.loadExistingStatus()) {
      monitor.printStatus()
    } else {
      console.log('No test status found. Run tests first.')
    }
    return
  }
  
  if (args.includes('--report')) {
    if (monitor.loadExistingStatus()) {
      monitor.saveReport()
      console.log(monitor.generateReport())
    } else {
      console.log('No test data found. Run tests first.')
    }
    return
  }
  
  if (args.includes('--init')) {
    monitor.initializePhases()
    console.log('Test monitoring initialized')
    return
  }
  
  console.log(`
Test Monitor Usage:
  npm run monitor --init      # Initialize test monitoring
  npm run monitor --status    # Show current test status
  npm run monitor --report    # Generate and save test report
`)
}

if (require.main === module) {
  main().catch(error => {
    console.error('Monitor failed:', error)
    process.exit(1)
  })
}

export { TestMonitor }
