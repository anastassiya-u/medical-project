#!/usr/bin/env node

/**
 * Apply Supabase Schema - Direct Database Initialization
 *
 * This script applies the complete schema.sql to your Supabase database
 * using the JavaScript client with raw SQL execution.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  console.error('');
  console.error('Expected:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...');
  process.exit(1);
}

console.log('🔍 Supabase Configuration:');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${SUPABASE_KEY.substring(0, 20)}...`);
console.log('');

// Read schema file
const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Error: Schema file not found at: ${schemaPath}`);
  process.exit(1);
}

const schema = fs.readFileSync(schemaPath, 'utf8');
console.log(`✓ Loaded schema: ${schema.length} characters, ${schema.split('\n').length} lines`);
console.log('');

// Parse schema into executable statements
console.log('📋 Parsing SQL statements...');

const statements = schema
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => {
    // Remove empty statements and comments-only blocks
    const cleaned = stmt.replace(/--[^\n]*/g, '').trim();
    return cleaned.length > 0;
  })
  .map(stmt => stmt + ';'); // Re-add semicolon

console.log(`✓ Found ${statements.length} SQL statements to execute`);
console.log('');

// Execute via direct HTTP POST to Supabase's SQL API
async function executeSQL(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response;
}

// Alternative: Execute via psql-style endpoint
async function executeSQLDirect(sql) {
  // Supabase exposes a direct SQL execution endpoint via PostgREST
  // We'll use the REST API with a stored procedure approach

  const url = `${SUPABASE_URL}/rest/v1/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'text/plain',
      'Accept': 'application/json'
    },
    body: sql
  });

  return response;
}

// Main execution
async function main() {
  console.log('🚀 Starting schema application...');
  console.log('');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

    process.stdout.write(`[${i+1}/${statements.length}] ${preview}... `);

    try {
      // Attempt direct SQL execution
      // Note: This requires the appropriate permissions
      await executeSQL(stmt);
      console.log('✓');
      successCount++;
    } catch (error) {
      console.log('✗');
      console.error(`   Error: ${error.message}`);
      failureCount++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successful: ${successCount}`);
  if (failureCount > 0) {
    console.log(`❌ Failed: ${failureCount}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Run
main().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error.message);
  console.error('');
  console.error('FALLBACK: Manual Application Required');
  console.error('');
  console.error('Please apply schema manually:');
  console.error('1. Copy schema to clipboard:');
  console.error('   cat supabase/schema.sql | pbcopy');
  console.error('');
  console.error('2. Open Supabase SQL Editor:');
  console.error('   https://app.supabase.com/project/rdcuqbsqnyzwxnyvndsq/sql/new');
  console.error('');
  console.error('3. Paste (Cmd+V) and click Run');
  process.exit(1);
});
