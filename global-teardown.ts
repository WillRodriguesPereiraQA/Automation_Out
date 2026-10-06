import type { Server } from 'http';

export default async function globalTeardown() {
  const server = (globalThis as { __REQRES_MOCK_SERVER__?: Server })
    .__REQRES_MOCK_SERVER__;
  if (!server) return;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
