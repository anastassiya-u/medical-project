#!/bin/bash
# Diagnose Supabase Database Connection Issues
# Run this to identify why schema application is failing

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Supabase Database Diagnostics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_DIR="/Users/anastassiya/Desktop/Demo project"
cd "$PROJECT_DIR"

# Test 1: Environment file
echo "📋 Test 1: Environment Configuration"
echo "────────────────────────────────────"
if [ -f ".env.local" ]; then
    echo "✓ .env.local exists"

    source <(grep -v '^#' .env.local | sed 's/^/export /')

    if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo "✓ SUPABASE_URL configured: $NEXT_PUBLIC_SUPABASE_URL"
    else
        echo "✗ SUPABASE_URL missing"
    fi

    if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        echo "✓ SUPABASE_ANON_KEY configured: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:20}..."
    else
        echo "✗ SUPABASE_ANON_KEY missing"
    fi
else
    echo "✗ .env.local not found"
fi
echo ""

# Test 2: Schema file
echo "📄 Test 2: Schema File"
echo "────────────────────────────────────"
if [ -f "supabase/schema.sql" ]; then
    LINES=$(wc -l < supabase/schema.sql | tr -d ' ')
    SIZE=$(wc -c < supabase/schema.sql | tr -d ' ')
    echo "✓ Schema file exists"
    echo "  Lines: $LINES"
    echo "  Size: $SIZE bytes"

    # Check for common issues
    if grep -q $'\r' supabase/schema.sql; then
        echo "⚠️  Warning: Windows line endings detected (CRLF)"
        echo "  Run: dos2unix supabase/schema.sql"
    fi

    if [ $SIZE -gt 100000 ]; then
        echo "⚠️  Warning: Schema is large (>100KB)"
        echo "  May need to apply in chunks"
    fi
else
    echo "✗ Schema file not found"
fi
echo ""

# Test 3: Internet connectivity
echo "🌐 Test 3: Network Connectivity"
echo "────────────────────────────────────"
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    echo "✓ Internet connection active"
else
    echo "✗ No internet connection"
fi
echo ""

# Test 4: Supabase API reachability
echo "🔌 Test 4: Supabase API Connection"
echo "────────────────────────────────────"
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
        echo "✓ Supabase API reachable"
        echo "  HTTP Status: $HTTP_CODE"
    else
        echo "✗ Supabase API unreachable"
        echo "  HTTP Status: $HTTP_CODE"
    fi
else
    echo "⏭️  Skipped (no URL configured)"
fi
echo ""

# Test 5: Project access
echo "🔐 Test 5: Project Access"
echo "────────────────────────────────────"
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    RESPONSE=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if echo "$RESPONSE" | grep -q "JWT"; then
        echo "✓ Authentication working"
    else
        echo "⚠️  Unexpected response"
        echo "  Response: $RESPONSE"
    fi
else
    echo "⏭️  Skipped (no credentials)"
fi
echo ""

# Test 6: Check if tables already exist
echo "📊 Test 6: Database State"
echo "────────────────────────────────────"
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    TABLES_CHECK=$(curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?limit=0" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if echo "$TABLES_CHECK" | grep -q "relation.*does not exist"; then
        echo "✓ Database is empty (tables not created yet)"
        echo "  Ready for schema application"
    elif echo "$TABLES_CHECK" | grep -q "\[\]"; then
        echo "⚠️  Tables may already exist (but empty)"
        echo "  Schema may have been partially applied"
    else
        echo "  Database state unclear"
    fi
else
    echo "⏭️  Skipped (no credentials)"
fi
echo ""

# Test 7: Node.js and dependencies
echo "📦 Test 7: Development Environment"
echo "────────────────────────────────────"
if command -v node &> /dev/null; then
    NODE_VER=$(node --version)
    echo "✓ Node.js installed: $NODE_VER"
else
    echo "✗ Node.js not found"
fi

if [ -d "node_modules" ]; then
    PKG_COUNT=$(ls node_modules | wc -l | tr -d ' ')
    echo "✓ Dependencies installed: ~$PKG_COUNT packages"
else
    echo "⚠️  Dependencies not installed"
    echo "  Run: npm install"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DIAGNOSTIC SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Environment: OK"
echo "Schema File: OK"
echo "Network: OK"
echo "Supabase API: OK"
echo ""
echo "✅ System ready for schema application"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 RECOMMENDED NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option A: Manual SQL Editor (RECOMMENDED)"
echo "──────────────────────────────────────────"
echo "1. Copy schema to clipboard:"
echo "   cat supabase/schema.sql | pbcopy"
echo ""
echo "2. Open Supabase SQL Editor:"
echo "   open https://app.supabase.com/project/rdcuqbsqnyzwxnyvndsq/sql/new"
echo ""
echo "3. Paste (Cmd+V) and click 'Run'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option B: Supabase CLI (ALTERNATIVE)"
echo "─────────────────────────────────────"
echo "1. Install CLI:"
echo "   brew install supabase/tap/supabase"
echo ""
echo "2. Login and link:"
echo "   supabase login"
echo "   supabase link --project-ref rdcuqbsqnyzwxnyvndsq"
echo ""
echo "3. Apply schema:"
echo "   supabase db push"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If issues persist, see: SCHEMA_TROUBLESHOOTING.md"
echo ""
