var axios = require("axios");

var BASE_URL = "http://localhost:3000/api/v1";
var TEST_USER = {
  username: "testuser_" + Date.now(), // Make username unique
  email: "test_" + Date.now() + "@example.com", // Add email if required
  password: "Test123!",
};

// Helper function to format console output
function logTestResult(testName, success, details) {
  details = details || "";
  var status = success ? "✅ PASS" : "❌ FAIL";
  console.log("\n" + status + " - " + testName);
  if (details) console.log(details);
}

// Function to test authentication
function testAuth() {
  return new Promise(function (resolve) {
    fetch(BASE_URL + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    })
      .then(function (registerResponse) {
        return registerResponse.text().then(function (responseText) {
          try {
            var responseData = JSON.parse(responseText);
            logTestResult(
              "User Registration",
              registerResponse.ok,
              "Status: " + registerResponse.status + 
              (registerResponse.ok ? "" : "\nError: " + (responseData.message || responseText))
            );
          } catch (e) {
            logTestResult(
              "User Registration",
              registerResponse.ok,
              "Status: " + registerResponse.status + "\nResponse: " + responseText
            );
          }

          return fetch(BASE_URL + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: TEST_USER.username,
              password: TEST_USER.password
            }),
          });
        });
      })
      .then(function (loginResponse) {
        return loginResponse.json().then(function (loginData) {
          logTestResult(
            "User Login",
            loginResponse.ok,
            "Status: " +
              loginResponse.status +
              ", Token received: " +
              !!loginData.token +
              (loginResponse.ok ? "" : "\nError: " + (loginData.message || ""))
          );
          resolve(loginData.token);
        });
      })
      .catch(function (error) {
        console.error("Auth test error:", error.message);
        resolve(null);
      });
  });
}

// Function to test chapter endpoints
function testChapterEndpoints(token) {
  var headers = token ? { Authorization: "Bearer " + token } : {};

  var firstCallStart = Date.now();
  fetch(BASE_URL + "/chapters", { headers: headers })
    .then(function (firstCall) {
      var firstCallDuration = Date.now() - firstCallStart;
      return firstCall.json().then(function () {
        logTestResult(
          "Testing GET /chapters endpoint (first call)",
          firstCall.ok
        );
        logTestResult(
          "First Call Performance",
          firstCall.ok,
          "Response time: " +
            firstCallDuration +
            "ms\nStatus: " +
            firstCall.status
        );

        var secondCallStart = Date.now();
        return axios
          .get(BASE_URL + "/chapters", { headers: headers })
          .then(function (secondCall) {
            var secondCallDuration = Date.now() - secondCallStart;
            return Promise.resolve().then(function () {
              logTestResult(
                "Testing GET /chapters endpoint (second call - Redis cache check)",
                secondCall.status === 200
              );

              var improvement = (
                ((firstCallDuration - secondCallDuration) / firstCallDuration) *
                100
              ).toFixed(2);
              logTestResult(
                "Redis Cache Performance",
                secondCallDuration < firstCallDuration,
                "First call: " +
                  firstCallDuration +
                  "ms\nSecond call: " +
                  secondCallDuration +
                  "ms\nImprovement: " +
                  improvement +
                  "%"
              );

              // Test rate limiting with proper sequential requests
              return testRateLimiting(headers);
            });
          });
      });
    })
    .catch(function (error) {
      console.error("Error during testing:", error.message);
    });
}

// Separate function for rate limiting test
function testRateLimiting(headers) {
  return new Promise(function(resolve) {
    logTestResult(
      "Testing Rate Limiting",
      true,
      "Making requests to exceed rate limit..."
    );

    var requestCount = 0;
    var blockedCount = 0;
    var totalRequests = 35; // Exceed the limit of 30

    function makeRequest() {
      return axios
        .get(BASE_URL + "/chapters", { headers: headers })
        .then(function (response) {
          requestCount++;
          console.log(`Request ${requestCount}: Status ${response.status}`);
          return { status: response.status, blocked: false };
        })
        .catch(function (error) {
          requestCount++;
          var status = error.response?.status || 500;
          var blocked = status === 429;
          if (blocked) blockedCount++;
          console.log(`Request ${requestCount}: Status ${status} ${blocked ? '(BLOCKED)' : ''}`);
          return { status: status, blocked: blocked };
        });
    }

    // Make requests sequentially with small delay to ensure rate limiting works
    function makeSequentialRequests(remaining) {
      if (remaining <= 0) {
        logTestResult(
          "Rate Limiting Protection",
          blockedCount > 0,
          `${blockedCount} out of ${totalRequests} requests were blocked (Status 429)`
        );
        resolve();
        return;
      }

      makeRequest().then(function() {
        // Small delay between requests to ensure they're processed separately
        setTimeout(function() {
          makeSequentialRequests(remaining - 1);
        }, 50);
      });
    }

    makeSequentialRequests(totalRequests);
  });
}

// Function to clear rate limit for testing (optional)
function clearRateLimit() {
  return axios.delete(BASE_URL + "/admin/rate-limit-reset")
    .then(() => console.log("Rate limit cleared for testing"))
    .catch(() => console.log("Rate limit clear not available (optional)"));
}

// Run all tests
function runAllTests() {
  console.log("🚀 Starting API, Auth, and Redis functionality tests...\n");
  
  // Wait a moment for server to be ready
  setTimeout(function() {
    testAuth().then(function (token) {
      setTimeout(function() {
        testChapterEndpoints(token);
        setTimeout(function() {
          console.log("\n✨ All tests completed!\n");
        }, 1000);
      }, 1000);
    });
  }, 2000);
}

runAllTests();