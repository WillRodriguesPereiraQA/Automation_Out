import { REQRES_VALID_LOGIN, expect, test } from './api-fixtures';
import {
  expectJsonError,
  expectJsonSuccess,
} from './helpers/response-assertions';

test.describe.configure({ mode: 'serial' });

test.describe('Authentication — POST /login and /register', () => {
  test('covers login and register positive and negative scenarios', async ({
    apiContext,
  }) => {
    await test.step('positive: login with valid credentials', async () => {
      const response = await apiContext.post('login', {
        data: REQRES_VALID_LOGIN,
      });
      const body = await expectJsonSuccess(response, 200);
      expect(body.token).toEqual(expect.any(String));
    });

    await test.step('negative: login with unknown user returns 400', async () => {
      const response = await apiContext.post('login', {
        data: { email: 'unknown.user@example.com', password: 'wrong-password' },
      });
      expectJsonError(response, 400);
    });

    await test.step('negative: login with missing password returns 400', async () => {
      const response = await apiContext.post('login', {
        data: { email: REQRES_VALID_LOGIN.email },
      });
      expectJsonError(response, 400);
    });

    await test.step('positive: register with valid credentials', async () => {
      const response = await apiContext.post('register', {
        data: REQRES_VALID_LOGIN,
      });
      const body = await expectJsonSuccess(response, 200);
      expect(body).toMatchObject({
        token: expect.any(String),
        id: expect.any(Number),
      });
    });

    await test.step('negative: register without password returns 400', async () => {
      const response = await apiContext.post('register', {
        data: { email: REQRES_VALID_LOGIN.email },
      });
      expectJsonError(response, 400);
    });
  });
});
