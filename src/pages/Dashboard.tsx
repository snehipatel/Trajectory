import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  FileText,
  Clock,
  Flame,
  Plus,
  X,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  CheckCircle,
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

// ── Nebula Growth Map ──

interface NebulaProps {
  logs: { date: string; type: string; title: string; description?: string; subjectId?: string }[];
  subjects: { id: string; name: string }[];
}

const NEBULA_COLORS: Record<string, string> = {
  lecture: '#6366F1',
  dpp: '#8B5CF6',
  revision: '#3B82F6',
  custom: '#EC4899',
};

function NebulaGrowthMap({ logs, subjects }: NebulaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number; types: Record<string, number> } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build day data for last 365 days
  const dayData = useMemo(() => {
    const data: { date: string; count: number; types: Record<string, number>; logs: typeof logs }[] = [];
    const d = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(d);
      date.setDate(date.getDate() - i);
      const ds = date.toISOString().split('T')[0];
      const dayLogs = logs.filter((l) => l.date === ds);
      const types: Record<string, number> = {};
      dayLogs.forEach((l) => {
        types[l.type] = (types[l.type] || 0) + 1;
      });
      data.push({ date: ds, count: dayLogs.length, types, logs: dayLogs });
    }
    return data;
  }, [logs]);

  const maxCount = useMemo(() => Math.max(1, ...dayData.map((d) => d.count)), [dayData]);

  // Draw nebula
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const W = Math.floor(rect.width);
    const H = 180;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Light background wash
    ctx.fillStyle = 'rgba(248, 250, 252, 1)';
    ctx.fillRect(0, 0, W, H);

    const padX = 10;
    const usableW = W - padX * 2;

    // Draw each day as particles
    dayData.forEach((day, i) => {
      if (day.count === 0) return;
      const x = padX + (i / 364) * usableW;
      const intensity = day.count / maxCount;
      const age = 1 - i / 364; // 0=newest, 1=oldest

      // Draw particles for each type
      Object.entries(day.types).forEach(([type, count]) => {
        const color = NEBULA_COLORS[type] || NEBULA_COLORS.custom;
        const particleCount = Math.min(count * 3, 15);

        for (let p = 0; p < particleCount; p++) {
          const px = x + (Math.random() - 0.5) * 12;
          const py = H / 2 + (Math.random() - 0.5) * H * 0.6;
          const radius = 1.5 + intensity * 3 + Math.random() * 2;
          const alpha = (0.2 + intensity * 0.6) * (0.5 + (1 - age) * 0.5);

          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(color, alpha);
          ctx.fill();
        }

        // Ambient glow for dense areas
        if (intensity > 0.3) {
          const glowRadius = 15 + intensity * 20;
          const grad = ctx.createRadialGradient(x, H / 2, 0, x, H / 2, glowRadius);
          const glowAlpha = intensity * 0.1 * (0.6 + (1 - age) * 0.4);
          grad.addColorStop(0, hexToRgba(color, glowAlpha));
          grad.addColorStop(1, hexToRgba(color, 0));
          ctx.beginPath();
          ctx.arc(x, H / 2, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });
    });

    // Month labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
    let lastMonth = -1;
    dayData.forEach((day, i) => {
      const m = new Date(day.date).getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        const x = padX + (i / 364) * usableW;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        ctx.fillText(months[m], x, H - 4);
      }
    });
  }, [dayData, maxCount]);

  const handleCanvasMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const padX = 10;
    const usableW = rect.width - padX * 2;
    const dayIndex = Math.round(((mx - padX) / usableW) * 364);
    const clamped = Math.max(0, Math.min(364, dayIndex));
    const day = dayData[clamped];
    if (day) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, date: day.date, count: day.count, types: day.types });
    }
  }, [dayData]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const padX = 10;
    const usableW = rect.width - padX * 2;
    const dayIndex = Math.round(((mx - padX) / usableW) * 364);
    const clamped = Math.max(0, Math.min(364, dayIndex));
    const day = dayData[clamped];
    if (day && day.count > 0) {
      setSelectedDate(day.date);
    }
  }, [dayData]);

  const selectedDayData = selectedDate ? dayData.find((d) => d.date === selectedDate) : null;

  return (
    <div>
      <div ref={containerRef} style={{ position: 'relative', cursor: 'crosshair' }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: 180, borderRadius: 12 }}
          onMouseMove={handleCanvasMove}
          onMouseLeave={() => setTooltip(null)}
          onClick={handleCanvasClick}
        />
        {/* Tooltip */}
        {tooltip && tooltip.count > 0 && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(tooltip.x, (containerRef.current?.offsetWidth || 400) - 160),
              top: Math.max(0, tooltip.y - 60),
              background: '#1A1D23',
              border: 'none',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 12,
              color: '#fff',
              pointerEvents: 'none',
              zIndex: 10,
              minWidth: 130,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{formatDate(tooltip.date)}</div>
            <div>{tooltip.count} activities</div>
            {Object.entries(tooltip.types).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: NEBULA_COLORS[type] || '#EC4899' }} />
                <span style={{ textTransform: 'capitalize' }}>{type}: {count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected date detail panel */}
      <AnimatePresence>
        {selectedDayData && selectedDayData.count > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: 16, padding: '16px', background: 'var(--color-bg-hover)', borderRadius: 12, border: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(selectedDayData.date)} — {selectedDayData.count} activities</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {selectedDayData.logs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, background: 'var(--color-bg-card)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: NEBULA_COLORS[log.type] || '#EC4899', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{log.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{log.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const [showStatDetail, setShowStatDetail] = useState<'lectures' | 'dpps' | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    category: 'Revision',
    duration: '',
    notes: '',
  });

  const today = getToday();

  // ── Computed Values ──
  const todayLogs = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);
  const todayLectureLogs = useMemo(() => todayLogs.filter((l) => l.type === 'lecture'), [todayLogs]);
  const todayDppLogs = useMemo(() => todayLogs.filter((l) => l.type === 'dpp'), [todayLogs]);
  const lecturestoday = todayLectureLogs.length;
  const dppsToday = todayDppLogs.length;
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
          { label: 'Lectures Today', value: lecturestoday, icon: BookOpen, bg: '#EEF2FF', iconColor: '#6366F1', clickable: true as const, onClick: () => setShowStatDetail('lectures') },
          { label: 'DPPs Today', value: dppsToday, icon: FileText, bg: '#F5F3FF', iconColor: '#8B5CF6', clickable: true as const, onClick: () => setShowStatDetail('dpps') },
          { label: 'Study Hours', value: studyHours, icon: Clock, bg: '#ECFDF5', iconColor: '#059669', clickable: false as const, onClick: undefined },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="stat-card"
              variants={fadeUp}
              style={stat.clickable ? { cursor: 'pointer' } : undefined}
              onClick={stat.onClick}
              whileHover={stat.clickable ? { scale: 1.03 } : undefined}
              whileTap={stat.clickable ? { scale: 0.98 } : undefined}
            >
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

      {/* Nebula Growth Map */}
      <motion.div className="card" variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Study Nebula</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              {logs.length} activities across 365 days — click to explore
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>
            {Object.entries(NEBULA_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ textTransform: 'capitalize' }}>{type === 'dpp' ? 'DPP' : type}</span>
              </div>
            ))}
          </div>
        </div>
        <NebulaGrowthMap logs={logs} subjects={subjects} />
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

      {/* Stat Detail Modal (Lectures / DPPs Today) */}
      <AnimatePresence>
        {showStatDetail && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStatDetail(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 520 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                  {showStatDetail === 'lectures' ? `Lectures Completed Today (${todayLectureLogs.length})` : `DPPs Completed Today (${todayDppLogs.length})`}
                </h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowStatDetail(null)}>
                  <X size={18} />
                </button>
              </div>

              {(() => {
                const items = showStatDetail === 'lectures' ? todayLectureLogs : todayDppLogs;
                if (items.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>{showStatDetail === 'lectures' ? '📖' : '📝'}</div>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
                        No {showStatDetail === 'lectures' ? 'lectures' : 'DPPs'} completed today yet.
                      </p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '6px 0 0' }}>
                        Head to Subjects to start studying!
                      </p>
                    </div>
                  );
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                    {items.map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '12px 14px',
                          background: 'var(--color-bg-hover)',
                          borderRadius: 12,
                        }}
                      >
                        <CheckCircle size={18} style={{ color: '#10B981', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.title.replace(/^Completed:\s*/, '')}
                          </div>
                          {log.description && (
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.description}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                          {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
