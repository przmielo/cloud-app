import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const samples = new SharedArray('payloads', () =>
  JSON.parse(open('./payload-samples.json'))
);

const API_URL = __ENV.API_URL ||
  'https://cloud-task-manager-api-pk-dfg9cvgnczb3fce3.germanywestcentral-01.azurewebsites.net';

export const options = {
  scenarios: {
    stage_10: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
      tags: { stage: '10users' },
      startTime: '0s',
    },
    stage_50: {
      executor: 'constant-vus',
      vus: 50,
      duration: '3m',
      tags: { stage: '50users' },
      startTime: '3m30s',
    },
    stage_100: {
      executor: 'constant-vus',
      vus: 100,
      duration: '3m',
      tags: { stage: '100users' },
      startTime: '7m',
    },
  },
  thresholds: {
    'http_req_duration{stage:10users}':  ['p(95)<2000', 'avg<1500'],
    'http_req_duration{stage:50users}':  ['p(95)<2000', 'avg<1500'],
    'http_req_duration{stage:100users}': ['p(95)<2000', 'avg<1500'],
    http_req_failed: ['rate<0.01'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

export default function () {
  const payload = samples[Math.floor(Math.random() * samples.length)];
  const res = http.post(
    `${API_URL}/api/loanapplication`,
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, {
    'status is 201': (r) => r.status === 201,
  });
}

export function handleSummary(data) {
  return {
    'tests/load/results/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
