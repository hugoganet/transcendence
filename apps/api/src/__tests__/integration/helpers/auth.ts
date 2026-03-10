/**
 * Auth helpers for integration tests.
 * Uses real API endpoints with Supertest agent for session cookie persistence.
 */
import supertest from "supertest";
import { app } from "./app.js";

export type TestAgent = ReturnType<typeof supertest.agent>;

interface UserCredentials {
  email: string;
  password: string;
  ageConfirmed?: boolean;
}

const DEFAULT_CREDENTIALS: UserCredentials = {
  email: "test@example.com",
  password: "Test123!@#",
  ageConfirmed: true,
};

/**
 * Register a user via the real API.
 */
export async function signupUser(
  agent: TestAgent,
  data?: Partial<UserCredentials>,
) {
  const creds = { ...DEFAULT_CREDENTIALS, ...data };
  return agent.post("/api/v1/auth/register").send(creds);
}

/**
 * Login a user via the real API. Session cookie is auto-persisted by the agent.
 */
export async function loginUser(
  agent: TestAgent,
  credentials?: Pick<UserCredentials, "email" | "password">,
) {
  const creds = {
    email: credentials?.email ?? DEFAULT_CREDENTIALS.email,
    password: credentials?.password ?? DEFAULT_CREDENTIALS.password,
  };
  return agent.post("/api/v1/auth/login").send(creds);
}

/**
 * Register + login a user in one call. Returns the agent with an active session.
 * Accepts an optional agent; creates one internally if not provided.
 */
export async function createAndLoginUser(
  agentOrOverrides?: TestAgent | Partial<UserCredentials>,
  overrides?: Partial<UserCredentials>,
): Promise<TestAgent> {
  let agent: TestAgent;
  let creds: UserCredentials;

  if (agentOrOverrides && "get" in agentOrOverrides) {
    // First arg is a TestAgent
    agent = agentOrOverrides;
    creds = { ...DEFAULT_CREDENTIALS, ...overrides };
  } else {
    agent = supertest.agent(app);
    creds = { ...DEFAULT_CREDENTIALS, ...(agentOrOverrides as Partial<UserCredentials> | undefined) };
  }

  // Register (creates the user in real DB)
  await agent.post("/api/v1/auth/register").send(creds).expect(201);

  // Explicitly login to establish a session (don't rely on auto-login from register)
  await loginUser(agent, { email: creds.email, password: creds.password });

  return agent;
}
