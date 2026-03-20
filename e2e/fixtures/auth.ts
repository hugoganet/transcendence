import { type Page } from '@playwright/test';

export const API_URL = 'http://localhost:3000/api/v1';

export interface TestUser {
  email: string;
  password: string;
  username: string;
}

export function generateTestUser(): TestUser {
  const id = Date.now();
  return {
    email: `test-${id}@e2e.local`,
    password: `P@ssw0rd_${id}`,
    username: `testuser_${id}`,
  };
}

export async function registerUser(
  page: Page,
  user: TestUser,
): Promise<Response> {
  return page.request.post(`${API_URL}/auth/register`, {
    data: {
      email: user.email,
      password: user.password,
      username: user.username,
    },
  });
}

export async function loginUser(
  page: Page,
  user: TestUser,
): Promise<Response> {
  return page.request.post(`${API_URL}/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  });
}
