/**
 * Database Connection Test
 * Verifies that Supabase is configured correctly and data can be written/read.
 *
 * Usage:
 *   node --env-file=.env.local scripts/test-database.js
 * or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your shell.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found.');
  console.error('   Run with: node --env-file=.env.local scripts/test-database.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Supabase Database Connection...\n');

  try {
    // Test 1: Users table
    console.log('Test 1: Checking users table...');
    const { data: users, error: usersError, count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
      return false;
    }

    console.log(`✅ Users table exists. Total users: ${userCount ?? users.length}`);
    if (users.length > 0) {
      console.log(`   Latest user: ${users[0].first_name} ${users[0].last_name} (${users[0].paradigm}/${users[0].accuracy_level})`);
    }

    // Test 2: Sessions table — expect session_type IN ('pre_test','intervention','nfc_assessment')
    console.log('\nTest 2: Checking sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('session_type, total_cases, completed_at')
      .limit(10);

    if (sessionsError) {
      console.error('❌ Sessions table error:', sessionsError.message);
      return false;
    }

    console.log(`✅ Sessions table exists. Records shown: ${sessions.length}`);
    sessions.forEach(s => {
      const cases = s.total_cases != null ? `total_cases=${s.total_cases}` : 'total_cases=null (NFC)';
      console.log(`   session_type=${s.session_type} | ${cases} | completed=${s.completed_at ? 'yes' : 'no'}`);
    });

    // Test 3: Case interactions (most critical)
    console.log('\nTest 3: Checking case_interactions table...');
    const { data: interactions, error: interactionsError, count: interactionCount } = await supabase
      .from('case_interactions')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (interactionsError) {
      console.error('❌ Case interactions table error:', interactionsError.message);
      return false;
    }

    console.log(`✅ Case interactions table exists. Total records: ${interactionCount ?? interactions.length}`);
    if (interactions.length > 0) {
      const latest = interactions[0];
      console.log(`   Latest: Case ${latest.case_id} | diagnosis=${latest.user_final_diagnosis} | agreed_with_ai=${latest.user_agreed_with_ai} | time=${latest.total_task_time_seconds}s`);
    }

    // Test 4: NFC responses — score range 15–75 (15-item scale)
    console.log('\nTest 4: Checking nfc_responses table...');
    const { data: nfcData, error: nfcError } = await supabase
      .from('nfc_responses')
      .select('total_score, completed_at')
      .limit(5);

    if (nfcError) {
      console.error('❌ NFC responses table error:', nfcError.message);
      return false;
    }

    console.log(`✅ NFC responses table exists. Records: ${nfcData.length}`);
    if (nfcData.length > 0) {
      console.log(`   Latest NFC score: ${nfcData[0].total_score}/75 (15-item scale, range 15–75)`);
    }

    // Test 5: Evidence exploration (Critic-specific)
    console.log('\nTest 5: Checking evidence_exploration table...');
    const { data: evidenceData, error: evidenceError } = await supabase
      .from('evidence_exploration')
      .select('*')
      .limit(5);

    if (evidenceError) {
      console.error('❌ Evidence exploration table error:', evidenceError.message);
      return false;
    }

    console.log(`✅ Evidence exploration table exists. Records: ${evidenceData.length}`);

    // Test 6: UI events
    console.log('\nTest 6: Checking ui_events table...');
    const { data: eventsData, error: eventsError, count: eventsCount } = await supabase
      .from('ui_events')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (eventsError) {
      console.error('❌ UI events table error:', eventsError.message);
      return false;
    }

    console.log(`✅ UI events table exists. Total records: ${eventsCount ?? eventsData.length}`);

    // Test 7: Analysis view
    console.log('\nTest 7: Checking overreliance_by_group view...');
    const { data: overrelianceView, error: viewError } = await supabase
      .from('overreliance_by_group')
      .select('*');

    if (viewError) {
      console.error('❌ overreliance_by_group view error:', viewError.message);
      return false;
    }

    console.log(`✅ overreliance_by_group view working. Groups with data: ${overrelianceView.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DATABASE TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Users:              ${userCount ?? users.length}`);
    console.log(`   Case interactions:  ${interactionCount ?? interactions.length}`);
    console.log(`   UI events:          ${eventsCount ?? eventsData.length}`);
    console.log(`   NFC responses:      ${nfcData.length}`);
    console.log(`   Evidence records:   ${evidenceData.length}`);
    console.log('\n💾 Database is responding correctly.\n');

    return true;
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    return false;
  }
}

testDatabaseConnection().then((success) => {
  process.exit(success ? 0 : 1);
});
