const request = require("supertest");
const app = require("../index");
const { errorResponse, successResponse } = require("../utils/response");

describe("Authentication Middleware Tests", () => {
  const validApiKey = process.env.ADMIN_API_KEY || "admin_default_key";
  const invalidApiKey = "invalid_key";

  describe("Public Endpoints with Optional Auth", () => {
    it("should allow access to public endpoints without auth", async () => {
      const response = await request(app).get("/api/v1/chapters").expect(200);

      expect(response.body.status).toBe("success");
    });

    it("should grant admin privileges with valid API key", async () => {
      const response = await request(app)
        .get("/api/v1/chapters")
        .set("x-api-key", validApiKey)
        .expect(200);

      expect(response.body.status).toBe("success");
      // Additional checks for admin-specific data if any
    });

    it("should work without admin privileges with invalid API key", async () => {
      const response = await request(app)
        .get("/api/v1/chapters")
        .set("x-api-key", invalidApiKey)
        .expect(200);

      expect(response.body.status).toBe("success");
      // Verify no admin-specific data is returned
    });
  });

  describe("Admin Protected Endpoints", () => {
    it("should reject access without API key", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .expect(401);

      expect(response.body).toEqual(
        errorResponse(
          "Missing API key. Provide x-api-key header or Authorization bearer token.",
          401
        )
      );
    });

    it("should reject access with invalid API key", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", invalidApiKey)
        .expect(403);

      expect(response.body).toEqual(
        errorResponse("Invalid API key. Admin access required.", 403)
      );
    });

    it("should allow access with valid API key", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", "test/fixtures/sample-chapters.json")
        .expect(200);

      expect(response.body.status).toBe("success");
    });

    it("should accept API key in Authorization header", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("Authorization", `Bearer ${validApiKey}`)
        .attach("file", "test/fixtures/sample-chapters.json")
        .expect(200);

      expect(response.body.status).toBe("success");
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed Authorization header", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("Authorization", "InvalidFormat")
        .expect(401);

      expect(response.body.status).toBe("error");
    });

    it("should handle server errors gracefully", async () => {
      // Simulate a server error by temporarily removing the API key from env
      const originalApiKey = process.env.ADMIN_API_KEY;
      delete process.env.ADMIN_API_KEY;

      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .expect(500);

      expect(response.body.status).toBe("error");

      // Restore the API key
      process.env.ADMIN_API_KEY = originalApiKey;
    });
  });
});
