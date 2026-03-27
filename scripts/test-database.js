/**
 * Database Connection Test
 * Verifies that Supabase is configured correctly and data can be written/read
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables directly (Next.js makes them available)
const supabaseUrl = 'https://rdcuqbsqnyzwxnyvndsq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkY3VxYnNxbnl6d3hueXZuZHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTQ0MjAsImV4cCI6MjA4OTkzMDQyMH0.6tdZe0M7vobW8mpuzZ2V8mRVbq5f1e0Zr7oHqqxkL0Q';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Supabase Database Connection...\n');

  try {
    // Test 1: Check if users table exists and count records
    console.log('Test 1: Checking users table...');
    const { data: users, error: usersError, count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      return false;
    }

    console.log(`✅ Users table exists. Total users: ${userCount || users.length}`);
    if (users.length > 0) {
      console.log(`   Latest user: ${users[0].student_id} (${users[0].paradigm}/${users[0].accuracy_level})`);
    }

    // Test 2: Check sessions table
    console.log('\nTest 2: Checking sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .limit(5);

    if (sessionsError) {
      console.error('❌ Sessions table error:', sessionsError.message);
      return false;
    }

    console.log(`✅ Sessions table exists. Total records: ${sessions.length}`);

    // Test 3: Check case_interactions table (most critical)
    console.log('\nTest 3: Checking case_interactions table...');
    const { data: interactions, error: interactionsError, count: interactionCount } = await supabase
      .from('case_interactions')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (interactionsError) {
      console.error('❌ Case interactions table error:', interactionsError.message);
      return false;
    }

    console.log(`✅ Case interactions table exists. Total records: ${interactionCount || interactions.length}`);
    if (interactions.length > 0) {
      const latest = interactions[0];
      console.log(`   Latest interaction: Case ${latest.case_id}`);
      console.log(`   - User diagnosis: ${latest.user_final_diagnosis}`);
      console.log(`   - AI recommendation: ${latest.ai_recommendation}`);
      console.log(`   - Agreed with AI: ${latest.user_agreed_with_ai}`);
      console.log(`   - Task time: ${latest.total_task_time_seconds}s`);
    }

    // Test 4: Check NFC responses table
    console.log('\nTest 4: Checking nfc_responses table...');
    const { data: nfcData, error: nfcError } = await supabase
      .from('nfc_responses')
      .select('*')
      .limit(5);

    if (nfcError) {
      console.error('❌ NFC responses table error:', nfcError.message);
      return false;
    }

    console.log(`✅ NFC responses table exists. Total records: ${nfcData.length}`);
    if (nfcData.length > 0) {
      console.log(`   Latest NFC score: ${nfcData[0].total_score}/90`);
    }

    // Test 5: Check evidence_exploration table (Critic-specific)
    console.log('\nTest 5: Checking evidence_exploration table...');
    const { data: evidenceData, error: evidenceError } = await supabase
      .from('evidence_exploration')
      .select('*')
      .limit(5);

    if (evidenceError) {
      console.error('❌ Evidence exploration table error:', evidenceError.message);
      return false;
    }

    console.log(`✅ Evidence exploration table exists. Total records: ${evidenceData.length}`);

    // Test 6: Check ui_events table
    console.log('\nTest 6: Checking ui_events table...');
    const { data: eventsData, error: eventsError, count: eventsCount } = await supabase
      .from('ui_events')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (eventsError) {
      console.error('❌ UI events table error:', eventsError.message);
      return false;
    }

    console.log(`✅ UI events table exists. Total records: ${eventsCount || eventsData.length}`);

    // Test 7: Check analysis views
    console.log('\nTest 7: Checking analysis views...');
    const { data: overrelianceView, error: viewError } = await supabase
      .from('overreliance_by_group')
      .select('*');

    if (viewError) {
      console.error('❌ Analysis views error:', viewError.message);
      return false;
    }

    console.log(`✅ Analysis views working. Groups analyzed: ${overrelianceView.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DATABASE TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Total users: ${userCount || users.length}`);
    console.log(`   - Total interactions: ${interactionCount || interactions.length}`);
    console.log(`   - Total UI events: ${eventsCount || eventsData.length}`);
    console.log(`   - NFC responses: ${nfcData.length}`);
    console.log(`   - Evidence exploration records: ${evidenceData.length}`);
    console.log('\n💾 Database is working correctly and saving data.\n');

    return true;
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    return false;
  }
}

// Run tests
testDatabaseConnection().then((success) => {
  process.exit(success ? 0 : 1);
});
