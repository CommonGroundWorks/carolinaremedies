#!/usr/bin/env node

import { spawn, exec } from 'child_process'
import kill from 'kill-port'
import { promisify } from 'util'

const execAsync = promisify(exec)
const PORT = Number.parseInt(process.env.PORT ?? '7000', 10)

console.log('🚀 Starting NCRemedies Development Environment...\n')

// Function to check if Docker Desktop is running
async function checkDockerStatus() {
  try {
    await execAsync('docker --version')
    await execAsync('docker info')
    return true
  } catch {
    return false
  }
}

// Function to check if Supabase is running
async function checkSupabaseStatus() {
  try {
    const { stdout } = await execAsync('npx supabase status')
    return stdout.includes('API URL') && stdout.includes('DB URL')
  } catch {
    return false
  }
}

// Function to start Supabase
async function startSupabase() {
  try {
    console.log('🗄️ Starting Supabase database...')
    await execAsync('npx supabase start')
    console.log('✅ Supabase database started successfully\n')
    return true
  } catch (error) {
    console.log('⚠️ Could not start Supabase database:')
    console.log(`   ${error.message.split('\n')[0]}`)
    console.log('   The app will run but database features may not work.\n')
    return false
  }
}

// Function to start the development server
async function startDevServer() {
  try {
    // First, ensure the configured app port is available
    console.log(`📡 Checking port ${PORT}...`)
    await kill(PORT).catch(() => {}) // Silently fail if nothing is running
    console.log(`✅ Port ${PORT} is now available\n`)

    // Check and start database if possible
    const dockerRunning = await checkDockerStatus()
    if (dockerRunning) {
      const supabaseRunning = await checkSupabaseStatus()
      if (!supabaseRunning) {
        console.log('⚠️ Supabase database is not running. Starting the app without waiting for it.\n')
        console.log('   To enable full database features, run: npx supabase start\n')
      } else {
        console.log('✅ Supabase database is already running\n')
      }
    } else {
      console.log(
        '⚠️ Docker Desktop not detected. Database features will be limited.\n'
      )
      console.log('   To enable full functionality:')
      console.log(
        '   1. Install Docker Desktop: https://docs.docker.com/desktop'
      )
      console.log('   2. Start Docker Desktop')
      console.log('   3. Run: npx supabase start\n')
    }

    // Start the Next.js development server
    console.log('🔄 Starting Next.js development server...')
    const devProcess = spawn('npm', ['run', 'dev:next'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(PORT),
      },
    })

    // Handle process termination
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down development environment...')
      devProcess.kill('SIGINT')
      await kill(PORT).catch(() => {})
      console.log('✅ Development environment stopped cleanly')
      process.exit(0)
    })

    // Handle unexpected exits
    devProcess.on('exit', (code) => {
      if (code !== 0) {
        console.log(`\n❌ Development server exited with code ${code}`)
      }
    })
  } catch (error) {
    console.error('❌ Failed to start development environment:', error.message)
    process.exit(1)
  }
}

// Start the development environment
startDevServer()
