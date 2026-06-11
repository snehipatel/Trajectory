import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import useStore from '@/store/useStore';
import { percentOf } from '@/lib/utils';
import PlanetRenderer from '@/components/space/PlanetRenderer';

// ── Subject relationships for constellation lines ──
const CONNECTIONS: [string, string][] = [
  ['Foundation of Engineering Mathematics', 'Linear Algebra'],
  ['Foundation of Engineering Mathematics', 'Calculus and Optimization'],
  ['Foundation of Engineering Mathematics', 'Probability and Statistics'],
  ['Linear Algebra', 'Machine Learning'],
  ['Algorithms', 'Data Structure through Python'],
  ['Machine Learning', 'Artificial Intelligence'],
  ['Python for Data Science', 'Data Structure through Python'],
  ['Python for Data Science', 'Machine Learning'],
  ['Database Management System', 'Warehousing'],
  ['Verbal Aptitude', 'General Aptitude'],
];

export default function UniversePage() {
  const subjects = useStore((s) => s.subjects);
  const setCurrentPage = useStore((s) => s.setCurrentPage);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Calculate completion per subject
  const subjectData = useMemo(() => {
    return subjects.map((s) => {
      const total = s.chapters.reduce((sum, c) => sum + c.lectures.length + c.dpps.length, 0);
      const completed = s.chapters.reduce(
        (sum, c) => sum + c.lectures.filter((l) => l.completed).length + c.dpps.filter((d) => d.completed).length, 0
      );
      return { ...s, total, completed, pct: percentOf(completed, total) };
    });
  }, [subjects]);

  // Overall completion
  const overallPct = useMemo(() => {
    const total = subjectData.reduce((s, d) => s + d.total, 0);
    const completed = subjectData.reduce((s, d) => s + d.completed, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [subjectData]);

  // Position planets in a galaxy spiral
  const positions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const centerX = 500;
    const centerY = 400;
    const count = subjectData.length;

    subjectData.forEach((s, i) => {
      const angle = (i / count) * Math.PI * 2.5 + Math.PI * 0.3;
      const armRadius = 120 + i * 22;
      const x = centerX + Math.cos(angle) * armRadius;
      const y = centerY + Math.sin(angle) * armRadius * 0.7;
      pos[s.name] = { x, y };
    });
    return pos;
  }, [subjectData]);

  // Pan/zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(0.4, Math.min(2.5, zoom - e.deltaY * 0.001));
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };

  const handleMouseUp = () => setDragging(false);

  const hoveredData = hoveredSubject ? subjectData.find((s) => s.name === hoveredSubject) : null;

  return (
    <div>
      <div className="page-header">
        <h1>Universe</h1>
        <p className="page-subtitle">
          Your personal galaxy — Universe Expansion: {overallPct}% · Scroll to zoom, drag to pan, click planets to explore
        </p>
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: 'calc(100vh - 160px)',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          background: 'rgba(5, 8, 22, 0.6)',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          width: 1000,
          height: 800,
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -500,
          marginTop: -400,
        }}>
          {/* Connection lines */}
          <svg width={1000} height={800} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {CONNECTIONS.map(([a, b], i) => {
              const pa = positions[a];
              const pb = positions[b];
              if (!pa || !pb) return null;
              const aData = subjectData.find((s) => s.name === a);
              const bData = subjectData.find((s) => s.name === b);
              const bothActive = (aData?.pct || 0) > 0 && (bData?.pct || 0) > 0;
              return (
                <line
                  key={i}
                  x1={pa.x} y1={pa.y}
                  x2={pb.x} y2={pb.y}
                  stroke={bothActive ? 'rgba(129, 140, 248, 0.15)' : 'rgba(148, 163, 184, 0.06)'}
                  strokeWidth={bothActive ? 1.5 : 1}
                  strokeDasharray={bothActive ? 'none' : '4 6'}
                />
              );
            })}
          </svg>

          {/* Planets */}
          {subjectData.map((s) => {
            const pos = positions[s.name];
            if (!pos) return null;
            const planetSize = 60 + (s.total > 0 ? (s.total / 50) * 30 : 0);
            const isHovered = hoveredSubject === s.name;

            return (
              <motion.div
                key={s.id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isHovered ? 10 : 1,
                }}
                onMouseEnter={() => setHoveredSubject(s.name)}
                onMouseLeave={() => setHoveredSubject(null)}
                onDoubleClick={() => setCurrentPage('subjects')}
                whileHover={{ scale: 1.1 }}
              >
                <PlanetRenderer
                  subjectName={s.name}
                  color={s.color}
                  size={Math.min(110, Math.max(55, planetSize))}
                  completion={s.pct}
                  showOrbit={true}
                  showLabel={true}
                  animated={isHovered}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Hover tooltip */}
        {hoveredData && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: 'absolute',
              top: 16, right: 16,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--color-border-glow)',
              borderRadius: 14,
              padding: '16px 20px',
              minWidth: 200,
              zIndex: 20,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: hoveredData.color }}>
              {hoveredData.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <div>Completion: <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{hoveredData.pct}%</span></div>
              <div>Chapters: {hoveredData.chapters.length}</div>
              <div>Progress: {hoveredData.completed}/{hoveredData.total}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>Double-click to view</div>
          </motion.div>
        )}

        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} style={{ fontSize: 16, width: 32, height: 32, justifyContent: 'center', padding: 0 }}>+</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))} style={{ fontSize: 16, width: 32, height: 32, justifyContent: 'center', padding: 0 }}>−</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ fontSize: 11, height: 32 }}>Reset</button>
        </div>
      </div>
    </div>
  );
}
