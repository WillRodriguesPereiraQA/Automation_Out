import { expect, test } from './api-fixtures';

test.describe('HTTP methods — unsupported verbs', () => {
  test('covers invalid verb and GET JSON response headers', async ({ apiContext }) => {
    await test.step('negative: TRACE on users resource returns 405', async () => {
      const response = await apiContext.fetch('users/2', { method: 'TRACE' });
      expect(response.status()).toBe(405);
    });

    await test.step('positive: GET returns JSON Content-Type', async () => {
      const response = await apiContext.get('users/2');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
    });
  });
});
