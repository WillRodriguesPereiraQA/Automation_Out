import { APIRequestContext, request, test as base } from '@playwright/test';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

type ApiFixtures = {
  apiContext: APIRequestContext;
  /** Serializes requests to reduce reqres.in rate limiting (429). */
  _throttle: void;
};

const MIN_GAP_MS = 900;
const RATE_LIMIT_BACKOFF_MS = [3_000, 6_000];
let lastRequestAt = 0;

async function throttleRequests() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_GAP_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

async function withRateLimitRetry<T extends { status: () => number }>(
  action: () => Promise<T>
): Promise<T> {
  let response = await action();
  for (const delayMs of RATE_LIMIT_BACKOFF_MS) {
    if (response.status() !== 429) return response;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    response = await action();
  }
  return response;
}

function wrapWithRetry(raw: APIRequestContext): APIRequestContext {
  return {
    ...raw,
    get: (url, options) => withRateLimitRetry(() => raw.get(url, options)),
    post: (url, options) => withRateLimitRetry(() => raw.post(url, options)),
    put: (url, options) => withRateLimitRetry(() => raw.put(url, options)),
    delete: (url, options) => withRateLimitRetry(() => raw.delete(url, options)),
    fetch: (url, options) => withRateLimitRetry(() => raw.fetch(url, options)),
  };
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;

  const envText = readFileSync(filePath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!key) continue;
    const value = rest.join('=').trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), '.env'));

export const REQRES_VALID_LOGIN = {
  email: process.env.REQRES_LOGIN_EMAIL ?? 'eve.holt@reqres.in',
  password: process.env.REQRES_LOGIN_PASSWORD ?? 'cityslicka',
};

export const test = base.extend<ApiFixtures>({
  _throttle: [
    async ({}, use) => {
      await throttleRequests();
      await use();
    },
    { auto: true },
  ],
  apiContext: async ({}, use) => {
    const baseURL =
      process.env.API_BASE_URL?.replace(/\/?$/, '/') ?? 'https://reqres.in/api/';

    const apiKey = process.env.REQRES_API_KEY ?? 'reqres-free-v1';

    const apiContext = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(process.env.REQRES_MOCK === '1' ? {} : { 'x-api-key': apiKey }),
      },
    });

    await use(wrapWithRetry(apiContext));
    await apiContext.dispose();
  },
});

export { expect } from '@playwright/test';

export function uniqueUserPayload() {
  const id = Date.now() + Math.floor(Math.random() * 100_000);
  return {
    name: `Automation User ${id}`,
    job: `QA Engineer ${id}`,
  };
}
