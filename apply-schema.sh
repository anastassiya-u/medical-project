#!/bin/bash
# Apply Supabase Schema via curl
# This script attempts to apply the schema using Supabase's REST API

set -e

echo "🔧 Supabase Schema Application Script"
echo "======================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    exit 1
fi

# Load environment variables
source <(grep -v '^#' .env.local | sed 's/^/export /')

# Verify credentials
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Supabase credentials not found in .env.local"
    exit 1
fi

echo "✓ Loaded Supabase credentials"
echo "  URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Read schema
SCHEMA_FILE="supabase/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Error: Schema file not found: $SCHEMA_FILE"
    exit 1
fi

echo "✓ Found schema file: $SCHEMA_FILE"
SCHEMA_CONTENT=$(cat "$SCHEMA_FILE")
LINE_COUNT=$(wc -l < "$SCHEMA_FILE" | tr -d ' ')
echo "  Lines: $LINE_COUNT"
echo ""

# Attempt 1: Use Supabase Management API (requires service_role key)
echo "⚠️  Note: The anon key cannot execute DDL statements."
echo "   Schema application requires Supabase SQL Editor access."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MANUAL APPLICATION REQUIRED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: Copy to Clipboard"
echo "────────────────────────────"
echo "Run this command:"
echo ""
echo "  cat supabase/schema.sql | pbcopy"
echo ""
echo "Then:"
echo "1. Open: https://app.supabase.com/project/rdcuqbsqnyzwxnyvndsq/sql/new"
echo "2. Paste (Cmd+V)"
echo "3. Click 'Run' button"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 2: Verify SQL Editor Access"
echo "────────────────────────────────────"
echo "If paste fails, check:"
echo "1. Are you logged into Supabase?"
echo "2. Is project 'rdcuqbsqnyzwxnyvndsq' accessible?"
echo "3. Do you have 'Owner' or 'Admin' role?"
echo ""
echo "Test access:"
echo "  curl -I '$NEXT_PUBLIC_SUPABASE_URL/rest/v1/' \\"
echo "    -H 'apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY'"
echo ""
echo "Expected: HTTP/1.1 200 OK or 401 (with auth challenge)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
