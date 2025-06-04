const request = require("supertest");
const app = require("../index");
const path = require("path");
const fs = require("fs");

describe("File Upload Tests", () => {
  const validApiKey = process.env.ADMIN_API_KEY || "admin_default_key";
  const testFilePath = path.join(__dirname, "../fixtures/sample-chapters.json");

  describe("File Upload Validation", () => {
    it("should reject non-JSON files", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", Buffer.from("not a json file"), {
          filename: "test.txt",
          contentType: "text/plain",
        })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe("Only JSON files are allowed");
    });

    it("should reject files larger than 5MB", async () => {
      // Create a large buffer
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", largeBuffer, {
          filename: "large.json",
          contentType: "application/json",
        })
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "File size too large. Maximum size is 5MB"
      );
    });

    it("should reject multiple files", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", testFilePath)
        .attach("file", testFilePath)
        .expect(400);

      expect(response.body.status).toBe("error");
      expect(response.body.message).toBe(
        "Too many files. Only one file is allowed"
      );
    });
  });

  describe("Successful Upload", () => {
    it("should successfully upload a valid JSON file", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", testFilePath)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toBeDefined();
      // Add more specific assertions based on your expected response format
    });

    it("should process the uploaded JSON data correctly", async () => {
      const fileContent = JSON.parse(fs.readFileSync(testFilePath, "utf8"));

      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", testFilePath)
        .expect(200);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveLength(fileContent.length);
      // Add more specific assertions based on your data processing logic
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON files", async () => {
      const malformedJson = Buffer.from("{invalid json}");

      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", malformedJson, {
          filename: "malformed.json",
          contentType: "application/json",
        })
        .expect(400);

      expect(response.body.status).toBe("error");
      // Add more specific assertions based on your error handling
    });

    it("should handle empty files", async () => {
      const response = await request(app)
        .post("/api/v1/chapters/upload")
        .set("x-api-key", validApiKey)
        .attach("file", Buffer.from(""), {
          filename: "empty.json",
          contentType: "application/json",
        })
        .expect(400);

      expect(response.body.status).toBe("error");
      // Add more specific assertions based on your error handling
    });
  });
});
