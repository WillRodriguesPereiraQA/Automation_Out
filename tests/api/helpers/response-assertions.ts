import { APIResponse, expect } from '@playwright/test';

export async function expectJsonSuccess(
  response: APIResponse,
  expectedStatus: number
) {
  expect(response.status(), 'HTTP status').toBe(expectedStatus);
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, 'Content-Type header').toContain('application/json');
  return response.json();
}

export function expectJsonError(response: APIResponse, expectedStatus: number) {
  expect(response.status(), 'HTTP status').toBe(expectedStatus);
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, 'Content-Type header').toContain('application/json');
}

export async function expectNoContent(response: APIResponse) {
  expect(response.status(), 'HTTP status').toBe(204);
  const body = await response.text();
  expect(body, 'response body').toBe('');
}
