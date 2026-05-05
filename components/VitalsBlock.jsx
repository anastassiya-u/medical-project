'use client';

import { getRealVitals } from '../lib/case-field-helper';

const VITAL_KEYS = [
  { key: 'temperature',     tKey: 'temp'  },
  { key: 'bloodPressure',   tKey: 'bp'    },
  { key: 'heartRate',       tKey: 'hr'    },
  { key: 'respiratoryRate', tKey: 'rr'    },
  { key: 'oxygenSaturation',tKey: 'o2sat' },
];

/**
 * Renders the vitals block for a case.
 * If no real vitals exist (all values are "Not reported" or absent),
 * renders nothing rather than five "Not reported" lines.
 */
export default function VitalsBlock({ vitals, t, language, className = '' }) {
  const real = getRealVitals(vitals);

  if (!real) return null;

  return (
    <div className={`bg-gray-50 p-4 rounded border border-gray-200 ${className}`}>
      <strong className="block mb-2">{t.vitalSigns}:</strong>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {VITAL_KEYS.map(({ key, tKey }) =>
          real[key] ? (
            <span key={key}>{t[tKey]}: {real[key]}</span>
          ) : null
        )}
      </div>
    </div>
  );
}
