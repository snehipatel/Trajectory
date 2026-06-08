// ============================================================
// Trajectory — Seed Data (Physics Wallah Course Structure)
// ============================================================

import type { Subject } from '../types';

// Helper to create lecture objects
const makeLectures = (count: number, prefix = 'Lecture') =>
  Array.from({ length: count }, (_, i) => ({
    id: `lec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    name: `${prefix} ${i + 1}`,
    completed: false,
  }));

const makeDpps = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `dpp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${i}`,
    name: `DPP ${i + 1}`,
    completed: false,
  }));

let _ctr = 0;
const uid = () => `seed-${++_ctr}`;

export const seedSubjects: Subject[] = [
  // ── Foundation of Engineering Mathematics ──
  {
    id: uid(),
    name: 'Foundation of Engineering Mathematics',
    shortName: 'Fo',
    color: '#6366F1',
    chapters: [
      {
        id: uid(),
        name: 'Prerequisites of Engineering Mathematics',
        subjectId: 'seed-1',
        lectures: makeLectures(25),
        dpps: [],
      },
    ],
  },
  // ── Linear Algebra ──
  {
    id: uid(),
    name: 'Linear Algebra',
    shortName: 'Li',
    color: '#8B5CF6',
    chapters: [
      {
        id: uid(),
        name: 'Linear Algebra - 1',
        subjectId: 'seed-3',
        lectures: makeLectures(20),
        dpps: [],
      },
    ],
  },
  // ── Basics of Computer System ──
  {
    id: uid(),
    name: 'Basics of Computer System',
    shortName: 'Bc',
    color: '#EC4899',
    chapters: [
      {
        id: uid(),
        name: 'Basics Of Computer System',
        subjectId: 'seed-5',
        lectures: makeLectures(10),
        dpps: [],
      },
    ],
  },
  // ── Database Management System ──
  {
    id: uid(),
    name: 'Database Management System',
    shortName: 'Da',
    color: '#EF4444',
    chapters: [
      {
        id: uid(),
        name: 'Relational Model and Algebra',
        subjectId: 'seed-7',
        lectures: makeLectures(9),
        dpps: makeDpps(2),
      },
      {
        id: uid(),
        name: 'Queries',
        subjectId: 'seed-7',
        lectures: makeLectures(13),
        dpps: makeDpps(2),
      },
      {
        id: uid(),
        name: 'ER MODEL',
        subjectId: 'seed-7',
        lectures: makeLectures(2),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Indexing',
        subjectId: 'seed-7',
        lectures: makeLectures(7),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Transaction and Concurrency',
        subjectId: 'seed-7',
        lectures: makeLectures(11),
        dpps: makeDpps(1),
      },
    ],
  },
  // ── Algorithms ──
  {
    id: uid(),
    name: 'Algorithms',
    shortName: 'Al',
    color: '#F59E0B',
    chapters: [
      {
        id: uid(),
        name: 'Analysis of Algorithms',
        subjectId: 'seed-13',
        lectures: makeLectures(9),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Sorting Algorithms',
        subjectId: 'seed-13',
        lectures: makeLectures(8),
        dpps: makeDpps(2),
      },
      {
        id: uid(),
        name: 'Divide and Conquer',
        subjectId: 'seed-13',
        lectures: makeLectures(6),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Greedy Method',
        subjectId: 'seed-13',
        lectures: makeLectures(7),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Dynamic Programming',
        subjectId: 'seed-13',
        lectures: makeLectures(7),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Graph Algorithms',
        subjectId: 'seed-13',
        lectures: makeLectures(3),
        dpps: makeDpps(0),
      },
      {
        id: uid(),
        name: 'Miscellaneous',
        subjectId: 'seed-13',
        lectures: makeLectures(5),
        dpps: makeDpps(1),
      },
    ],
  },
  // ── Calculus and Optimization ──
  {
    id: uid(),
    name: 'Calculus and Optimization',
    shortName: 'Ca',
    color: '#10B981',
    chapters: [
      {
        id: uid(),
        name: 'Functions and Graphs',
        subjectId: 'seed-21',
        lectures: makeLectures(3),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Limit, Continuity and Differentiability',
        subjectId: 'seed-21',
        lectures: makeLectures(5),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Taylor and Maclaurin Series',
        subjectId: 'seed-21',
        lectures: makeLectures(1),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Mean Value Theorems',
        subjectId: 'seed-21',
        lectures: makeLectures(2),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Derivatives and Their Applications',
        subjectId: 'seed-21',
        lectures: makeLectures(3),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Maxima and Minima',
        subjectId: 'seed-21',
        lectures: makeLectures(3),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Integration',
        subjectId: 'seed-21',
        lectures: makeLectures(2),
        dpps: [],
      },
    ],
  },
  // ── Python for Data Science ──
  {
    id: uid(),
    name: 'Python for Data Science',
    shortName: 'Py',
    color: '#3B82F6',
    chapters: [
      {
        id: uid(),
        name: 'Basics of Python',
        subjectId: 'seed-29',
        lectures: makeLectures(6),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Control Statements',
        subjectId: 'seed-29',
        lectures: makeLectures(3),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Python Collections and Functions',
        subjectId: 'seed-29',
        lectures: makeLectures(6),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Functions and Modules',
        subjectId: 'seed-29',
        lectures: makeLectures(6),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Classes and Modules',
        subjectId: 'seed-29',
        lectures: makeLectures(3),
        dpps: makeDpps(1),
      },
    ],
  },
  // ── Verbal Aptitude ──
  {
    id: uid(),
    name: 'Verbal Aptitude',
    shortName: 'Ve',
    color: '#F97316',
    chapters: [
      {
        id: uid(),
        name: 'Parts of Speech',
        subjectId: 'seed-35',
        lectures: makeLectures(2),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Vocabulary',
        subjectId: 'seed-35',
        lectures: makeLectures(3),
        dpps: [],
      },
      {
        id: uid(),
        name: 'Reading Comprehension',
        subjectId: 'seed-35',
        lectures: makeLectures(1),
        dpps: makeDpps(1),
      },
    ],
  },
  // ── Probability and Statistics ──
  {
    id: uid(),
    name: 'Probability and Statistics',
    shortName: 'Pr',
    color: '#14B8A6',
    chapters: [],
  },
  // ── Machine Learning ──
  {
    id: uid(),
    name: 'Machine Learning',
    shortName: 'Ma',
    color: '#A855F7',
    chapters: [],
  },
  // ── Artificial Intelligence ──
  {
    id: uid(),
    name: 'Artificial Intelligence',
    shortName: 'Ar',
    color: '#06B6D4',
    chapters: [],
  },
  // ── Warehousing ──
  {
    id: uid(),
    name: 'Warehousing',
    shortName: 'Wa',
    color: '#84CC16',
    chapters: [],
  },
  // ── General Aptitude ──
  {
    id: uid(),
    name: 'General Aptitude',
    shortName: 'Ge',
    color: '#D946EF',
    chapters: [],
  },
  // ── Data Structure through Python ──
  {
    id: uid(),
    name: 'Data Structure through Python',
    shortName: 'Ds',
    color: '#0EA5E9',
    chapters: [
      {
        id: uid(),
        name: 'CH 01 : Lists and Arrays',
        subjectId: '',
        lectures: makeLectures(3),
        dpps: [],
      },
      {
        id: uid(),
        name: 'CH 02 : Stack',
        subjectId: '',
        lectures: makeLectures(4),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'CH 03 : Queues and Hashing',
        subjectId: '',
        lectures: makeLectures(5),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'CH 04 : Linked Lists',
        subjectId: '',
        lectures: makeLectures(6),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'CH 05 : Trees',
        subjectId: '',
        lectures: makeLectures(5),
        dpps: makeDpps(1),
      },
      {
        id: uid(),
        name: 'Practice Session',
        subjectId: '',
        lectures: makeLectures(2),
        dpps: [],
      },
    ],
  },
];

// Fix subjectId references after construction
export function initializeSeedData(): Subject[] {
  return seedSubjects.map((subject) => ({
    ...subject,
    chapters: subject.chapters.map((chapter) => ({
      ...chapter,
      subjectId: subject.id,
    })),
  }));
}
