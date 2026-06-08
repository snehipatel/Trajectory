import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Check,
  BookOpen,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import useStore from '@/store/useStore';
import type { Subject } from '@/types';
import { percentOf } from '@/lib/utils';

// ── Subject Card ──
function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const totalLectures = subject.chapters.reduce((s, c) => s + c.lectures.length, 0);
  const completedLectures = subject.chapters.reduce(
    (s, c) => s + c.lectures.filter((l) => l.completed).length,
    0
  );
  const totalDpps = subject.chapters.reduce((s, c) => s + c.dpps.length, 0);
  const completedDpps = subject.chapters.reduce(
    (s, c) => s + c.dpps.filter((d) => d.completed).length,
    0
  );
  const total = totalLectures + totalDpps;
  const completed = completedLectures + completedDpps;
  const pct = percentOf(completed, total);

  return (
    <motion.div
      className="card card-interactive card-compact"
      onClick={onClick}
      whileHover={{ y: -2 }}
      style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: subject.color + '18',
          color: subject.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {subject.shortName}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {subject.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <div className="progress-bar" style={{ flex: 1, height: 6 }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: subject.color }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: subject.color, minWidth: 36, textAlign: 'right' }}>
            {pct}%
          </span>
        </div>
      </div>
      <ChevronRight size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
    </motion.div>
  );
}

// ── Chapter Tree ──
function ChapterTree({ subject }: { subject: Subject }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleLecture = useStore((s) => s.toggleLecture);
  const toggleDpp = useStore((s) => s.toggleDpp);

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {subject.chapters.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
          No chapters available yet. Import course data to add chapters.
        </div>
      )}
      {subject.chapters.map((chapter) => {
        const lecCompleted = chapter.lectures.filter((l) => l.completed).length;
        const dppCompleted = chapter.dpps.filter((d) => d.completed).length;
        const isExpanded = expanded[chapter.id] ?? false;

        return (
          <div key={chapter.id} className="tree-node card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Chapter Header */}
            <div
              className="tree-node-header"
              onClick={() => toggle(chapter.id)}
              style={{ padding: '14px 16px', cursor: 'pointer' }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                  {chapter.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                  <span>Lectures: {lecCompleted}/{chapter.lectures.length}</span>
                  {chapter.dpps.length > 0 && <span>DPP: {dppCompleted}/{chapter.dpps.length}</span>}
                </div>
              </div>
              <div className="progress-bar" style={{ width: 80, height: 5 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${percentOf(lecCompleted + dppCompleted, chapter.lectures.length + chapter.dpps.length)}%`,
                    background: subject.color,
                  }}
                />
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 16px 16px 44px' }}>
                    {/* Lectures */}
                    {chapter.lectures.length > 0 && (
                      <div style={{ marginBottom: chapter.dpps.length > 0 ? 16 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Lectures
                        </div>
                        {chapter.lectures.map((lecture) => (
                          <motion.div
                            key={lecture.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'background 0.1s',
                            }}
                            onClick={() => toggleLecture(subject.id, chapter.id, lecture.id)}
                            whileTap={{ scale: 0.98 }}
                            className="tree-node-header"
                          >
                            <div
                              className={`checkbox-custom ${lecture.completed ? 'checked' : ''}`}
                            >
                              {lecture.completed && <Check size={12} color="#fff" />}
                            </div>
                            <BookOpen size={14} style={{ color: lecture.completed ? 'var(--color-accent-green)' : 'var(--color-text-muted)' }} />
                            <span
                              style={{
                                fontSize: 14,
                                color: lecture.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                textDecoration: lecture.completed ? 'line-through' : 'none',
                                flex: 1,
                              }}
                            >
                              {lecture.name}
                            </span>
                            {lecture.completed && lecture.completedAt && (
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                {new Date(lecture.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* DPPs */}
                    {chapter.dpps.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Daily Practice Problems
                        </div>
                        {chapter.dpps.map((dpp) => (
                          <motion.div
                            key={dpp.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 8,
                              cursor: 'pointer',
                            }}
                            onClick={() => toggleDpp(subject.id, chapter.id, dpp.id)}
                            whileTap={{ scale: 0.98 }}
                            className="tree-node-header"
                          >
                            <div
                              className={`checkbox-custom ${dpp.completed ? 'checked' : ''}`}
                              style={{ borderColor: dpp.completed ? '#8B5CF6' : undefined, background: dpp.completed ? '#8B5CF6' : undefined }}
                            >
                              {dpp.completed && <Check size={12} color="#fff" />}
                            </div>
                            <FileText size={14} style={{ color: dpp.completed ? '#8B5CF6' : 'var(--color-text-muted)' }} />
                            <span
                              style={{
                                fontSize: 14,
                                color: dpp.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                                textDecoration: dpp.completed ? 'line-through' : 'none',
                                flex: 1,
                              }}
                            >
                              {dpp.name}
                            </span>
                            {dpp.completed && dpp.completedAt && (
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                {new Date(dpp.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Subjects Page ──
export default function SubjectsPage() {
  const subjects = useStore((s) => s.subjects);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const activeSubject = subjects.find((s) => s.id === selectedSubject);

  // Stats
  const totalLectures = subjects.reduce(
    (sum, s) => sum + s.chapters.reduce((cs, c) => cs + c.lectures.length, 0),
    0
  );
  const completedLectures = subjects.reduce(
    (sum, s) => sum + s.chapters.reduce((cs, c) => cs + c.lectures.filter((l) => l.completed).length, 0),
    0
  );

  if (activeSubject) {
    const subjectTotal = activeSubject.chapters.reduce((s, c) => s + c.lectures.length, 0);
    const subjectCompleted = activeSubject.chapters.reduce(
      (s, c) => s + c.lectures.filter((l) => l.completed).length,
      0
    );
    const subjectDppTotal = activeSubject.chapters.reduce((s, c) => s + c.dpps.length, 0);
    const subjectDppCompleted = activeSubject.chapters.reduce(
      (s, c) => s + c.dpps.filter((d) => d.completed).length,
      0
    );
    const overallPct = percentOf(
      subjectCompleted + subjectDppCompleted,
      subjectTotal + subjectDppTotal
    );

    return (
      <div>
        <div className="page-header">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedSubject(null)}
            style={{ marginBottom: 12 }}
          >
            <ArrowLeft size={16} /> Back to Subjects
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: activeSubject.color + '18',
                color: activeSubject.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {activeSubject.shortName}
            </div>
            <div>
              <h1 style={{ margin: 0 }}>{activeSubject.name}</h1>
              <p className="page-subtitle">{activeSubject.chapters.length} chapters</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid-stats" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#EEF2FF' }}>
              <BookOpen size={20} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{subjectCompleted}/{subjectTotal}</div>
              <div className="stat-label">Lectures</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#F5F3FF' }}>
              <FileText size={20} style={{ color: '#8B5CF6' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{subjectDppCompleted}/{subjectDppTotal}</div>
              <div className="stat-label">DPPs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ECFDF5' }}>
              <Check size={20} style={{ color: '#059669' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{overallPct}%</div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#FFFBEB' }}>
              <ChevronDown size={20} style={{ color: '#D97706' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{activeSubject.chapters.length}</div>
              <div className="stat-label">Chapters</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Overall Progress</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: activeSubject.color }}>{overallPct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${overallPct}%`, background: activeSubject.color }} />
          </div>
        </div>

        {/* Chapter Tree */}
        <ChapterTree subject={activeSubject} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Subjects</h1>
        <p className="page-subtitle">
          {subjects.length} subjects · {completedLectures}/{totalLectures} lectures completed
        </p>
      </div>

      <motion.div
        className="grid-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onClick={() => setSelectedSubject(subject.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}
