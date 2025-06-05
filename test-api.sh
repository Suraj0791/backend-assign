#!/bin/bash

# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        exit 1
    fi
}

# Function to extract token from JSON response
extract_token() {
    echo "$1" | grep -o '"token":"[^"]*' | cut -d'"' -f4
}

# Function to extract chapter ID from JSON response
extract_chapter_id() {
    echo "$1" | grep -o '"id":"[^"]*' | cut -d'"' -f4
}

echo -e "${YELLOW}Testing MathonGo Chapter Dashboard API${NC}"
echo "====================================="

# 1. Register Regular User
echo -e "\n${YELLOW}1. Register Regular User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123!"
  }')
echo "$REGISTER_RESPONSE"
check_status

# 2. Setup Admin User (requires ADMIN_API_KEY)
echo -e "\n${YELLOW}2. Setup Admin User${NC}"
if [ -z "$ADMIN_API_KEY" ]; then
    echo -e "${RED}Error: ADMIN_API_KEY environment variable is not set${NC}"
    exit 1
fi

ADMIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/setup-admin" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${ADMIN_API_KEY}" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }')
echo "$ADMIN_RESPONSE"
check_status

# 3. Login as Admin
echo -e "\n${YELLOW}3. Login as Admin${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }')
TOKEN=$(extract_token "$LOGIN_RESPONSE")

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get token. Response:${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}Token received successfully${NC}"

# 4. Create Single Chapter and capture the chapter ID
echo -e "\n${YELLOW}4. Create Single Chapter${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/chapters" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Integration",
    "class": 12,
    "unit": 1,
    "subject": "Mathematics",
    "status": "active",
    "isWeakChapter": false,
    "description": "Integration techniques and applications",
    "difficultyLevel": "medium",
    "estimatedTime": 120,
    "prerequisites": ["Differentiation", "Basic Calculus"],
    "learningObjectives": [
      "Understand integration techniques",
      "Apply integration in real-world problems"
    ]
  }')
CHAPTER_ID=$(extract_chapter_id "$CREATE_RESPONSE")

if [ -z "$CHAPTER_ID" ]; then
    echo -e "${RED}Failed to create chapter. Response:${NC}"
    echo "$CREATE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}Created Chapter ID: $CHAPTER_ID${NC}"

# 5. Get All Chapters (with filters)
echo -e "\n${YELLOW}5. Get All Chapters${NC}"
curl -s -X GET "${BASE_URL}/chapters?page=1&limit=10&class=12&unit=1&status=active&weakChapters=true&subject=Mathematics" \
  -H "Authorization: Bearer $TOKEN"
check_status

# 6. Get Chapter by ID
echo -e "\n${YELLOW}6. Get Chapter by ID${NC}"
curl -s -X GET "${BASE_URL}/chapters/${CHAPTER_ID}" \
  -H "Authorization: Bearer $TOKEN"
check_status

# 7. Update Chapter
echo -e "\n${YELLOW}7. Update Chapter${NC}"
curl -s -X PUT "${BASE_URL}/chapters/${CHAPTER_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Integration",
    "class": 12,
    "unit": 1,
    "subject": "Mathematics",
    "status": "active",
    "isWeakChapter": true,
    "description": "Advanced integration techniques and applications",
    "difficultyLevel": "hard",
    "estimatedTime": 150,
    "prerequisites": ["Basic Integration", "Calculus"],
    "learningObjectives": [
      "Master advanced integration techniques",
      "Apply integration in complex problems"
    ]
  }'
check_status

# 8. Upload Multiple Chapters
echo -e "\n${YELLOW}8. Upload Multiple Chapters${NC}"
if [ -f "sample-chapters.json" ]; then
    curl -s -X POST "${BASE_URL}/chapters/upload" \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@sample-chapters.json"
    check_status
else
    echo -e "${YELLOW}Warning: sample-chapters.json not found, skipping upload test${NC}"
fi

# 9. Test Rate Limiting
echo -e "\n${YELLOW}9. Testing Rate Limiting${NC}"
for i in {1..5}; do
    echo "Request $i:"
    curl -s -X GET "${BASE_URL}/chapters" \
      -H "Authorization: Bearer $TOKEN"
    echo -e "\n"
    sleep 1
done

# 10. Delete Chapter
echo -e "\n${YELLOW}10. Delete Chapter${NC}"
curl -s -X DELETE "${BASE_URL}/chapters/${CHAPTER_ID}" \
  -H "Authorization: Bearer $TOKEN"
check_status

echo -e "\n${GREEN}API Testing Complete${NC}" 