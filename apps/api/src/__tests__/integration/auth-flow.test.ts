import supertest from "supertest";
import { app, prisma } from "./helpers/app.js";
import { resetDatabase, seedTestUser } from "./helpers/db.js";
import { createAndLoginUser, signupUser, loginUser } from "./helpers/auth.js";

beforeEach(async () => {
  await resetDatabase();
});

describe("Auth flow (real DB + real Redis sessions)", () => {
  const credentials = {
    email: "auth-test@example.com",
    password: "Test123!@#",
    ageConfirmed: true,
  };

  it("registers a new user → 201, user exists in real DB", async () => {
    const agent = supertest.agent(app);
    const res = await signupUser(agent, credentials);

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(credentials.email);

    // Verify user actually exists in the real test database
    const dbUser = await prisma.user.findUnique({
      where: { email: credentials.email },
    });
    expect(dbUser).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(dbUser!.email).toBe(credentials.email);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(dbUser!.ageConfirmed).toBe(true);
  });

  it("logs in with a DB-seeded user → 200 + session cookie", async () => {
    // Use seedTestUser to create user directly in DB (bypasses API registration)
    await seedTestUser({
      email: credentials.email,
      password: credentials.password,
      ageConfirmed: credentials.ageConfirmed,
    });

    const loginAgent = supertest.agent(app);
    const res = await loginUser(loginAgent, credentials);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(credentials.email);

    // Session cookie should be set
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes("connect.sid"))).toBe(true);
  });

  it("GET /api/v1/auth/me with session → returns user profile from real DB", async () => {
    const agent = await createAndLoginUser(credentials);

    const res = await agent.get("/api/v1/auth/me").expect(200);

    expect(res.body.data.email).toBe(credentials.email);
    expect(res.body.data).not.toHaveProperty("passwordHash");
  });

  it("logout → session destroyed → GET /me → 401", async () => {
    const agent = await createAndLoginUser(credentials);

    // Verify authenticated
    await agent.get("/api/v1/auth/me").expect(200);

    // Logout
    await agent.post("/api/v1/auth/logout").expect(200);

    // Session should be destroyed — /me returns 401
    await agent.get("/api/v1/auth/me").expect(401);
  });

  it("duplicate registration → 409 EMAIL_ALREADY_EXISTS", async () => {
    const agent = supertest.agent(app);
    await signupUser(agent, credentials);

    // Try registering again with same email
    const agent2 = supertest.agent(app);
    const res = await signupUser(agent2, credentials);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });
});
