import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { validate } from "./validate.js";
import { errorHandler } from "./errorHandler.js";

function createApp() {
  const app = express();
  app.use(express.json());

  const bodySchema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0),
  });

  app.post("/test", validate({ body: bodySchema }), (_req, res) => {
    res.json({ data: _req.body });
  });

  const paramsSchema = z.object({
    id: z.string().uuid(),
  });

  app.get("/test/:id", validate({ params: paramsSchema }), (req, res) => {
    res.json({ data: { id: req.params.id } });
  });

  const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
  });

  app.get("/search", validate({ query: querySchema }), (_req, res) => {
    res.json({ data: { page: res.locals.query.page } });
  });

  app.use(errorHandler);
  return app;
}

describe("validate middleware", () => {
  const app = createApp();

  describe("body validation", () => {
    it("passes valid body through", async () => {
      const res = await request(app)
        .post("/test")
        .send({ name: "Alice", age: 30 });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ name: "Alice", age: 30 });
    });

    it("returns 400 with field errors for invalid body", async () => {
      const res = await request(app).post("/test").send({ name: "", age: -1 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
      expect(res.body.error.details).toHaveProperty("name");
      expect(res.body.error.details).toHaveProperty("age");
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app).post("/test").send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("params validation", () => {
    it("passes valid params through", async () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const res = await request(app).get(`/test/${uuid}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(uuid);
    });

    it("returns 400 for invalid params", async () => {
      const res = await request(app).get("/test/not-a-uuid");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("query validation", () => {
    it("passes valid query through", async () => {
      const res = await request(app).get("/search?page=2");

      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(2);
    });

    it("returns 400 for invalid query", async () => {
      const res = await request(app).get("/search?page=-1");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });
  });
});
