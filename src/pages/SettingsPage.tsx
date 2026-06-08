import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Download,
  Upload,
  Trash2,
  Database,
  Info,
  AlertTriangle,
  Check,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';
import useStore from '@/store/useStore';

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetData = useStore((s) => s.resetData);
  const subjects = useStore((s) => s.subjects);
  const logs = useStore((s) => s.logs);
  const revisions = useStore((s) => s.revisions);
  const goals = useStore((s) => s.goals);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trajectory-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string;
        importData(json);
        setImportStatus('Data imported successfully!');
        setTimeout(() => setImportStatus(null), 3000);
      } catch {
        setImportStatus('Failed to import data. Invalid format.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetData();
    setShowResetConfirm(false);
  };

  // Stats
  const totalLectures = subjects.reduce((s, sub) => s + sub.chapters.reduce((cs, c) => cs + c.lectures.length, 0), 0);
  const completedLectures = subjects.reduce((s, sub) => s + sub.chapters.reduce((cs, c) => cs + c.lectures.filter((l) => l.completed).length, 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p className="page-subtitle">Manage your preferences and data</p>
      </div>

      <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Preferences */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} /> Preferences
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Revision Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Auto-schedule Revisions</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Generate revision reminders when completing lectures</div>
              </div>
              <button
                className="btn btn-sm"
                style={{
                  background: settings.revisionEnabled ? '#ECFDF5' : 'var(--color-bg-hover)',
                  color: settings.revisionEnabled ? '#059669' : 'var(--color-text-muted)',
                  minWidth: 60,
                  justifyContent: 'center',
                }}
                onClick={() => updateSettings({ revisionEnabled: !settings.revisionEnabled })}
              >
                {settings.revisionEnabled ? 'On' : 'Off'}
              </button>
            </div>

            {/* Study Hours Goal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Daily Study Hours Goal</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Target hours per day</div>
              </div>
              <input
                className="input"
                type="number"
                min="1"
                max="16"
                value={settings.studyHoursGoal}
                onChange={(e) => updateSettings({ studyHoursGoal: parseInt(e.target.value) || 8 })}
                style={{ width: 80, textAlign: 'center' }}
              />
            </div>
          </div>
        </div>

        {/* Data Overview */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} /> Data Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {[
              { label: 'Subjects', value: subjects.length },
              { label: 'Total Lectures', value: totalLectures },
              { label: 'Completed Lectures', value: completedLectures },
              { label: 'Log Entries', value: logs.length },
              { label: 'Revisions', value: revisions.length },
              { label: 'Goals', value: goals.length },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '12px 16px', background: 'var(--color-bg-hover)', borderRadius: 10 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent-indigo)' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Import / Export */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Backup & Restore
          </h3>

          {importStatus && (
            <div style={{
              padding: '10px 14px',
              background: importStatus.includes('success') ? '#ECFDF5' : '#FEF2F2',
              color: importStatus.includes('success') ? '#059669' : '#DC2626',
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {importStatus.includes('success') ? <Check size={16} /> : <AlertTriangle size={16} />}
              {importStatus}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={handleExport}>
              <Download size={16} /> Export JSON
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
            Export your data as a JSON file for backup. Import to restore from a backup.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ border: '1px solid #FCA5A5' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} /> Danger Zone
          </h3>
          {!showResetConfirm ? (
            <button className="btn" style={{ background: '#FEF2F2', color: '#DC2626' }} onClick={() => setShowResetConfirm(true)}>
              <Trash2 size={16} /> Reset All Data
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: '#DC2626', marginBottom: 12, fontWeight: 500 }}>
                Are you sure? This will delete all your progress, logs, goals, and revisions.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ background: '#DC2626', color: '#fff' }} onClick={handleReset}>
                  Yes, Reset Everything
                </button>
                <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={18} /> About
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Trajectory</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>GATE Preparation Progress Tracker v1.0.0</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            A personal study tracking system designed for GATE preparation. Track lectures, DPPs, revisions, and goals with detailed analytics.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
            All data is stored locally in your browser. Use Export to back up your progress.
          </p>
        </div>
      </div>
    </div>
  );
}
