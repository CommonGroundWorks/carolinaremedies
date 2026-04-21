import autocannon from 'autocannon'

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:7000'

const scenarios = [
  {
    title: 'health endpoint',
    url: `${baseUrl}/api/health`,
    connections: 5,
    duration: 5,
    maxAverageLatency: 200,
    minAverageRequests: 20,
  },
  {
    title: 'products page',
    url: `${baseUrl}/products`,
    connections: 3,
    duration: 5,
    maxAverageLatency: 1500,
    minAverageRequests: 5,
  },
]

const ensureUrlAvailable = async (url) => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Expected ${url} to return a 2xx response, received ${response.status}`)
  }
}

const runScenario = (scenario) =>
  new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        url: scenario.url,
        connections: scenario.connections,
        duration: scenario.duration,
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        resolve(result)
      }
    )

    autocannon.track(instance, {
      renderProgressBar: false,
      renderResultsTable: false,
    })
  })

for (const scenario of scenarios) {
  await ensureUrlAvailable(scenario.url)
}

const failures = []

for (const scenario of scenarios) {
  console.log(`Running load smoke test for ${scenario.title}`)
  const result = await runScenario(scenario)

  console.log(
    `${scenario.title}: avg latency ${result.latency.average.toFixed(2)}ms, avg req/sec ${result.requests.average.toFixed(2)}`
  )

  if (result.latency.average > scenario.maxAverageLatency) {
    failures.push(
      `${scenario.title} exceeded average latency threshold (${result.latency.average.toFixed(2)}ms > ${scenario.maxAverageLatency}ms)`
    )
  }

  if (result.requests.average < scenario.minAverageRequests) {
    failures.push(
      `${scenario.title} did not reach average request threshold (${result.requests.average.toFixed(2)} < ${scenario.minAverageRequests})`
    )
  }
}

if (failures.length > 0) {
  console.error('Load smoke test failures:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Load smoke tests passed')