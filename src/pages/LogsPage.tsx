import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  BookOpen,
  FileText,
  ClipboardCheck,
  CheckSquare,
  RefreshCw,
  Plus,
  X,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import useStore from '@/store/useStore';
import type { LogEntry, LogEntryType } from '@/types';

const typeIcons: Record<LogEntryType, React.FC<{ size?: number; style?: React.CSSProperties }>> = {
  lecture: BookOpen,
  dpp: FileText,
  test: ClipboardCheck,
  task: CheckSquare,
  revision: RefreshCw,
};

const typeColors: Record<LogEntryType, string> = {
  lecture: '#6366F1',
  dpp: '#8B5CF6',
  test: '#D97706',
  task: '#059669',
  revision: '#3B82F6',
};

const typeBadgeClass: Record<LogEntryType, string> = {
  lecture: 'badge-blue',
  dpp: 'badge-purple',
  test: 'badge-amber',
  task: 'badge-green',
  revision: 'badge-blue',
};

export default function LogsPage() {
  const logs = useStore((s) => s.logs);
  const subjects = useStore((s) => s.subjects);
  const deleteLogEntry = useStore((s) => s.deleteLogEntry);
  const addCustomTask = useStore((s) => s.addCustomTask);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', category: 'Revision', duration: '', notes: '' });

  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.subjectName?.toLowerCase().includes(q) ||
          l.chapterName?.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'all') {
      result = result.filter((l) => l.type === filterType);
    }
    if (filterSubject !== 'all') {
      result = result.filter((l) => l.subjectId === filterSubject);
    }
    return result;
  }, [logs, searchQuery, filterType, filterSubject]);

  // Group by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    filteredLogs.forEach((log) => {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredLogs]);

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

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Activity Logs</h1>
          <p className="page-subtitle">{logs.length} total entries</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddTask(true)}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> Filters
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Type
                  </label>
                  <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">All Types</option>
                    <option value="lecture">Lectures</option>
                    <option value="dpp">DPPs</option>
                    <option value="test">Tests</option>
                    <option value="task">Tasks</option>
                    <option value="revision">Revisions</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Subject
                  </label>
                  <select className="select" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
                    <option value="all">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groupedLogs.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <CheckSquare size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
              {searchQuery || filterType !== 'all' || filterSubject !== 'all'
                ? 'No logs match your filters'
                : 'No activity logged yet. Complete lectures or add tasks to see them here.'}
            </p>
          </div>
        )}
        {groupedLogs.map(([date, entries]) => (
          <div key={date}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>
                {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <span className="badge badge-blue">{entries.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {entries.map((log, idx) => {
                const Icon = typeIcons[log.type];
                return (
                  <motion.div
                    key={log.id}
                    className="card card-compact"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: typeColors[log.type] + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} style={{ color: typeColors[log.type] }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{log.title}</div>
                      {log.description && (
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{log.description}</div>
                      )}
                    </div>
                    {log.duration && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        <Clock size={12} /> {log.duration}m
                      </div>
                    )}
                    <span className={`badge ${typeBadgeClass[log.type]}`}>{log.type}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => deleteLogEntry(log.id)}
                      style={{ padding: 6, color: 'var(--color-text-muted)' }}
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddTask(false)}>
            <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Add Custom Task</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddTask(false)}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Task Name</label>
                  <input className="input" placeholder="e.g., Solved PYQ Set" value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
                  <select className="select" value={taskForm.category} onChange={(e) => setTaskForm((f) => ({ ...f, category: e.target.value }))}>
                    <option>Revision</option><option>PYQ Practice</option><option>YouTube Lecture</option><option>Problem Solving</option><option>Reading</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Duration (min)</label>
                  <input className="input" type="number" placeholder="45" value={taskForm.duration} onChange={(e) => setTaskForm((f) => ({ ...f, duration: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Notes</label>
                  <textarea className="input" rows={3} placeholder="Optional notes..." value={taskForm.notes} onChange={(e) => setTaskForm((f) => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
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
