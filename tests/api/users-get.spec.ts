import { expect, test } from './api-fixtures';
import {
  expectJsonError,
  expectJsonSuccess,
} from './helpers/response-assertions';

test.describe.configure({ mode: 'serial' });

test.describe('Users — GET endpoints', () => {
  test('covers list, detail, and not-found responses', async ({ apiContext }) => {
    await test.step('positive: list users with pagination metadata', async () => {
      const response = await apiContext.get('users', { params: { page: 1 } });
      const body = await expectJsonSuccess(response, 200);
      expect(body.page).toBe(1);
      expect(body.data[0]).toMatchObject({
        id: expect.any(Number),
        email: expect.stringContaining('@'),
      });
    });

    await test.step('positive: get existing user by id', async () => {
      const response = await apiContext.get('users/2');
      const body = await expectJsonSuccess(response, 200);
      expect(body.data.id).toBe(2);
    });

    await test.step('negative: get non-existent user returns 404', async () => {
      const response = await apiContext.get('users/999');
      expectJsonError(response, 404);
    });
  });
});
