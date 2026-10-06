import { REQRES_VALID_LOGIN, test } from './api-fixtures';
import { expectJsonError } from './helpers/response-assertions';

test.describe.configure({ mode: 'serial' });

test.describe('Validation — malformed payloads and missing data', () => {
  test('covers malformed JSON, empty payloads, and invalid auth', async ({
    apiContext,
  }) => {
    await test.step('negative: malformed JSON on login returns 400', async () => {
      const response = await apiContext.post('login', {
        data: '{ email: broken-json }',
      });
      expectJsonError(response, 400);
    });

    await test.step('negative: malformed JSON on create user returns 400', async () => {
      const response = await apiContext.post('users', {
        data: 'not-valid-json',
      });
      expectJsonError(response, 400);
    });

    await test.step('negative: login with empty body returns 400', async () => {
      const response = await apiContext.post('login', { data: {} });
      expectJsonError(response, 400);
    });

    await test.step('negative: invalid bearer token on login returns 401', async () => {
      const response = await apiContext.post('login', {
        headers: { Authorization: 'Bearer invalid-token' },
        data: REQRES_VALID_LOGIN,
      });
      expectJsonError(response, 401);
    });

    await test.step('negative: register rejects missing email field', async () => {
      const response = await apiContext.post('register', {
        data: { password: REQRES_VALID_LOGIN.password },
      });
      expectJsonError(response, 400);
    });
  });
});
