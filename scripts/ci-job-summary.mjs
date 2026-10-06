import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (!summaryPath) {
  process.exit(0);
}

function readJsonResults() {
  const path = 'test-results/results.json';
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readJUnitStats() {
  const path = 'test-results/junit.xml';
  if (!existsSync(path)) return null;

  const xml = readFileSync(path, 'utf8');
  const testsuite = xml.match(/<testsuite[^>]*>/);
  if (!testsuite) return null;

  const attr = (name) => {
    const match = testsuite[0].match(new RegExp(`${name}="([^"]*)"`));
    return match?.[1];
  };

  return {
    tests: attr('tests'),
    failures: attr('failures'),
    errors: attr('errors'),
    skipped: attr('skipped'),
    time: attr('time'),
  };
}

const stats = readJUnitStats();
const report = readJsonResults();
const target =
  process.env.REQRES_MOCK === '1'
    ? 'Local ReqRes mock (CI default)'
    : 'Live https://reqres.in/api';

const lines = [
  '## API Tests CI — execution report',
  '',
  '| Field | Value |',
  '| --- | --- |',
  `| Workflow run | #${process.env.GITHUB_RUN_NUMBER ?? 'n/a'} (id ${process.env.GITHUB_RUN_ID ?? 'n/a'}) |`,
  `| Event | ${process.env.GITHUB_EVENT_NAME ?? 'n/a'} |`,
  `| Branch | ${process.env.GITHUB_REF_NAME ?? 'n/a'} |`,
  `| Commit | \`${(process.env.GITHUB_SHA ?? '').slice(0, 7)}\` |`,
  `| Target | ${target} |`,
  '',
];

if (stats) {
  lines.push(
    '### Aggregated results (JUnit)',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    `| Total tests | ${stats.tests ?? '0'} |`,
    `| Failures | ${stats.failures ?? '0'} |`,
    `| Errors | ${stats.errors ?? '0'} |`,
    `| Skipped | ${stats.skipped ?? '0'} |`,
    `| Duration (s) | ${stats.time ?? 'n/a'} |`,
    ''
  );
}

if (report?.suites?.length) {
  lines.push('### Suites and scenarios', '');
  for (const suite of report.suites) {
    lines.push(`- **${suite.title}**`);
    for (const spec of suite.specs ?? []) {
      const status = spec.tests?.[0]?.results?.[0]?.status ?? 'unknown';
      const icon =
        status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
      lines.push(`  - ${icon} ${spec.title}`);
    }
  }
  lines.push('');
}

lines.push(
  '### Artifacts',
  '',
  '- **playwright-report-\\<run\\>**: HTML report (download from this workflow run).',
  '- **api-test-results-\\<run\\>**: `junit.xml` and `results.json` for integrations.',
  '',
  '### Local reproduction',
  '',
  '```bash',
  'npm ci',
  'npm run test:ci        # uses REQRES_MOCK=1 when exported in CI',
  'npm run test:api:mock  # explicit mock run',
  'npm run test:api       # live reqres.in (requires API key / quota)',
  '```',
  ''
);

appendFileSync(summaryPath, lines.join('\n'));
