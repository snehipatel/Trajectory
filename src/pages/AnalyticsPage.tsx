import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react';
import useStore from '@/store/useStore';
import { getToday, percentOf } from '@/lib/utils';

const PIE_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4', '#A855F7', '#84CC16', '#D946EF', '#0EA5E9'];

export default function AnalyticsPage() {
  const subjects = useStore((s) => s.subjects);
  const logs = useStore((s) => s.logs);
  const revisions = useStore((s) => s.revisions);
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const today = getToday();

  // ── Subject Coverage ──
  const coverageData = useMemo(() => {
    return subjects
      .filter((s) => s.chapters.length > 0)
      .map((subject) => {
        const totalLec = subject.chapters.reduce((s, c) => s + c.lectures.length, 0);
        const compLec = subject.chapters.reduce((s, c) => s + c.lectures.filter((l) => l.completed).length, 0);
        const totalDpp = subject.chapters.reduce((s, c) => s + c.dpps.length, 0);
        const compDpp = subject.chapters.reduce((s, c) => s + c.dpps.filter((d) => d.completed).length, 0);
        return {
          name: subject.shortName,
          fullName: subject.name,
          percentage: percentOf(compLec + compDpp, totalLec + totalDpp),
          color: subject.color,
          lectures: `${compLec}/${totalLec}`,
          dpps: `${compDpp}/${totalDpp}`,
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [subjects]);

  // ── Neglected Subjects ──
  const neglectedSubjects = useMemo(() => {
    return subjects
      .filter((s) => s.chapters.length > 0)
      .map((subject) => {
        const subjectLogs = logs.filter((l) => l.subjectId === subject.id);
        const lastLog = subjectLogs[0];
        const daysSince = lastLog
          ? Math.floor((new Date().getTime() - new Date(lastLog.date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return {
          name: subject.name,
          shortName: subject.shortName,
          color: subject.color,
          daysSince,
          hasLogs: subjectLogs.length > 0,
        };
      })
      .filter((s) => s.daysSince > 3)
      .sort((a, b) => b.daysSince - a.daysSince);
  }, [subjects, logs]);

  // ── Time Investment ──
  const timeData = useMemo(() => {
    const subjectTime: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.subjectId) {
        const subject = subjects.find((s) => s.id === log.subjectId);
        const name = subject?.shortName || 'Other';
        subjectTime[name] = (subjectTime[name] || 0) + (log.duration || 30);
      }
    });
    return Object.entries(subjectTime)
      .map(([name, minutes], i) => ({
        name,
        value: Math.round(minutes / 60 * 10) / 10,
        minutes,
        color: PIE_COLORS[i % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs, subjects]);

  // ── Study Trends ──
  const trendData = useMemo(() => {
    const activityMap: Record<string, number> = {};
    logs.forEach((l) => { activityMap[l.date] = (activityMap[l.date] || 0) + 1; });

    if (trendPeriod === 'daily') {
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        data.push({
          date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          count: activityMap[ds] || 0,
        });
      }
      return data;
    } else if (trendPeriod === 'weekly') {
      const data = [];
      for (let w = 11; w >= 0; w--) {
        let count = 0;
        for (let d = 0; d < 7; d++) {
          const date = new Date();
          date.setDate(date.getDate() - (w * 7 + d));
          const ds = date.toISOString().split('T')[0];
          count += activityMap[ds] || 0;
        }
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - w * 7);
        data.push({
          date: `W${12 - w}`,
          count,
        });
      }
      return data;
    } else {
      const data = [];
      for (let m = 5; m >= 0; m--) {
        const date = new Date();
        date.setMonth(date.getMonth() - m);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        let count = 0;
        Object.entries(activityMap).forEach(([d, c]) => {
          if (d.startsWith(monthKey)) count += c;
        });
        data.push({
          date: date.toLocaleDateString('en-IN', { month: 'short' }),
          count,
        });
      }
      return data;
    }
  }, [logs, trendPeriod]);

  // ── Completion Stats ──
  const completionStats = useMemo(() => {
    let totalLec = 0, compLec = 0, totalDpp = 0, compDpp = 0;
    subjects.forEach((s) => s.chapters.forEach((c) => {
      totalLec += c.lectures.length;
      compLec += c.lectures.filter((l) => l.completed).length;
      totalDpp += c.dpps.length;
      compDpp += c.dpps.filter((d) => d.completed).length;
    }));
    const tests = logs.filter((l) => l.type === 'test').length;
    const tasks = logs.filter((l) => l.type === 'task').length;
    return { totalLec, compLec, totalDpp, compDpp, tests, tasks };
  }, [subjects, logs]);

  // ── Subject Readiness Radar ──
  const radarData = useMemo(() => {
    return subjects
      .filter((s) => s.chapters.length > 0)
      .slice(0, 8)
      .map((subject) => {
        const totalLec = subject.chapters.reduce((s, c) => s + c.lectures.length, 0);
        const compLec = subject.chapters.reduce((s, c) => s + c.lectures.filter((l) => l.completed).length, 0);
        return {
          subject: subject.shortName,
          readiness: totalLec > 0 ? Math.round((compLec / totalLec) * 100) : 0,
          fullMark: 100,
        };
      });
  }, [subjects]);

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p className="page-subtitle">Comprehensive study performance analysis</p>
      </div>

      {/* Completion Stats */}
      <motion.div className="grid-stats" variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
        {[
          { label: 'Lectures Completed', value: `${completionStats.compLec}/${completionStats.totalLec}`, icon: BookOpen, bg: '#EEF2FF', color: '#6366F1' },
          { label: 'DPPs Completed', value: `${completionStats.compDpp}/${completionStats.totalDpp}`, icon: FileText, bg: '#F5F3FF', color: '#8B5CF6' },
          { label: 'Tests Taken', value: completionStats.tests, icon: ClipboardCheck, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Custom Tasks', value: completionStats.tasks, icon: CheckSquare, bg: '#ECFDF5', color: '#059669' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ background: stat.bg }}>
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="stat-value" style={{ fontSize: 22 }}>{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Row 1: Coverage + Neglected */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Subject Coverage */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0' }}>
            <Activity size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Subject Coverage
          </h3>
          {coverageData.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No subjects with chapters</p>
          ) : (
            <div style={{ height: Math.max(coverageData.length * 48, 200) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} layout="vertical" barSize={20}>
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} unit="%" />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#6B7280', fontWeight: 500 }} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#1A1D23', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, padding: '8px 14px' }}
                    formatter={(value: any, _name: any, props: any) => [`${value}% (Lec: ${props.payload.lectures}, DPP: ${props.payload.dpps})`, props.payload.fullName]}
                  />
                  <Bar dataKey="percentage" radius={[0, 8, 8, 0]}>
                    {coverageData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Neglected Subjects */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0' }}>
            <AlertTriangle size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom', color: 'var(--color-accent-amber)' }} />
            Neglected Subjects
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {neglectedSubjects.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>All subjects are up to date! 🎉</p>
            )}
            {neglectedSubjects.map((subject) => (
              <div
                key={subject.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: subject.daysSince > 10 ? '#FEF2F2' : subject.daysSince > 7 ? '#FFFBEB' : 'var(--color-bg-hover)',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: subject.color + '20',
                    color: subject.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 11,
                  }}>
                    {subject.shortName}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{subject.name}</span>
                </div>
                <span className={`badge ${subject.daysSince > 10 ? 'badge-red' : subject.daysSince > 7 ? 'badge-amber' : 'badge-blue'}`}>
                  {subject.hasLogs ? `${subject.daysSince}d ago` : 'Never'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Row 2: Time Investment + Radar */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Time Investment */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0' }}>
            <Clock size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Time Investment
          </h3>
          {timeData.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No study time recorded yet</p>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}h`}
                  >
                    {timeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1A1D23', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13 }}
                    formatter={(value: any) => [`${value} hours`, 'Time']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Subject Readiness Radar */}
        <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px 0' }}>
            Subject-wise Readiness
          </h3>
          {radarData.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data available</p>
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Radar name="Readiness" dataKey="readiness" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Study Trends */}
      <motion.div className="card" variants={fadeUp} initial="hidden" animate="show">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            <TrendingUp size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
            Study Trends
          </h3>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                className={`btn btn-sm ${trendPeriod === period ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTrendPeriod(period)}
                style={{ textTransform: 'capitalize', fontSize: 12 }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1A1D23', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, padding: '8px 14px' }}
                formatter={(value: any) => [`${value} activities`, 'Count']}
              />
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366F1"
                strokeWidth={2.5}
                dot={{ fill: '#6366F1', r: 4 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
