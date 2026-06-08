import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  X,
  Check,
  TrendingUp,
  Calendar,
  Trash2,
} from 'lucide-react';
import useStore from '@/store/useStore';
import { getToday, getWeekStart, getMonthStart, percentOf } from '@/lib/utils';
import type { GoalPeriod } from '@/types';

export default function GoalsPage() {
  const goals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoalProgress = useStore((s) => s.updateGoalProgress);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [activeTab, setActiveTab] = useState<GoalPeriod>('weekly');
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    period: 'weekly' as GoalPeriod,
    targetCount: '',
    category: 'lectures' as const,
  });

  const today = getToday();

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => g.period === activeTab);
  }, [goals, activeTab]);

  const activeGoals = filteredGoals.filter((g) => g.status === 'active');
  const completedGoals = filteredGoals.filter((g) => g.status === 'completed');

  const handleAddGoal = () => {
    if (!goalForm.title.trim() || !goalForm.targetCount) return;
    const startDate = today;
    const endDate = new Date();
    if (goalForm.period === 'weekly') {
      endDate.setDate(endDate.getDate() + 7);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    addGoal({
      title: goalForm.title,
      description: goalForm.description || undefined,
      period: goalForm.period,
      targetCount: parseInt(goalForm.targetCount),
      category: goalForm.category,
      startDate,
      endDate: endDate.toISOString().split('T')[0],
    });
    setGoalForm({ title: '', description: '', period: 'weekly', targetCount: '', category: 'lectures' });
    setShowAddGoal(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Goals</h1>
          <p className="page-subtitle">Set and track your study targets</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddGoal(true)}>
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--color-bg-hover)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {(['weekly', 'monthly'] as const).map((period) => (
          <button
            key={period}
            className={`btn btn-sm ${activeTab === period ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(period)}
            style={{ textTransform: 'capitalize', borderRadius: 8 }}
          >
            {period} Goals
          </button>
        ))}
      </div>

      {/* Active Goals */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active ({activeGoals.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeGoals.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <Target size={32} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                No active {activeTab} goals. Set a new goal to stay motivated!
              </p>
            </div>
          )}
          {activeGoals.map((goal) => {
            const pct = percentOf(goal.currentCount, goal.targetCount);
            return (
              <motion.div
                key={goal.id}
                className="card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{goal.title}</h4>
                    {goal.description && (
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{goal.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                      <span className="badge badge-blue">{goal.category}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        Ends {new Date(goal.endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => updateGoalProgress(goal.id, 1)}
                      title="Increment progress"
                    >
                      <Plus size={14} /> +1
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => deleteGoal(goal.id)}
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="progress-bar" style={{ flex: 1, height: 10 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80 ? '#10B981' : pct >= 50 ? '#3B82F6' : '#6366F1',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: 'right', color: pct >= 80 ? '#10B981' : 'var(--color-text-primary)' }}>
                    {goal.currentCount}/{goal.targetCount}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Completed ({completedGoals.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completedGoals.map((goal) => (
              <div key={goal.id} className="card card-compact" style={{ opacity: 0.7, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Check size={18} style={{ color: '#10B981' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{goal.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                    {goal.targetCount} {goal.category}
                  </span>
                </div>
                <span className="badge badge-green">Complete</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddGoal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddGoal(false)}>
            <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New Goal</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddGoal(false)}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Goal Title</label>
                  <input className="input" placeholder="e.g., Finish DBMS, Complete 20 DPPs" value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Description (optional)</label>
                  <input className="input" placeholder="More details about this goal" value={goalForm.description} onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid-2">
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Period</label>
                    <select className="select" value={goalForm.period} onChange={(e) => setGoalForm((f) => ({ ...f, period: e.target.value as GoalPeriod }))}>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
                    <select className="select" value={goalForm.category} onChange={(e) => setGoalForm((f) => ({ ...f, category: e.target.value as any }))}>
                      <option value="lectures">Lectures</option>
                      <option value="dpps">DPPs</option>
                      <option value="tests">Tests</option>
                      <option value="tasks">Tasks</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>Target Count</label>
                  <input className="input" type="number" placeholder="e.g., 20" value={goalForm.targetCount} onChange={(e) => setGoalForm((f) => ({ ...f, targetCount: e.target.value }))} />
                </div>
                <button className="btn btn-primary" onClick={handleAddGoal} style={{ marginTop: 8, justifyContent: 'center' }}>
                  <Target size={16} /> Create Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
