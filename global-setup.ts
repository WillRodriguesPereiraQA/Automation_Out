import { startReqresMockServer } from './tests/api/mock/reqres-mock-server';

export default async function globalSetup() {
  if (process.env.REQRES_MOCK !== '1') return;

  const port = Number(process.env.REQRES_MOCK_PORT ?? 3099);
  const server = await startReqresMockServer(port);
  process.env.API_BASE_URL = `http://127.0.0.1:${port}/api/`;

  (globalThis as { __REQRES_MOCK_SERVER__?: typeof server }).__REQRES_MOCK_SERVER__ =
    server;
}
