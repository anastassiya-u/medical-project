'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Participant = {
  student_id: string;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  gender: string | null;
  medical_school: string | null;
  year_of_study: number | null;
  paradigm: string;
  accuracy_level: string;
  nfc_level: string | null;
  preferred_language: string | null;
  created_at: string;
  case_count?: number;
};

const PARADIGM_COLORS: Record<string, string> = {
  oracle: 'bg-blue-100 text-blue-800',
  critic: 'bg-purple-100 text-purple-800',
};

const ACCURACY_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  calibrated: 'bg-orange-100 text-orange-800',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filtered, setFiltered] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [filterParadigm, setFilterParadigm] = useState('all');
  const [filterAccuracy, setFilterAccuracy] = useState('all');
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ oracle_high: 0, oracle_calibrated: 0, critic_high: 0, critic_calibrated: 0 });

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('student_id, first_name, last_name, age, gender, medical_school, year_of_study, paradigm, accuracy_level, nfc_level, preferred_language, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading participants:', error);
      setLoading(false);
      return;
    }

    // Get case counts per user
    const { data: interactions } = await supabase
      .from('case_interactions')
      .select('user_id');

    const caseCounts: Record<string, number> = {};
    if (interactions) {
      interactions.forEach((i: { user_id: string }) => {
        caseCounts[i.user_id] = (caseCounts[i.user_id] || 0) + 1;
      });
    }

    const enriched = (data || []).map((p: Participant) => ({
      ...p,
      case_count: caseCounts[(p as unknown as { id: string }).id] || 0,
    }));

    setParticipants(enriched);
    setFiltered(enriched);

    const c = { oracle_high: 0, oracle_calibrated: 0, critic_high: 0, critic_calibrated: 0 };
    enriched.forEach((p) => {
      const key = `${p.paradigm}_${p.accuracy_level}` as keyof typeof c;
      if (key in c) c[key]++;
    });
    setCounts(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    let result = participants;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.student_id?.toLowerCase().includes(q) ||
          p.medical_school?.toLowerCase().includes(q)
      );
    }
    if (filterParadigm !== 'all') result = result.filter((p) => p.paradigm === filterParadigm);
    if (filterAccuracy !== 'all') result = result.filter((p) => p.accuracy_level === filterAccuracy);
    setFiltered(result);
  }, [search, filterParadigm, filterAccuracy, participants]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      setAuthError('');
      loadParticipants();
    } else {
      setAuthError('Incorrect password');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mb-6">Oracle vs. Critic Experiment</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              autoFocus
            />
            {authError && <p className="text-red-600 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Participant Dashboard</h1>
            <p className="text-sm text-gray-500">Oracle vs. Critic Experiment — {participants.length} registered</p>
          </div>
          <button
            onClick={loadParticipants}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Group balance cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { key: 'oracle_high', label: 'Oracle × High', color: 'border-blue-400' },
            { key: 'oracle_calibrated', label: 'Oracle × Calibrated', color: 'border-blue-300' },
            { key: 'critic_high', label: 'Critic × High', color: 'border-purple-400' },
            { key: 'critic_calibrated', label: 'Critic × Calibrated', color: 'border-purple-300' },
          ].map(({ key, label, color }) => (
            <div key={key} className={`bg-white rounded-lg border-l-4 ${color} shadow-sm p-4`}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {counts[key as keyof typeof counts]}
                <span className="text-sm font-normal text-gray-400"> / 30</span>
              </p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full">
                <div
                  className="h-1.5 bg-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, (counts[key as keyof typeof counts] / 30) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by name, ID, or university..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={filterParadigm}
            onChange={(e) => setFilterParadigm(e.target.value)}
            className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All paradigms</option>
            <option value="oracle">Oracle</option>
            <option value="critic">Critic</option>
          </select>
          <select
            value={filterAccuracy}
            onChange={(e) => setFilterAccuracy(e.target.value)}
            className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none"
          >
            <option value="all">All accuracy</option>
            <option value="high">High (100%)</option>
            <option value="calibrated">Calibrated (70%)</option>
          </select>
          <span className="text-sm text-gray-500">{filtered.length} shown</span>
        </div>

        {/* Participant table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading participants...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No participants found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Group</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">University</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Year</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Lang</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cases done</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p, i) => (
                  <tr key={p.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-mono">{p.student_id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {p.first_name || p.last_name
                        ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                        : <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.student_id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-1 ${PARADIGM_COLORS[p.paradigm] || 'bg-gray-100 text-gray-600'}`}>
                        {p.paradigm}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACCURACY_COLORS[p.accuracy_level] || 'bg-gray-100 text-gray-600'}`}>
                        {p.accuracy_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{p.medical_school ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.year_of_study ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 uppercase">{p.preferred_language ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${(p.case_count ?? 0) >= 18 ? 'text-green-600' : (p.case_count ?? 0) > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {p.case_count ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
