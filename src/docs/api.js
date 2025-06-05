/**
 * Chapter Performance Dashboard API Documentation
 * @module api-docs
 */

const apiDocs = {
  info: {
    title: "Chapter Performance Dashboard API",
    version: "1.0.0",
    description:
      "API for managing chapter performance data with authentication and caching",
    contact: {
      name: "Development Team",
      url: "https://github.com/yourusername/mathongo-backend",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://13.60.65.158",
      description: "Production server",
    },
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  paths: {
    "/": {
      get: {
        summary: "Get API Information",
        description:
          "Returns basic information about the API and available endpoints",
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  message: "Chapter Performance Dashboard API",
                  version: "1.0.0",
                  endpoints: {
                    chapters: "/api/v1/chapters",
                    auth: "/api/v1/auth",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth": {
      get: {
        summary: "Get Auth Endpoints",
        description:
          "Returns information about available authentication endpoints",
        responses: {
          200: {
            description: "List of auth endpoints",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  message: "Auth API Endpoints",
                  endpoints: {
                    register: {
                      method: "POST",
                      path: "/api/v1/auth/register",
                    },
                    login: {
                      method: "POST",
                      path: "/api/v1/auth/login",
                    },
                    setupAdmin: {
                      method: "POST",
                      path: "/api/v1/auth/setup-admin",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        summary: "Register New User",
        description: "Create a new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: {
                    type: "string",
                    description: "User's username",
                  },
                  password: {
                    type: "string",
                    description: "User's password",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
          },
          400: {
            description: "Invalid input",
          },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "User Login",
        description: "Authenticate user and get JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: {
                    type: "string",
                  },
                  password: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  token: "jwt_token_here",
                },
              },
            },
          },
          401: {
            description: "Invalid credentials",
          },
        },
      },
    },
    "/api/v1/chapters": {
      get: {
        summary: "Get All Chapters",
        description: "Retrieve a list of chapters with pagination",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number",
            schema: {
              type: "integer",
              default: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Items per page",
            schema: {
              type: "integer",
              default: 10,
            },
          },
        ],
        responses: {
          200: {
            description: "List of chapters",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  data: {
                    chapters: [],
                    pagination: {
                      currentPage: 1,
                      totalPages: 1,
                      totalItems: 0,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/chapters/upload": {
      post: {
        summary: "Upload Chapters",
        description: "Bulk upload chapters from JSON file",
        security: [
          {
            ApiKeyAuth: [],
          },
        ],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Chapters uploaded successfully",
          },
          400: {
            description: "Invalid file format",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

module.exports = apiDocs;
