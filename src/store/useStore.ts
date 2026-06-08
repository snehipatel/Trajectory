// ============================================================
// Trajectory — Zustand Store
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Subject,
  LogEntry,
  WeeklyTest,
  Revision,
  Goal,
  Note,
  AppSettings,
  PageId,
  LogEntryType,
} from '../types';
import { initializeSeedData } from '../data/seedData';
import { generateId, getToday } from '../lib/utils';

// Helper to sync user's current subjects progress with modified seed data dynamically
function syncSubjectsWithSeedData(currentSubjects: Subject[], seedSubjects: Subject[]): Subject[] {
  if (!Array.isArray(currentSubjects) || currentSubjects.length === 0) {
    return seedSubjects;
  }

  return seedSubjects.map((seedSub) => {
    const curSub = currentSubjects.find((s) => s.name === seedSub.name);
    if (!curSub) return seedSub;

    return {
      ...seedSub,
      id: curSub.id,
      notes: curSub.notes,
      chapters: seedSub.chapters.map((seedChap) => {
        const curChap = curSub.chapters.find((c) => c.name === seedChap.name);
        if (!curChap) {
          return {
            ...seedChap,
            subjectId: curSub.id,
          };
        }

        const lectures = seedChap.lectures.map((seedLec) => {
          const curLec = curChap.lectures.find((l) => l.name === seedLec.name);
          if (curLec) {
            return {
              ...seedLec,
              id: curLec.id,
              completed: curLec.completed,
              completedAt: curLec.completedAt,
              notes: curLec.notes,
            };
          }
          return seedLec;
        });

        const dpps = seedChap.dpps.map((seedDpp) => {
          const curDpp = curChap.dpps.find((d) => d.name === seedDpp.name);
          if (curDpp) {
            return {
              ...seedDpp,
              id: curDpp.id,
              completed: curDpp.completed,
              completedAt: curDpp.completedAt,
              notes: curDpp.notes,
            };
          }
          return seedDpp;
        });

        return {
          ...seedChap,
          id: curChap.id,
          subjectId: curSub.id,
          notes: curChap.notes,
          lectures,
          dpps,
        };
      }),
    };
  });
}

// ---- Store State ----

interface TrajectoryState {
  // Data
  subjects: Subject[];
  logs: LogEntry[];
  weeklyTests: WeeklyTest[];
  revisions: Revision[];
  goals: Goal[];
  notes: Note[];
  settings: AppSettings;

  // UI State
  currentPage: PageId;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  selectedDate: string | null;

  // Subject Actions
  toggleLecture: (subjectId: string, chapterId: string, lectureId: string) => void;
  toggleDpp: (subjectId: string, chapterId: string, dppId: string) => void;
  importSubjects: (subjects: Subject[]) => void;

  // Log Actions
  addLogEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  addCustomTask: (task: {
    title: string;
    category: string;
    notes?: string;
    duration?: number;
  }) => void;
  deleteLogEntry: (id: string) => void;

  // Weekly Test Actions
  addWeeklyTest: (test: Omit<WeeklyTest, 'id'>) => void;
  deleteWeeklyTest: (id: string) => void;

  // Revision Actions
  generateRevisions: (
    lectureId: string,
    lectureName: string,
    chapterId: string,
    chapterName: string,
    subjectId: string,
    subjectName: string
  ) => void;
  completeRevision: (id: string) => void;
  missRevision: (id: string) => void;

  // Goal Actions
  addGoal: (goal: Omit<Goal, 'id' | 'status' | 'currentCount'>) => void;
  updateGoalProgress: (id: string, increment: number) => void;
  deleteGoal: (id: string) => void;

  // Note Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;

  // UI Actions
  setCurrentPage: (page: PageId) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSelectedDate: (date: string | null) => void;

  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Data Management
  exportData: () => string;
  importData: (json: string) => void;
  resetData: () => void;
}

// ---- Default Settings ----

const defaultSettings: AppSettings = {
  theme: 'light',
  sidebarCollapsed: false,
  dashboardLayout: [
    'stats',
    'heatmap',
    'weekly',
    'streak',
    'readiness',
    'insights',
    'revisions',
  ],
  studyHoursGoal: 8,
  revisionEnabled: true,
  notificationsEnabled: false,
};

// ---- Store ----

const useStore = create<TrajectoryState>()(
  persist(
    (set, get) => ({
      // Initial Data
      subjects: initializeSeedData(),
      logs: [],
      weeklyTests: [],
      revisions: [],
      goals: [],
      notes: [],
      settings: defaultSettings,

      // UI State
      currentPage: 'dashboard',
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      selectedDate: null,

      // ── Subject Actions ──

      toggleLecture: (subjectId, chapterId, lectureId) => {
        set((state) => {
          const subjects = state.subjects.map((subject) => {
            if (subject.id !== subjectId) return subject;
            return {
              ...subject,
              chapters: subject.chapters.map((chapter) => {
                if (chapter.id !== chapterId) return chapter;
                return {
                  ...chapter,
                  lectures: chapter.lectures.map((lecture) => {
                    if (lecture.id !== lectureId) return lecture;
                    const nowCompleted = !lecture.completed;
                    const completedAt = nowCompleted
                      ? new Date().toISOString()
                      : undefined;

                    // If completing, add log entry and generate revisions
                    if (nowCompleted) {
                      const today = getToday();
                      const logEntry: LogEntry = {
                        id: generateId(),
                        type: 'lecture',
                        date: today,
                        timestamp: new Date().toISOString(),
                        subjectId: subject.id,
                        subjectName: subject.name,
                        chapterId: chapter.id,
                        chapterName: chapter.name,
                        title: `Completed: ${lecture.name}`,
                        description: `${subject.name} → ${chapter.name} → ${lecture.name}`,
                      };

                      // Add log and revisions in a setTimeout to avoid nested set
                      setTimeout(() => {
                        get().addLogEntry({
                          type: logEntry.type,
                          date: logEntry.date,
                          subjectId: logEntry.subjectId,
                          subjectName: logEntry.subjectName,
                          chapterId: logEntry.chapterId,
                          chapterName: logEntry.chapterName,
                          title: logEntry.title,
                          description: logEntry.description,
                        });
                        if (get().settings.revisionEnabled) {
                          get().generateRevisions(
                            lecture.id,
                            lecture.name,
                            chapter.id,
                            chapter.name,
                            subject.id,
                            subject.name
                          );
                        }
                      }, 0);
                    }

                    return { ...lecture, completed: nowCompleted, completedAt };
                  }),
                };
              }),
            };
          });
          return { subjects };
        });
      },

      toggleDpp: (subjectId, chapterId, dppId) => {
        set((state) => {
          const subjects = state.subjects.map((subject) => {
            if (subject.id !== subjectId) return subject;
            return {
              ...subject,
              chapters: subject.chapters.map((chapter) => {
                if (chapter.id !== chapterId) return chapter;
                return {
                  ...chapter,
                  dpps: chapter.dpps.map((dpp) => {
                    if (dpp.id !== dppId) return dpp;
                    const nowCompleted = !dpp.completed;
                    const completedAt = nowCompleted
                      ? new Date().toISOString()
                      : undefined;

                    if (nowCompleted) {
                      setTimeout(() => {
                        get().addLogEntry({
                          type: 'dpp',
                          date: getToday(),
                          subjectId: subject.id,
                          subjectName: subject.name,
                          chapterId: chapter.id,
                          chapterName: chapter.name,
                          title: `Completed: ${dpp.name}`,
                          description: `${subject.name} → ${chapter.name} → ${dpp.name}`,
                        });
                      }, 0);
                    }

                    return { ...dpp, completed: nowCompleted, completedAt };
                  }),
                };
              }),
            };
          });
          return { subjects };
        });
      },

      importSubjects: (subjects) => set({ subjects }),

      // ── Log Actions ──

      addLogEntry: (entry) => {
        const logEntry: LogEntry = {
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ logs: [logEntry, ...state.logs] }));
      },

      addCustomTask: (task) => {
        const entry: LogEntry = {
          id: generateId(),
          type: 'task',
          date: getToday(),
          timestamp: new Date().toISOString(),
          title: task.title,
          category: task.category,
          notes: task.notes,
          duration: task.duration,
        };
        set((state) => ({ logs: [entry, ...state.logs] }));
      },

      deleteLogEntry: (id) => {
        set((state) => ({
          logs: state.logs.filter((l) => l.id !== id),
        }));
      },

      // ── Weekly Test Actions ──

      addWeeklyTest: (test) => {
        const newTest: WeeklyTest = { ...test, id: generateId() };
        set((state) => ({
          weeklyTests: [newTest, ...state.weeklyTests],
        }));
        // Also add a log entry
        get().addLogEntry({
          type: 'test',
          date: test.date,
          subjectId: test.subjectId,
          title: `Test: ${test.name}`,
          description: `Score: ${test.marks}/${test.totalMarks} (${test.accuracy}%)`,
        });
      },

      deleteWeeklyTest: (id) => {
        set((state) => ({
          weeklyTests: state.weeklyTests.filter((t) => t.id !== id),
        }));
      },

      // ── Revision Actions ──

      generateRevisions: (
        lectureId,
        lectureName,
        chapterId,
        chapterName,
        subjectId,
        subjectName
      ) => {
        const today = new Date();
        const revisionIntervals = [1, 7, 30];
        const newRevisions: Revision[] = revisionIntervals.map(
          (days, index) => {
            const dueDate = new Date(today);
            dueDate.setDate(dueDate.getDate() + days);
            return {
              id: generateId(),
              lectureId,
              lectureName,
              chapterId,
              chapterName,
              subjectId,
              subjectName,
              revisionNumber: (index + 1) as 1 | 2 | 3,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pending',
            };
          }
        );
        set((state) => ({
          revisions: [...state.revisions, ...newRevisions],
        }));
      },

      completeRevision: (id) => {
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
        const revision = get().revisions.find((r) => r.id === id);
        if (revision) {
          get().addLogEntry({
            type: 'revision',
            date: getToday(),
            subjectId: revision.subjectId,
            subjectName: revision.subjectName,
            chapterId: revision.chapterId,
            chapterName: revision.chapterName,
            title: `Revision ${revision.revisionNumber}: ${revision.lectureName}`,
            description: `${revision.subjectName} → ${revision.chapterName}`,
          });
        }
      },

      missRevision: (id) => {
        set((state) => ({
          revisions: state.revisions.map((r) =>
            r.id === id ? { ...r, status: 'missed' as const } : r
          ),
        }));
      },

      // ── Goal Actions ──

      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: generateId(),
          currentCount: 0,
          status: 'active',
        };
        set((state) => ({ goals: [...state.goals, newGoal] }));
      },

      updateGoalProgress: (id, increment) => {
        set((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== id) return g;
            const newCount = Math.min(g.currentCount + increment, g.targetCount);
            const status =
              newCount >= g.targetCount ? 'completed' : g.status;
            return { ...g, currentCount: newCount, status };
          }),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      // ── Note Actions ──

      addNote: (note) => {
        const now = new Date().toISOString();
        const newNote: Note = {
          ...note,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ notes: [...state.notes, newNote] }));
      },

      updateNote: (id, content) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, content, updatedAt: new Date().toISOString() }
              : n
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },

      // ── UI Actions ──

      setCurrentPage: (page) => set({ currentPage: page }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setSelectedDate: (date) => set({ selectedDate: date }),

      // ── Settings ──

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // ── Data Management ──

      exportData: () => {
        const state = get();
        const data = {
          subjects: state.subjects,
          logs: state.logs,
          weeklyTests: state.weeklyTests,
          revisions: state.revisions,
          goals: state.goals,
          notes: state.notes,
          settings: state.settings,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
        };
        return JSON.stringify(data, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          const syncedSubjects = syncSubjectsWithSeedData(data.subjects || [], initializeSeedData());
          set({
            subjects: syncedSubjects,
            logs: data.logs || [],
            weeklyTests: data.weeklyTests || [],
            revisions: data.revisions || [],
            goals: data.goals || [],
            notes: data.notes || [],
            settings: { ...defaultSettings, ...data.settings },
          });
        } catch (e) {
          console.error('Failed to import data:', e);
        }
      },

      resetData: () => {
        set({
          subjects: initializeSeedData(),
          logs: [],
          weeklyTests: [],
          revisions: [],
          goals: [],
          notes: [],
          settings: defaultSettings,
        });
      },
    }),
    {
      name: 'trajectory-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          if (persistedState) {
            if (Array.isArray(persistedState.subjects)) {
              persistedState.subjects = persistedState.subjects.map((s: any) => {
                if (s.name === 'Data Structure through C++') {
                  return { ...s, name: 'Data Structure through Python' };
                }
                return s;
              });
            }
            if (Array.isArray(persistedState.logs)) {
              persistedState.logs = persistedState.logs.map((l: any) => {
                if (l.subjectName === 'Data Structure through C++') {
                  return { ...l, subjectName: 'Data Structure through Python' };
                }
                return l;
              });
            }
            if (Array.isArray(persistedState.revisions)) {
              persistedState.revisions = persistedState.revisions.map((r: any) => {
                if (r.subjectName === 'Data Structure through C++') {
                  return { ...r, subjectName: 'Data Structure through Python' };
                }
                return r;
              });
            }
          }
        }
        return persistedState;
      },
      merge: (persistedState: unknown, currentState: TrajectoryState): TrajectoryState => {
        const persisted = persistedState as Partial<TrajectoryState> | null | undefined;
        if (!persisted) return currentState;
        const seedSubjectsList = initializeSeedData();
        const syncedSubjects = syncSubjectsWithSeedData(persisted.subjects || [], seedSubjectsList);
        return {
          ...currentState,
          ...persisted,
          subjects: syncedSubjects,
        } as TrajectoryState;
      },
      partialize: (state) => ({
        subjects: state.subjects,
        logs: state.logs,
        weeklyTests: state.weeklyTests,
        revisions: state.revisions,
        goals: state.goals,
        notes: state.notes,
        settings: state.settings,
      }),
    }
  )
);

export default useStore;
