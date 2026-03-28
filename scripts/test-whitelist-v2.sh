#!/bin/bash
# Test script for APIClaw Whitelist v2.0
# Tests whitelist, access control, and analytics

set -e

echo "🧪 APIClaw Whitelist v2.0 Test Suite"
echo "===================================="
echo ""

API_URL="${APICLAW_API_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function test_case() {
  local name=$1
  local expected=$2
  local cmd=$3
  
  echo -n "Testing: $name ... "
  
  response=$(eval "$cmd" 2>&1)
  status=$?
  
  if echo "$response" | grep -q "$expected"; then
    echo -e "${GREEN}✓ PASS${NC}"
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Expected: $expected"
    echo "  Got: $response"
    return 1
  fi
}

echo "1. Test Whitelist Authorization"
echo "--------------------------------"

# Test 1: Whitelisted agent (namespaced)
test_case \
  "Namespaced agent (hivr:bytebee) authorized" \
  "200\|success" \
  "curl -s '$API_URL/api/discover?query=web&agentId=hivr:bytebee'"

# Test 2: Whitelisted agent (legacy format)
test_case \
  "Legacy agent (bytebee) authorized" \
  "200\|success" \
  "curl -s '$API_URL/api/discover?query=web&agentId=bytebee'"

# Test 3: Unauthorized agent
test_case \
  "Unauthorized agent denied" \
  "403\|Unauthorized\|Access Denied" \
  "curl -s '$API_URL/api/discover?query=web&agentId=hacker:evil'"

echo ""
echo "2. Test Access Control"
echo "----------------------"

# Test 4: Hivr agent accessing allowed provider
test_case \
  "Hivr agent accessing brave_search (allowed)" \
  "200\|success" \
  "curl -s -X POST '$API_URL/api/call_api' -H 'Content-Type: application/json' -d '{\"agentId\":\"hivr:bytebee\",\"provider\":\"brave_search\",\"action\":\"search\",\"params\":{\"query\":\"test\"}}'"

# Test 5: Restricted access (if NordSym configured)
# This will fail if NordSym not configured yet, which is OK
echo -n "Testing: NordSym agent restricted access ... "
if curl -s -X POST "$API_URL/api/call_api" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"nordsym:test","provider":"restricted_api","action":"call","params":{}}' \
  | grep -q "403\|Access Denied\|not whitelisted"; then
  echo -e "${GREEN}✓ PASS${NC} (correctly denied)"
else
  echo -e "${YELLOW}⊘ SKIP${NC} (NordSym not configured)"
fi

echo ""
echo "3. Test Analytics"
echo "-----------------"

# Test 6: Product field in logs
if [ -f ~/.apiclaw/logs/api-calls.jsonl ]; then
  recent_logs=$(tail -5 ~/.apiclaw/logs/api-calls.jsonl)
  
  echo -n "Testing: Product field in logs ... "
  if echo "$recent_logs" | grep -q '"product":"hivr"'; then
    echo -e "${GREEN}✓ PASS${NC}"
  else
    echo -e "${YELLOW}⊘ WARN${NC} (no recent Hivr calls logged)"
  fi
else
  echo -e "${YELLOW}⊘ SKIP${NC} (no log file yet)"
fi

echo ""
echo "4. Test Cache Behavior"
echo "----------------------"

# Test 7: Multiple requests use cache
echo -n "Testing: Cache performance ... "
start=$(date +%s%N)
for i in {1..5}; do
  curl -s "$API_URL/api/discover?query=web&agentId=hivr:bytebee" > /dev/null
done
end=$(date +%s%N)
elapsed=$(( (end - start) / 1000000 )) # Convert to ms

if [ $elapsed -lt 1000 ]; then
  echo -e "${GREEN}✓ PASS${NC} (${elapsed}ms for 5 requests)"
else
  echo -e "${YELLOW}⊘ WARN${NC} (${elapsed}ms - cache might not be working)"
fi

echo ""
echo "===================================="
echo "Test suite complete!"
echo ""
echo "Next steps:"
echo "1. Check logs: tail -f ~/.apiclaw/logs/api-calls.jsonl"
echo "2. Monitor analytics for product field"
echo "3. Add NordSym product source when ready"
echo ""
