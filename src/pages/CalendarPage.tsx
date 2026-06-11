import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  ClipboardCheck,
  CheckSquare,
  Clock,
  X,
} from 'lucide-react';
import useStore from '@/store/useStore';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getHeatLevel(count: number) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  return 3;
}

const levelColors = ['rgba(148, 163, 184, 0.06)', 'rgba(129, 140, 248, 0.15)', 'rgba(129, 140, 248, 0.3)', 'rgba(52, 211, 153, 0.3)'];
const typeIcons = {
  lecture: BookOpen,
  dpp: FileText,
  task: CheckSquare,
  revision: Clock,
};

export default function CalendarPage() {
  const logs = useStore((s) => s.logs);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const activityMap = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => { map[l.date] = (map[l.date] || 0) + 1; });
    return map;
  }, [logs]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const selectedDayLogs = useMemo(() => {
    if (!selectedDay) return [];
    return logs.filter((l) => l.date === selectedDay);
  }, [logs, selectedDay]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="page-header">
        <h1>Calendar</h1>
        <p className="page-subtitle">View your study activity by day</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 400px' : '1fr', gap: 24 }}>
        {/* Calendar Grid */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: '500px' }}>
          {/* Month Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}>
              <ChevronLeft size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
                {MONTHS[month]} {year}
              </h2>
              <button className="btn btn-secondary btn-sm" onClick={goToday} style={{ fontSize: 12 }}>
                Today
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day Names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', padding: '8px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: `repeat(${Math.ceil(calendarDays.length / 7)}, 1fr)`,
            gap: 4,
            flex: 1,
          }}>
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const count = activityMap[dateStr] || 0;
              const level = getHeatLevel(count);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDay;

              return (
                <motion.div
                  key={dateStr}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(dateStr)}
                  style={{
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    background: isSelected ? 'var(--color-accent-indigo)' : count > 0 ? levelColors[level] : 'var(--color-bg-hover)',
                    color: isSelected ? '#fff' : 'var(--color-text-primary)',
                    border: isToday ? '2px solid var(--color-accent-indigo)' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    fontWeight: isToday ? 700 : 500,
                    fontSize: 14,
                    height: '100%',
                  }}
                >
                  {day}
                  {count > 0 && !isSelected && (
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--color-accent-indigo)',
                      marginTop: 2,
                    }} />
                  )}
                  {count > 0 && isSelected && (
                    <div style={{ fontSize: 10, marginTop: 1 }}>{count}</div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: levelColors[0] }} /> No study
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: levelColors[1] }} /> Light
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: levelColors[2] }} /> Good
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: levelColors[3] }} /> Excellent
            </div>
          </div>
        </div>

        {/* Day Detail Panel */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              className="card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                alignSelf: 'start',
                position: 'sticky',
                top: 32,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 200px)',
                minHeight: '500px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                    {selectedDayLogs.length} activities
                  </p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDay(null)}>
                  <X size={16} />
                </button>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Lectures', count: selectedDayLogs.filter((l) => l.type === 'lecture').length, color: '#6366F1' },
                  { label: 'DPPs', count: selectedDayLogs.filter((l) => l.type === 'dpp').length, color: '#8B5CF6' },
                  { label: 'Tasks', count: selectedDayLogs.filter((l) => l.type === 'task').length, color: '#059669' },
                ].map((s) => (
                  <div key={s.label} style={{ padding: '10px 14px', background: 'var(--color-bg-hover)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Activity List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                {selectedDayLogs.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>
                    No activities recorded on this day
                  </p>
                )}
                {selectedDayLogs.map((log) => {
                  const Icon = typeIcons[log.type] || CheckSquare;
                  return (
                    <div key={log.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--color-bg-primary)', borderRadius: 10, alignItems: 'flex-start' }}>
                      <Icon size={16} style={{ color: 'var(--color-accent-indigo)', marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{log.title}</div>
                        {log.description && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{log.description}</div>
                        )}
                      </div>
                      <span className={`badge badge-${log.type === 'lecture' ? 'blue' : log.type === 'dpp' ? 'purple' : 'green'}`}>
                        {log.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
