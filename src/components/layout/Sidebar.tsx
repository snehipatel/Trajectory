import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  ScrollText,
  BarChart3,
  RefreshCw,
  Target,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from 'lucide-react';
import useStore from '@/store/useStore';
import type { PageId } from '@/types';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'revision', label: 'Revision Tracker', icon: RefreshCw },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const currentPage = useStore((s) => s.currentPage);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Brand */}
      <div
        style={{
          padding: sidebarCollapsed ? '24px 0' : '24px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--color-border-light)',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Zap size={20} color="#fff" />
        </div>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
              Trajectory
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, marginTop: -2 }}>
              GATE Prep Tracker
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, paddingTop: 4, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <div
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              style={sidebarCollapsed ? { justifyContent: 'center', padding: '12px', margin: '2px 8px' } : undefined}
            >
              <Icon size={20} className="nav-icon" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid var(--color-border-light)',
          display: 'flex',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
        }}
      >
        <button
          onClick={toggleSidebar}
          className="btn btn-ghost btn-sm"
          style={{ borderRadius: 8 }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
