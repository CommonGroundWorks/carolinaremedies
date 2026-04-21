#!/usr/bin/env node

import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { resolve } from 'path'

const port = process.env.PORT || '7000'
const host = process.env.HOST || '0.0.0.0'
const standaloneServerPath = resolve(process.cwd(), '.next', 'standalone', 'server.js')

if (!existsSync(standaloneServerPath)) {
  console.error('Missing production build. Run "npm run build" before "npm run start".')
  process.exit(1)
}

const child = spawn(process.execPath, [standaloneServerPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    HOSTNAME: host,
    PORT: port,
  },
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
process.on('SIGBREAK', () => child.kill('SIGTERM'))
