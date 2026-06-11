import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Check,
  BookOpen,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import useStore from '@/store/useStore';
import type { Subject } from '@/types';
import { percentOf } from '@/lib/utils';
import PlanetRenderer from '@/components/space/PlanetRenderer';
import ConstellationView from '@/components/space/ConstellationView';

// ── Planet Subject Card ──
function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const totalLectures = subject.chapters.reduce((s, c) => s + c.lectures.length, 0);
  const completedLectures = subject.chapters.reduce((s, c) => s + c.lectures.filter((l) => l.completed).length, 0);
  const totalDpps = subject.chapters.reduce((s, c) => s + c.dpps.length, 0);
  const completedDpps = subject.chapters.reduce((s, c) => s + c.dpps.filter((d) => d.completed).length, 0);
  const total = totalLectures + totalDpps;
  const completed = completedLectures + completedDpps;
  const pct = percentOf(completed, total);

  return (
    <motion.div
      className="card card-interactive"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '24px 16px',
        cursor: 'pointer',
        textAlign: 'center',
      }}
    >
      <PlanetRenderer
        subjectName={subject.name}
        color={subject.color}
        size={90}
        completion={pct}
        showOrbit={true}
        animated={true}
      />
      <div style={{ marginTop: 4 }}>
        <div style={{
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--color-text-primary)',
          lineHeight: 1.3,
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {subject.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
          {completedLectures}/{totalLectures} lectures · {completedDpps}/{totalDpps} DPPs
        </div>
      </div>
    </motion.div>
  );
}

// ── Chapter Tree (dark glass) ──
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
        const totalItems = chapter.lectures.length + chapter.dpps.length;
        const completedItems = lecCompleted + dppCompleted;
        const allDone = totalItems > 0 && completedItems === totalItems;

        return (
          <div key={chapter.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              className="tree-node-header"
              onClick={() => toggle(chapter.id)}
              style={{ padding: '14px 16px', cursor: 'pointer' }}
            >
              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </motion.div>
              {/* Star indicator */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: allDone ? subject.color : completedItems > 0 ? `${subject.color}60` : 'rgba(148,163,184,0.2)',
                boxShadow: allDone ? `0 0 6px ${subject.color}` : 'none',
                flexShrink: 0,
              }} />
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
                    width: `${percentOf(completedItems, totalItems)}%`,
                    background: subject.color,
                  }}
                />
              </div>
            </div>

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
                    {chapter.lectures.length > 0 && (
                      <div style={{ marginBottom: chapter.dpps.length > 0 ? 16 : 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Lectures
                        </div>
                        {chapter.lectures.map((lecture) => (
                          <motion.div
                            key={lecture.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            }}
                            onClick={() => toggleLecture(subject.id, chapter.id, lecture.id)}
                            whileTap={{ scale: 0.98 }}
                            className="tree-node-header"
                          >
                            <div className={`checkbox-custom ${lecture.completed ? 'checked' : ''}`}>
                              {lecture.completed && <Check size={12} color="#fff" />}
                            </div>
                            <BookOpen size={14} style={{ color: lecture.completed ? 'var(--color-accent-green)' : 'var(--color-text-muted)' }} />
                            <span style={{
                              fontSize: 14,
                              color: lecture.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                              textDecoration: lecture.completed ? 'line-through' : 'none',
                              flex: 1,
                            }}>
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

                    {chapter.dpps.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                          Daily Practice Problems
                        </div>
                        {chapter.dpps.map((dpp) => (
                          <motion.div
                            key={dpp.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            }}
                            onClick={() => toggleDpp(subject.id, chapter.id, dpp.id)}
                            whileTap={{ scale: 0.98 }}
                            className="tree-node-header"
                          >
                            <div
                              className={`checkbox-custom ${dpp.completed ? 'checked' : ''}`}
                              style={{ borderColor: dpp.completed ? '#A855F7' : undefined, background: dpp.completed ? '#A855F7' : undefined }}
                            >
                              {dpp.completed && <Check size={12} color="#fff" />}
                            </div>
                            <FileText size={14} style={{ color: dpp.completed ? '#A855F7' : 'var(--color-text-muted)' }} />
                            <span style={{
                              fontSize: 14,
                              color: dpp.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                              textDecoration: dpp.completed ? 'line-through' : 'none',
                              flex: 1,
                            }}>
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

  const totalLectures = subjects.reduce((sum, s) => sum + s.chapters.reduce((cs, c) => cs + c.lectures.length, 0), 0);
  const completedLectures = subjects.reduce((sum, s) => sum + s.chapters.reduce((cs, c) => cs + c.lectures.filter((l) => l.completed).length, 0), 0);

  if (activeSubject) {
    const subjectTotal = activeSubject.chapters.reduce((s, c) => s + c.lectures.length, 0);
    const subjectCompleted = activeSubject.chapters.reduce((s, c) => s + c.lectures.filter((l) => l.completed).length, 0);
    const subjectDppTotal = activeSubject.chapters.reduce((s, c) => s + c.dpps.length, 0);
    const subjectDppCompleted = activeSubject.chapters.reduce((s, c) => s + c.dpps.filter((d) => d.completed).length, 0);
    const overallPct = percentOf(subjectCompleted + subjectDppCompleted, subjectTotal + subjectDppTotal);

    return (
      <div>
        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedSubject(null)} style={{ marginBottom: 16 }}>
            <ArrowLeft size={16} /> Back to Subjects
          </button>

          {/* Planet + Subject Info */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <PlanetRenderer
              subjectName={activeSubject.name}
              color={activeSubject.color}
              size={140}
              completion={overallPct}
              showOrbit={true}
              showLabel={false}
              animated={true}
            />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ margin: 0 }}>{activeSubject.name}</h1>
              <p className="page-subtitle">{activeSubject.chapters.length} chapters · Orbit: {overallPct}%</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid-stats" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(129, 140, 248, 0.1)' }}>
              <BookOpen size={20} style={{ color: '#818CF8' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{subjectCompleted}/{subjectTotal}</div>
              <div className="stat-label">Lectures</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
              <FileText size={20} style={{ color: '#A855F7' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{subjectDppCompleted}/{subjectDppTotal}</div>
              <div className="stat-label">DPPs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(52, 211, 153, 0.1)' }}>
              <Check size={20} style={{ color: '#34D399' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{overallPct}%</div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
              <ChevronRight size={20} style={{ color: '#FBBF24' }} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 22 }}>{activeSubject.chapters.length}</div>
              <div className="stat-label">Chapters</div>
            </div>
          </div>
        </div>

        {/* Constellation View */}
        {activeSubject.chapters.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px 0' }}>Chapter Constellation</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 16px 0' }}>
              Bright stars = completed chapters · Dim stars = in progress
            </p>
            <ConstellationView
              chapters={activeSubject.chapters}
              subjectColor={activeSubject.color}
            />
          </div>
        )}

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

      <div className="grid-subjects">
        {subjects.map((subject) => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            onClick={() => setSelectedSubject(subject.id)}
          />
        ))}
      </div>
    </div>
  );
}
