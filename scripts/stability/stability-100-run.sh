#!/bin/bash
# ================================================================================
# CR AUDIOVIZ AI - 100-RUN STABILITY TEST
# Produces: evidence/stability/100-run-test.json, evidence/stability/100-run-raw.log
# ================================================================================

set -e

TIMESTAMP=$(date -Iseconds)
OUTPUT_DIR="${OUTPUT_DIR:-evidence/stability}"
mkdir -p "$OUTPUT_DIR"

JSON_FILE="$OUTPUT_DIR/100-run-test.json"
RAW_LOG="$OUTPUT_DIR/100-run-raw.log"

# Endpoints to test
ENDPOINTS=(
  "https://craudiovizai.com/pricing"
  "https://craudiovizai.com/apps"
  "https://craudiovizai.com/api/health"
  "https://craudiovizai.com/dashboard"
)

# Initialize counters
declare -A success_count
declare -A fail_count
declare -A total_time

for ep in "${ENDPOINTS[@]}"; do
  key=$(echo "$ep" | sed 's|https://craudiovizai.com||')
  success_count[$key]=0
  fail_count[$key]=0
  total_time[$key]=0
done

echo "=== STABILITY 100-RUN TEST ===" > "$RAW_LOG"
echo "Timestamp: $TIMESTAMP" >> "$RAW_LOG"
echo "" >> "$RAW_LOG"

# Run 100 iterations
for i in $(seq 1 100); do
  echo "--- Run $i ---" >> "$RAW_LOG"
  
  for ep in "${ENDPOINTS[@]}"; do
    key=$(echo "$ep" | sed 's|https://craudiovizai.com||')
    
    # Make request with timing
    start_ms=$(date +%s%3N)
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$ep" 2>/dev/null || echo "000")
    end_ms=$(date +%s%3N)
    duration=$((end_ms - start_ms))
    
    # Check for degraded header (counts as success)
    if [ "$status" = "200" ]; then
      success_count[$key]=$((${success_count[$key]} + 1))
    else
      fail_count[$key]=$((${fail_count[$key]} + 1))
    fi
    
    total_time[$key]=$((${total_time[$key]} + duration))
    
    echo "$key: $status (${duration}ms)" >> "$RAW_LOG"
  done
  
  # Small delay to avoid rate limiting
  sleep 0.2
done

# Calculate results
echo "" >> "$RAW_LOG"
echo "=== RESULTS ===" >> "$RAW_LOG"

# Build JSON output
cat > "$JSON_FILE" << ENDJSON
{
  "test_type": "100-run stability test",
  "timestamp": "$TIMESTAMP",
  "total_runs": 100,
  "pass_threshold": 99,
  "results": {
ENDJSON

first=true
all_pass=true
for ep in "${ENDPOINTS[@]}"; do
  key=$(echo "$ep" | sed 's|https://craudiovizai.com||')
  success=${success_count[$key]}
  fail=${fail_count[$key]}
  rate=$((success * 100 / 100))
  avg_time=$((${total_time[$key]} / 100))
  
  if [ $success -lt 99 ]; then
    all_pass=false
  fi
  
  echo "$key: $success/100 = $rate% (avg ${avg_time}ms)" >> "$RAW_LOG"
  
  if [ "$first" = true ]; then
    first=false
  else
    echo "," >> "$JSON_FILE"
  fi
  
  cat >> "$JSON_FILE" << ENDJSON2
    "$key": {
      "success": $success,
      "fail": $fail,
      "rate": $rate,
      "avg_time_ms": $avg_time
    }
ENDJSON2
done

cat >> "$JSON_FILE" << ENDJSON3
  },
  "all_pass": $all_pass,
  "generated_at": "$(date -Iseconds)"
}
ENDJSON3

echo ""
echo "=== SUMMARY ==="
cat "$JSON_FILE"
echo ""
echo "Raw log: $RAW_LOG"
echo "JSON: $JSON_FILE"

if [ "$all_pass" = true ]; then
  echo "✅ ALL ENDPOINTS PASS ≥99%"
  exit 0
else
  echo "⚠️ SOME ENDPOINTS BELOW 99%"
  exit 1
fi
