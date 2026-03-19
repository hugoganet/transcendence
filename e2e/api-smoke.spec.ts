import { test, expect } from '@playwright/test';
import {
  API_URL,
  generateTestUser,
  registerUser,
  loginUser,
  type TestUser,
} from './fixtures/auth';

test.describe('API Smoke Tests', () => {
  test('health check returns 200 with ok status', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: { status: 'ok' } });
  });

  test.describe('Auth flow', () => {
    let user: TestUser;

    test.beforeAll(() => {
      user = generateTestUser();
    });

    test('register a new user returns 201', async ({ page }) => {
      const response = await registerUser(page, user);
      expect(response.status()).toBe(201);
    });

    test('login with registered user returns 200', async ({ page }) => {
      // Register first to ensure user exists
      await registerUser(page, user);
      const response = await loginUser(page, user);
      expect(response.status()).toBe(200);
    });

    test('unauthenticated curriculum request returns 401', async ({
      page,
    }) => {
      const response = await page.request.get(`${API_URL}/curriculum`, {
        failOnStatusCode: false,
      });
      expect(response.status()).toBe(401);
    });

    test('authenticated curriculum request returns 200', async ({ page }) => {
      // Register and login to get session
      await registerUser(page, user);
      const loginResponse = await loginUser(page, user);
      expect(loginResponse.status()).toBe(200);

      // The session cookie is automatically stored by Playwright's request context
      const response = await page.request.get(`${API_URL}/curriculum`);
      expect(response.status()).toBe(200);
    });
  });
});
