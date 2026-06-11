import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StarfieldBackground from './components/space/StarfieldBackground';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/layout/CommandPalette';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import SubjectsPage from './pages/SubjectsPage';
import LogsPage from './pages/LogsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RevisionPage from './pages/RevisionPage';
import GoalsPage from './pages/GoalsPage';
import SettingsPage from './pages/SettingsPage';
import useStore from './store/useStore';
import type { PageId } from './types';

// Universe placeholder until Phase 3
function UniversePlaceholder() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌌</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Universe View</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Coming soon — your personal galaxy awaits.</p>
      </div>
    </div>
  );
}

const pageComponents: Record<PageId, React.FC> = {
  dashboard: Dashboard,
  calendar: CalendarPage,
  subjects: SubjectsPage,
  logs: LogsPage,
  analytics: AnalyticsPage,
  revision: RevisionPage,
  goals: GoalsPage,
  universe: UniversePlaceholder,
  settings: SettingsPage,
};

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
};

export default function App() {
  const currentPage = useStore((s) => s.currentPage);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const commandPaletteOpen = useStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const PageComponent = pageComponents[currentPage] || Dashboard;

  return (
    <>
      <StarfieldBackground />
      <Sidebar />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
          >
            <PageComponent />
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {commandPaletteOpen && <CommandPalette />}
      </AnimatePresence>
    </>
  );
}
