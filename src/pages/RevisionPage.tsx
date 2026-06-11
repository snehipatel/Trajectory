import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Check,
  X,
  Clock,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Filter,
} from 'lucide-react';
import useStore from '@/store/useStore';
import { getToday } from '@/lib/utils';
import type { Revision } from '@/types';

export default function RevisionPage() {
  const revisions = useStore((s) => s.revisions);
  const completeRevision = useStore((s) => s.completeRevision);
  const missRevision = useStore((s) => s.missRevision);
  const [activeTab, setActiveTab] = useState<'due' | 'upcoming' | 'missed' | 'completed'>('due');
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const today = getToday();

  const categorized = useMemo(() => {
    let filtered = revisions;
    if (filterSubject !== 'all') {
      filtered = filtered.filter((r) => r.subjectId === filterSubject);
    }
    const due = filtered.filter((r) => r.dueDate <= today && r.status === 'pending');
    const upcoming = filtered.filter((r) => r.dueDate > today && r.status === 'pending');
    const missed = filtered.filter((r) => r.status === 'missed');
    const completed = filtered.filter((r) => r.status === 'completed');
    return { due, upcoming, missed, completed };
  }, [revisions, today, filterSubject]);

  const subjects = useStore((s) => s.subjects);
  const uniqueSubjects = useMemo(() => {
    const ids = new Set(revisions.map((r) => r.subjectId));
    return subjects.filter((s) => ids.has(s.id));
  }, [revisions, subjects]);

  const tabs = [
    { id: 'due' as const, label: 'Due Today', count: categorized.due.length, color: '#EF4444' },
    { id: 'upcoming' as const, label: 'Upcoming', count: categorized.upcoming.length, color: '#3B82F6' },
    { id: 'missed' as const, label: 'Missed', count: categorized.missed.length, color: '#F59E0B' },
    { id: 'completed' as const, label: 'Completed', count: categorized.completed.length, color: '#10B981' },
  ];

  const currentList = categorized[activeTab];

  const RevisionCard = ({ rev }: { rev: Revision }) => (
    <motion.div
      className="card card-compact"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${rev.revisionNumber === 1 ? 'rgba(59,130,246,0.12)' : rev.revisionNumber === 2 ? 'rgba(99,102,241,0.12)' : 'rgba(139,92,246,0.12)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 14,
        color: rev.revisionNumber === 1 ? '#3B82F6' : rev.revisionNumber === 2 ? '#6366F1' : '#8B5CF6',
        flexShrink: 0,
      }}>
        R{rev.revisionNumber}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{rev.lectureName}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
          {rev.subjectName} → {rev.chapterName}
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <CalendarDays size={12} />
        {new Date(rev.dueDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
      </div>
      {rev.status === 'pending' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(52, 211, 153, 0.12)', color: '#34D399', padding: '6px 10px' }}
            onClick={() => completeRevision(rev.id)}
            title="Mark as completed"
          >
            <Check size={14} />
          </button>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(248, 113, 113, 0.12)', color: '#F87171', padding: '6px 10px' }}
            onClick={() => missRevision(rev.id)}
            title="Mark as missed"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {rev.status === 'completed' && (
        <span className="badge badge-green">Done</span>
      )}
      {rev.status === 'missed' && (
        <span className="badge badge-red">Missed</span>
      )}
    </motion.div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Revision Tracker</h1>
        <p className="page-subtitle">
          Spaced repetition: +1 day, +7 days, +30 days after completing each lecture
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {tabs.map((tab) => (
          <motion.div
            key={tab.id}
            className="stat-card"
            style={{
              cursor: 'pointer',
              border: activeTab === tab.id ? `2px solid ${tab.color}` : '1px solid var(--color-border-light)',
            }}
            onClick={() => setActiveTab(tab.id)}
            whileTap={{ scale: 0.97 }}
          >
            <div className="stat-icon" style={{ background: tab.color + '15' }}>
              {tab.id === 'due' && <Clock size={20} style={{ color: tab.color }} />}
              {tab.id === 'upcoming' && <CalendarDays size={20} style={{ color: tab.color }} />}
              {tab.id === 'missed' && <AlertTriangle size={20} style={{ color: tab.color }} />}
              {tab.id === 'completed' && <Check size={20} style={{ color: tab.color }} />}
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 24, color: tab.color }}>{tab.count}</div>
              <div className="stat-label">{tab.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      {uniqueSubjects.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          <select className="select" style={{ width: 'auto', minWidth: 200 }} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
            <option value="all">All Subjects</option>
            {uniqueSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Revision List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {currentList.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <RefreshCw size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {activeTab === 'due'
                ? 'No revisions due right now! 🎉'
                : activeTab === 'upcoming'
                ? 'No upcoming revisions scheduled'
                : activeTab === 'missed'
                ? 'No missed revisions — great job!'
                : 'No revisions completed yet'}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
              Complete lectures to automatically schedule revisions
            </p>
          </div>
        )}
        {currentList.map((rev) => (
          <RevisionCard key={rev.id} rev={rev} />
        ))}
      </div>
    </div>
  );
}
