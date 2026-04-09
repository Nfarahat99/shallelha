#!/bin/bash
# Run Artillery load test against target URL
# Usage: ./load-test/run-load-test.sh <TARGET_URL>
#
# Example (local):   ./load-test/run-load-test.sh http://localhost:4000
# Example (staging): ./load-test/run-load-test.sh https://shallelha-server-production.up.railway.app
#
# INFRA-02 pass criteria:
# - 0 errors in the "errors" section
# - ~400 concurrent WebSocket connections sustained
# - p99 response time < 200ms in "socketio.response_time" metric

set -e

TARGET_URL="${1:-http://localhost:4000}"

echo "Running load test against: $TARGET_URL"
echo "Expected: ~400 WebSocket connections, 0 errors, p99 < 200ms"
echo ""

TARGET_URL="$TARGET_URL" npx artillery run load-test/100-rooms.yml

echo ""
echo "Load test complete. Review results above."
echo "Pass criteria: 0 errors, p99 < 200ms in socketio.response_time"
