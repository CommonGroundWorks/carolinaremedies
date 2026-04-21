import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:7000'
const urls = [baseUrl, `${baseUrl}/products`, `${baseUrl}/about`]
const thresholds = {
  performance: 0.3,
  accessibility: 0.9,
  'best-practices': 0.9,
}
const tempRoot = join(process.cwd(), '.tmp', 'lighthouse')

const ensureUrlAvailable = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Expected ${url} to return a 2xx response, received ${response.status}`)
  }
}

for (const url of urls) {
  await ensureUrlAvailable(url)
}

console.log(`Running Lighthouse CI against ${urls.join(', ')}`)

mkdirSync(tempRoot, { recursive: true })

const failures = []

for (const [index, url] of urls.entries()) {
  const profileDir = join(tempRoot, `profile-${index}-${Date.now()}`)
  mkdirSync(profileDir, { recursive: true })

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', `--user-data-dir=${profileDir}`],
  })

  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices'],
    })

    const categories = runnerResult?.lhr.categories
    if (!categories) {
      failures.push(`${url} did not produce Lighthouse category results`)
      continue
    }

    const scores = {
      performance: categories.performance?.score ?? 0,
      accessibility: categories.accessibility?.score ?? 0,
      'best-practices': categories['best-practices']?.score ?? 0,
    }

    console.log(
      `${url}: performance ${scores.performance.toFixed(2)}, accessibility ${scores.accessibility.toFixed(2)}, best-practices ${scores['best-practices'].toFixed(2)}`
    )

    for (const [metric, minScore] of Object.entries(thresholds)) {
      if (scores[metric] < minScore) {
        failures.push(`${url} scored ${scores[metric].toFixed(2)} for ${metric}, below ${minScore.toFixed(2)}`)
      }
    }
  } finally {
    try {
      await chrome.kill()
    } catch (error) {
      if (error?.code !== 'EPERM') {
        throw error
      }

      console.warn(`Ignoring Chrome cleanup permission error for ${url}`)
    }

    rmSync(profileDir, { recursive: true, force: true })
  }
}

if (failures.length > 0) {
  console.error('Lighthouse smoke test failures:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Lighthouse smoke tests passed')