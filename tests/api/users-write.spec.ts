import { expect, test, uniqueUserPayload } from './api-fixtures';
import {
  expectJsonSuccess,
  expectNoContent,
} from './helpers/response-assertions';

test.describe.configure({ mode: 'serial' });

test.describe('Users — POST, PUT, DELETE', () => {
  test('covers create, update, and delete with status and body checks', async ({
    apiContext,
  }) => {
    await test.step('positive: create user (POST) returns 201', async () => {
      const payload = uniqueUserPayload();
      const response = await apiContext.post('users', { data: payload });
      const body = await expectJsonSuccess(response, 201);
      expect(body.name).toBe(payload.name);
      expect(body.job).toBe(payload.job);
      expect(body.createdAt).toEqual(expect.any(String));
    });

    await test.step('positive: update user (PUT) returns 200', async () => {
      const response = await apiContext.put('users/2', {
        data: { name: 'morpheus', job: 'zion resident' },
      });
      const body = await expectJsonSuccess(response, 200);
      expect(body.name).toBe('morpheus');
      expect(body.updatedAt).toEqual(expect.any(String));
    });

    await test.step('positive: delete user (DELETE) returns 204', async () => {
      const response = await apiContext.delete('users/2');
      await expectNoContent(response);
    });
  });
});
