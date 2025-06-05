require("dotenv").config();

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Configuration
const BASE_URL = "http://localhost:3000/api/v1";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

// Validate ADMIN_API_KEY
if (!ADMIN_API_KEY) {
  console.error(
    "\x1b[31mError: ADMIN_API_KEY environment variable is not set\x1b[0m"
  );
  console.log(
    "\x1b[33mPlease set the ADMIN_API_KEY environment variable:\x1b[0m"
  );
  console.log("Windows (CMD):");
  console.log("  set ADMIN_API_KEY=your-secure-api-key");
  console.log("Windows (PowerShell):");
  console.log("  $env:ADMIN_API_KEY='your-secure-api-key'");
  console.log("Linux/Mac:");
  console.log("  export ADMIN_API_KEY=your-secure-api-key");
  process.exit(1);
}

// Generate unique username
const timestamp = new Date().getTime();
const TEST_USERNAME = `testuser_${timestamp}`;
const ADMIN_USERNAME = `admin_${timestamp}`;

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

// Helper function to check response
const checkResponse = (response, message) => {
  if (response.status >= 200 && response.status < 300) {
    console.log(`${colors.green}✓ ${message}${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ ${message}${colors.reset}`);
    console.log(
      `${colors.red}Error: ${JSON.stringify(response.data, null, 2)}${
        colors.reset
      }`
    );
    return false;
  }
};

// Main test function
async function runTests() {
  let token;
  let chapterId;

  try {
    console.log(`${colors.yellow}Starting API Tests${colors.reset}`);
    console.log("=====================================");
    console.log(
      `${colors.yellow}Using ADMIN_API_KEY: ${ADMIN_API_KEY.substring(
        0,
        4
      )}...${colors.reset}`
    );

    // 1. Register Regular User
    console.log(`\n${colors.yellow}1. Register Regular User${colors.reset}`);
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      username: TEST_USERNAME,
      password: "Test123!",
    });
    checkResponse(registerResponse, "User registered successfully");

    // 2. Setup Admin User (requires ADMIN_API_KEY in header)
    console.log(`\n${colors.yellow}2. Setup Admin User${colors.reset}`);
    const adminResponse = await axios.post(
      `${BASE_URL}/auth/setup-admin`,
      {
        username: ADMIN_USERNAME,
        password: "Admin123!",
      },
      {
        headers: {
          "x-api-key": ADMIN_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    checkResponse(adminResponse, "Admin user created successfully");

    // 3. Login as Admin (to get token for non-admin protected routes if any)
    console.log(`\n${colors.yellow}3. Login as Admin${colors.reset}`);
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: ADMIN_USERNAME,
      password: "Admin123!",
    });
    if (checkResponse(loginResponse, "Login successful")) {
      token = loginResponse.data.token;
    }

    // 4. Create Chapter (requires ADMIN_API_KEY in header)
    console.log(`\n${colors.yellow}4. Create Chapter${colors.reset}`);
    const createResponse = await axios.post(
      `${BASE_URL}/chapters`,
      {
        name: "Integration",
        class: 12,
        unit: 1,
        subject: "Mathematics",
        status: "active",
        isWeakChapter: false,
        description: "Integration techniques and applications",
        difficultyLevel: "medium",
        estimatedTime: 120,
        prerequisites: ["Differentiation", "Basic Calculus"],
        learningObjectives: [
          "Understand integration techniques",
          "Apply integration in real-world problems",
        ],
      },
      {
        headers: {
          "x-api-key": ADMIN_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    if (checkResponse(createResponse, "Chapter created successfully")) {
      chapterId = createResponse.data.data.id;
    }

    // 5. Get All Chapters (can use JWT token)
    console.log(`\n${colors.yellow}5. Get All Chapters${colors.reset}`);
    const getAllResponse = await axios.get(`${BASE_URL}/chapters`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: 1,
        limit: 10,
        class: 12,
        unit: 1,
        status: "active",
        weakChapters: true,
        subject: "Mathematics",
      },
    });
    checkResponse(getAllResponse, "Retrieved all chapters");

    // 6. Get Chapter by ID (can use JWT token)
    console.log(`\n${colors.yellow}6. Get Chapter by ID${colors.reset}`);
    const getOneResponse = await axios.get(
      `${BASE_URL}/chapters/${chapterId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    checkResponse(getOneResponse, "Retrieved chapter by ID");

    // 7. Update Chapter (requires ADMIN_API_KEY in header)
    console.log(`\n${colors.yellow}7. Update Chapter${colors.reset}`);
    const updateResponse = await axios.put(
      `${BASE_URL}/chapters/${chapterId}`,
      {
        name: "Advanced Integration",
        class: 12,
        unit: 1,
        subject: "Mathematics",
        status: "active",
        isWeakChapter: true,
        description: "Advanced integration techniques and applications",
        difficultyLevel: "hard",
        estimatedTime: 150,
        prerequisites: ["Basic Integration", "Calculus"],
        learningObjectives: [
          "Master advanced integration techniques",
          "Apply integration in complex problems",
        ],
      },
      {
        headers: {
          "x-api-key": ADMIN_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    checkResponse(updateResponse, "Chapter updated successfully");

    // 8. Upload Multiple Chapters (requires ADMIN_API_KEY in header)
    console.log(`\n${colors.yellow}8. Upload Multiple Chapters${colors.reset}`);
    if (fs.existsSync(path.join(__dirname, "sample-chapters.json"))) {
      const formData = new FormData();
      formData.append(
        "file",
        fs.createReadStream(path.join(__dirname, "sample-chapters.json"))
      );

      const uploadResponse = await axios.post(
        `${BASE_URL}/chapters/upload`,
        formData,
        {
          headers: {
            "x-api-key": ADMIN_API_KEY,
            ...formData.getHeaders(),
          },
        }
      );
      checkResponse(uploadResponse, "Chapters uploaded successfully");
    } else {
      console.log(
        `${colors.yellow}Warning: sample-chapters.json not found, skipping upload test${colors.reset}`
      );
    }

    // 9. Test Rate Limiting (can use JWT token)
    console.log(`\n${colors.yellow}9. Testing Rate Limiting${colors.reset}`);
    for (let i = 1; i <= 5; i++) {
      console.log(`Request ${i}:`);
      const rateLimitResponse = await axios.get(`${BASE_URL}/chapters`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      checkResponse(rateLimitResponse, `Rate limit request ${i}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // 10. Delete Chapter (requires ADMIN_API_KEY in header)
    console.log(`\n${colors.yellow}10. Delete Chapter${colors.reset}`);
    const deleteResponse = await axios.delete(
      `${BASE_URL}/chapters/${chapterId}`,
      {
        headers: {
          "x-api-key": ADMIN_API_KEY,
        },
      }
    );
    checkResponse(deleteResponse, "Chapter deleted successfully");

    console.log(
      `\n${colors.green}All tests completed successfully!${colors.reset}`
    );
  } catch (error) {
    console.error(`${colors.red}Test failed:${colors.reset}`, error.message);
    if (error.response) {
      console.error(
        `${colors.red}Response data:${colors.reset}`,
        JSON.stringify(error.response.data, null, 2)
      );
    }
    process.exit(1);
  }
}

// Run the tests
runTests();
