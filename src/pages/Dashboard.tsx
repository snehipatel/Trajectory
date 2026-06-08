import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  Clock,
  Flame,
  Plus,
  X,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from 'recharts';
import useStore from '@/store/useStore';
import { getToday, formatDate } from '@/lib/utils';

// ── Helpers ──

function getActivityByDate(logs: { date: string }[]) {
  const map: Record<string, number> = {};
  logs.forEach((l) => {
    map[l.date] = (map[l.date] || 0) + 1;
  });
  return map;
}

function getHeatmapLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

function calcStreak(logs: { date: string }[]): { current: number; longest: number } {
  const dates = new Set(logs.map((l) => l.date));
  const today = new Date();
  let current = 0;
  let d = new Date(today);

  // Check if studied today
  const todayStr = d.toISOString().split('T')[0];
  if (!dates.has(todayStr)) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (dates.has(ds)) {
      current++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Longest streak
  const sorted = Array.from(dates).sort();
  let longest = 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak, current);
  if (sorted.length === 0) longest = 0;

  return { current, longest };
}

// ── Dashboard Component ──

export default function Dashboard() {
  const subjects = useStore((s) => s.subjects);
  const logs = useStore((s) => s.logs);
  const revisions = useStore((s) => s.revisions);
  const settings = useStore((s) => s.settings);
  const addCustomTask = useStore((s) => s.addCustomTask);
  const setCurrentPage = useStore((s) => s.setCurrentPage);

  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'Revision',
    duration: '',
    notes: '',
  });

  const today = getToday();

  // ── Computed Values ──
  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);
  const lecturestoday = todayLogs.filter((l) => l.type === 'lecture').length;
  const dppsToday = todayLogs.filter((l) => l.type === 'dpp').length;
  const studyMinutes = todayLogs.reduce((sum, l) => {
    if (l.duration !== undefined) return sum + l.duration;
    if (l.type === 'lecture') return sum + (settings.defaultLectureDuration ?? 135);
    if (l.type === 'dpp') return sum + (settings.defaultDppDuration ?? 45);
    if (l.type === 'revision') return sum + (settings.defaultRevisionDuration ?? 30);
    return sum + 30;
  }, 0);
  const studyHours = (studyMinutes / 60).toFixed(1);

  const activityMap = useMemo(() => getActivityByDate(logs), [logs]);
  const streak = useMemo(() => calcStreak(logs), [logs]);

  // Weekly data
  const weeklyData = useMemo(() => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push({
        day: dayNames[d.getDay()],
        count: activityMap[ds] || 0,
        date: ds,
      });
    }
    return days;
  }, [activityMap]);

  // Readiness score
  const readiness = useMemo(() => {
    let totalLectures = 0;
    let completedLectures = 0;
    let totalDpps = 0;
    let completedDpps = 0;
    subjects.forEach((s) => {
      s.chapters.forEach((c) => {
        totalLectures += c.lectures.length;
        completedLectures += c.lectures.filter((l) => l.completed).length;
        totalDpps += c.dpps.length;
        completedDpps += c.dpps.filter((d) => d.completed).length;
      });
    });

    const lecPct = totalLectures ? (completedLectures / totalLectures) * 100 : 0;
    const dppPct = totalDpps ? (completedDpps / totalDpps) * 100 : 0;
    const totalRevisions = revisions.length;
    const completedRevisions = revisions.filter((r) => r.status === 'completed').length;
    const revPct = totalRevisions ? (completedRevisions / totalRevisions) * 100 : 0;
    const consistencyPct = Math.min((streak.current / 30) * 100, 100);

    const overall = lecPct * 0.4 + dppPct * 0.25 + revPct * 0.2 + consistencyPct * 0.15;
    return Math.round(overall);
  }, [subjects, revisions, streak]);

  // Insights
  const insights = useMemo(() => {
    const result: { icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>; text: string; color: string }[] = [];

    // Neglected subjects
    subjects.forEach((subject) => {
      if (subject.chapters.length === 0) return;
      const subjectLogs = logs.filter((l) => l.subjectId === subject.id);
      if (subjectLogs.length === 0) {
        result.push({
          icon: AlertCircle,
          text: `You haven't started studying ${subject.name} yet`,
          color: 'var(--color-accent-red)',
        });
      } else {
        const lastDate = subjectLogs[0]?.date;
        if (lastDate) {
          const days = Math.floor(
            (new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (days > 5) {
            result.push({
              icon: AlertCircle,
              text: `You haven't studied ${subject.name} for ${days} days`,
              color: 'var(--color-accent-amber)',
            });
          }
        }
      }
    });

    // Streak
    if (streak.current > 0) {
      result.push({
        icon: Flame,
        text: `You're on a ${streak.current}-day study streak! Keep going!`,
        color: 'var(--color-accent-green)',
      });
    }

    // Today's performance
    if (todayLogs.length > 5) {
      result.push({
        icon: TrendingUp,
        text: `Great day! You've completed ${todayLogs.length} activities today`,
        color: 'var(--color-accent-blue)',
      });
    }

    return result.slice(0, 4);
  }, [subjects, logs, streak, todayLogs]);

  // Due revisions
  const dueRevisions = useMemo(
    () => revisions.filter((r) => r.dueDate === today && r.status === 'pending'),
    [revisions, today]
  );

  // ── Heatmap ──
  const heatmapData = useMemo(() => {
    const cells: { date: string; count: number; level: number }[] = [];
    const d = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(d);
      date.setDate(date.getDate() - i);
      const ds = date.toISOString().split('T')[0];
      const count = activityMap[ds] || 0;
      cells.push({ date: ds, count, level: getHeatmapLevel(count) });
    }
    return cells;
  }, [activityMap]);

  // Group heatmap into weeks (columns)
  const heatmapWeeks = useMemo(() => {
    const weeks: typeof heatmapData[] = [];
    let currentWeek: typeof heatmapData = [];
    // First, pad so first day is Sunday
    const firstDay = new Date(heatmapData[0]?.date || today);
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: '', count: 0, level: -1 });
    }
    heatmapData.forEach((cell) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    return weeks;
  }, [heatmapData, today]);

  // Month labels for heatmap
  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonth = -1;
    heatmapWeeks.forEach((week, wi) => {
      const firstCell = week.find((c) => c.date);
      if (firstCell && firstCell.date) {
        const m = new Date(firstCell.date).getMonth();
        if (m !== lastMonth) {
          labels.push({ label: months[m], index: wi });
          lastMonth = m;
        }
      }
    });
    return labels;
  }, [heatmapWeeks]);

  // ── Handlers ──
  const handleAddTask = () => {
    if (!taskForm.title.trim()) return;
    addCustomTask({
      title: taskForm.title,
      category: taskForm.category,
      notes: taskForm.notes || undefined,
      duration: taskForm.duration ? parseInt(taskForm.duration) : undefined,
    });
    setTaskForm({ title: '', category: 'Revision', duration: '', notes: '' });
    setShowAddTask(false);
  };

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } },
  };

  // ── Readiness chart data ──
  const readinessData = [{ value: readiness, fill: readiness >= 60 ? '#10B981' : readiness >= 30 ? '#F59E0B' : '#EF4444' }];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">{formatDate(new Date())} — Track your GATE preparation progress</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('subjects')}>
            <BookOpen size={16} /> View Subjects
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(true)}>
            <Plus size={16} /> Quick Add
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div className="grid-stats" variants={stagger} initial="hidden" animate="show" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Lectures Today', value: lecturestoday, icon: BookOpen, bg: '#EEF2FF', iconColor: '#6366F1' },
          { label: 'DPPs Today', value: dppsToday, icon: FileText, bg: '#F5F3FF', iconColor: '#8B5CF6' },
          { label: 'Study Hours', value: studyHours, icon: Clock, bg: '#ECFDF5', iconColor: '#059669' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} className="stat-card" variants={fadeUp}>
              <div className="stat-icon" style={{ background: stat.bg }}>
                <Icon size={22} style={{ color: stat.iconColor }} />
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Calendar Heatmap */}
      <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Study Activity</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              {logs.length} total activities in the last year
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`heatmap-level-${level}`} style={{ width: 12, height: 12, borderRadius: 3 }} />
            ))}
            <span>More</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 3, width: '100%', minWidth: '760px', marginBottom: 6 }}>
            {/* Pad for the day labels column */}
            <div style={{ width: 30, flexShrink: 0, marginRight: 8 }} />
            
            {/* Month column headers */}
            {heatmapWeeks.map((_, wi) => {
              const ml = monthLabels.find((m) => m.index === wi);
              return (
                <div key={wi} style={{ flex: 1, fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'visible', position: 'relative', height: 16 }}>
                  {ml ? (
                    <span style={{ position: 'absolute', left: 0, top: 0 }}>
                      {ml.label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 3, width: '100%', minWidth: '760px' }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 8, fontSize: 11, color: 'var(--color-text-muted)', width: 30, flexShrink: 0 }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', lineHeight: 1 }}>{d}</div>
              ))}
            </div>
            {/* Cells */}
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    className={cell.level >= 0 ? `heatmap-cell heatmap-level-${cell.level}` : ''}
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: 3,
                      visibility: cell.level < 0 ? 'hidden' : 'visible',
                    }}
                    title={cell.date ? `${cell.date}: ${cell.count} activities` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Row 3: Weekly Progress + Streak */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Weekly Progress */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0' }}>Weekly Progress</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barSize={32}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#9CA3AF' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1A1D23',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 13,
                    padding: '8px 14px',
                  }}
                  cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
                  formatter={(value: any) => [`${value} activities`, 'Count']}
                  labelFormatter={(label: any) => label}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {weeklyData.map((_entry, index) => (
                    <Cell key={index} fill={`url(#barGradient)`} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Streak Card */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Flame size={32} style={{ color: '#F59E0B', marginBottom: 12 }} />
          <div className="streak-number">{streak.current}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 4 }}>
            Day Streak
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
            Longest: {streak.longest} days
          </div>
        </motion.div>
      </div>

      {/* Row 4: Readiness + Insights + Revisions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {/* Readiness */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', alignSelf: 'flex-start' }}>GATE Readiness</h3>
          <div className="readiness-ring" style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="75%"
                outerRadius="100%"
                data={readinessData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={12}
                  background={{ fill: '#F3F4F6' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="readiness-value" style={{ color: readinessData[0].fill }}>
              {readiness}%
            </div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>
            {readiness >= 60 ? 'On track!' : readiness >= 30 ? 'Keep pushing!' : 'Needs more effort'}
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0' }}>
            <Lightbulb size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-accent-amber)' }} />
            Study Insights
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                Start studying to get personalized insights!
              </p>
            )}
            {insights.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Icon size={16} style={{ color: insight.color, marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    {insight.text}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Due Revisions */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Due Revisions</h3>
            <span className="badge badge-amber">{dueRevisions.length} due</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {dueRevisions.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No revisions due today 🎉</p>
            )}
            {dueRevisions.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--color-bg-hover)',
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{rev.lectureName}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    R{rev.revisionNumber} · {rev.subjectName}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            ))}
            {dueRevisions.length > 3 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('revision')} style={{ alignSelf: 'center', marginTop: 4 }}>
                View all {dueRevisions.length} revisions
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddTask(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Quick Add Task</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTask(false)}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                    Task Name
                  </label>
                  <input
                    className="input"
                    placeholder="e.g., Revision of Deadlocks"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    className="select"
                    value={taskForm.category}
                    onChange={(e) => setTaskForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option>Revision</option>
                    <option>PYQ Practice</option>
                    <option>YouTube Lecture</option>
                    <option>Problem Solving</option>
                    <option>Reading</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                    Duration (minutes)
                  </label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g., 45"
                    value={taskForm.duration}
                    onChange={(e) => setTaskForm((f) => ({ ...f, duration: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>
                    Notes (optional)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Any additional notes..."
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <button className="btn btn-primary" onClick={handleAddTask} style={{ marginTop: 8, justifyContent: 'center' }}>
                  <Plus size={16} /> Add Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
