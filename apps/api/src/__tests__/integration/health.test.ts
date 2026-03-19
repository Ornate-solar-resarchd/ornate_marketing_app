import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../index";

describe("Health Check", () => {
  it("GET /api/health should return 200 with status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /api/health timestamp should be a valid ISO string", async () => {
    const res = await request(app).get("/api/health");

    const date = new Date(res.body.timestamp);
    expect(date.toISOString()).toBe(res.body.timestamp);
  });
});
