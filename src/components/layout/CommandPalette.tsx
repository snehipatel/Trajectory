import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import {
  Search,
  BookOpen,
  FileText,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Target,
  Settings,
  ScrollText,
  RefreshCw,
  Globe,
  ArrowRight,
} from 'lucide-react';
import useStore from '@/store/useStore';
import type { PageId } from '@/types';

interface SearchItem {
  id: string;
  type: 'page' | 'subject' | 'chapter' | 'lecture';
  title: string;
  subtitle?: string;
  icon: React.FC<{ size?: number }>;
  action: () => void;
}

const pageIcons: Record<PageId, React.FC<{ size?: number }>> = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  subjects: BookOpen,
  logs: ScrollText,
  analytics: BarChart3,
  revision: RefreshCw,
  goals: Target,
  universe: Globe,
  settings: Settings,
};

export default function CommandPalette() {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const subjects = useStore((s) => s.subjects);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [];

    // Pages
    const pages: { id: PageId; label: string }[] = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'subjects', label: 'Subjects' },
      { id: 'logs', label: 'Logs' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'revision', label: 'Revision Tracker' },
      { id: 'goals', label: 'Goals' },
      { id: 'universe', label: 'Universe' },
      { id: 'settings', label: 'Settings' },
    ];

    pages.forEach((p) => {
      items.push({
        id: `page-${p.id}`,
        type: 'page',
        title: p.label,
        subtitle: 'Navigate to page',
        icon: pageIcons[p.id],
        action: () => {
          setCurrentPage(p.id);
          setCommandPaletteOpen(false);
        },
      });
    });

    // Subjects and chapters
    subjects.forEach((subject) => {
      items.push({
        id: `subject-${subject.id}`,
        type: 'subject',
        title: subject.name,
        subtitle: `${subject.chapters.length} chapters`,
        icon: BookOpen,
        action: () => {
          setCurrentPage('subjects');
          setCommandPaletteOpen(false);
        },
      });

      subject.chapters.forEach((chapter) => {
        items.push({
          id: `chapter-${chapter.id}`,
          type: 'chapter',
          title: chapter.name,
          subtitle: subject.name,
          icon: FileText,
          action: () => {
            setCurrentPage('subjects');
            setCommandPaletteOpen(false);
          },
        });
      });
    });

    return items;
  }, [subjects, setCurrentPage, setCommandPaletteOpen]);

  const fuse = useMemo(
    () =>
      new Fuse(allItems, {
        keys: ['title', 'subtitle'],
        threshold: 0.4,
        includeScore: true,
      }),
    [allItems]
  );

  const results = query.trim()
    ? fuse.search(query).map((r) => r.item).slice(0, 8)
    : allItems.slice(0, 8);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      results[selectedIndex].action();
    }
  };

  return (
    <motion.div
      className="command-palette"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="command-palette-overlay"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <motion.div
        className="command-palette-box"
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
          <Search size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="command-palette-input"
            style={{ borderBottom: 'none', paddingLeft: 0 }}
            placeholder="Search subjects, chapters, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd
            style={{
              padding: '2px 8px',
              background: 'var(--color-bg-hover)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--color-text-muted)',
              fontFamily: 'inherit',
              border: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>
        <div style={{ borderTop: '1px solid var(--color-border-light)' }} />
        <div className="command-palette-results">
          {results.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
              No results found
            </div>
          )}
          {results.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Icon size={18} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 14 }}>
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {item.subtitle}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    textTransform: 'capitalize',
                    background: 'var(--color-bg-hover)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {item.type}
                </span>
                <ArrowRight size={14} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            );
          })}
        </div>
        <div
          style={{
            borderTop: '1px solid var(--color-border-light)',
            padding: '8px 16px',
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: 'var(--color-text-muted)',
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
