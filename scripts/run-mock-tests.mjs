import { spawnSync } from 'node:child_process';

process.env.REQRES_MOCK = '1';

const result = spawnSync('npx', ['playwright', 'test', 'tests/api'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
