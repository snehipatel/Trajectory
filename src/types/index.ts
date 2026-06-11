// ============================================================
// Trajectory — Core Type Definitions
// ============================================================

// ---- Subject Hierarchy ----

export interface Lecture {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string; // ISO date string
  notes?: string;
}

export interface DPP {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  lectures: Lecture[];
  dpps: DPP[];
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string; // 2-letter abbreviation
  color: string; // accent color for the subject
  chapters: Chapter[];
  notes?: string;
}



// ---- Study Logs ----

export type LogEntryType = 'lecture' | 'dpp' | 'task' | 'revision';

export interface LogEntry {
  id: string;
  type: LogEntryType;
  date: string; // ISO date (YYYY-MM-DD)
  timestamp: string; // ISO datetime
  subjectId?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  title: string;
  description?: string;
  duration?: number; // minutes
  category?: string;
  notes?: string;
}

// ---- Revisions ----

export type RevisionStatus = 'pending' | 'completed' | 'missed';

export interface Revision {
  id: string;
  lectureId: string;
  lectureName: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  revisionNumber: 1 | 2 | 3; // 1=+1day, 2=+7days, 3=+30days
  dueDate: string; // ISO date
  status: RevisionStatus;
  completedAt?: string;
}

// ---- Goals ----

export type GoalPeriod = 'weekly' | 'monthly';
export type GoalStatus = 'active' | 'completed' | 'failed';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  period: GoalPeriod;
  targetCount: number;
  currentCount: number;
  category: 'lectures' | 'dpps' | 'tasks' | 'custom';
  subjectId?: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
}

// ---- Notes ----

export interface Note {
  id: string;
  title: string;
  content: string; // markdown
  entityType: 'subject' | 'chapter' | 'lecture' | 'date' | 'general';
  entityId?: string;
  date?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Settings ----

export interface AppSettings {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  dashboardLayout: string[];
  studyHoursGoal: number; // daily hours goal
  revisionEnabled: boolean;
  notificationsEnabled: boolean;
  defaultLectureDuration: number;
  defaultDppDuration: number;
  defaultRevisionDuration: number;
}

// ---- Day Summary ----

export interface DaySummary {
  date: string; // YYYY-MM-DD
  lecturesCompleted: number;
  dppsCompleted: number;
  tasksCompleted: number;
  totalStudyMinutes: number;
  entries: LogEntry[];
}

// ---- Analytics ----

export interface SubjectProgress {
  subjectId: string;
  subjectName: string;
  shortName: string;
  color: string;
  totalLectures: number;
  completedLectures: number;
  totalDpps: number;
  completedDpps: number;
  lecturePercentage: number;
  dppPercentage: number;
  overallPercentage: number;
  lastStudiedDate?: string;
  daysSinceLastStudy: number;
  totalStudyMinutes: number;
}

export interface StudyStreak {
  current: number;
  longest: number;
  streakDates: string[];
}

// ---- Navigation ----

export type PageId =
  | 'dashboard'
  | 'calendar'
  | 'subjects'
  | 'logs'
  | 'analytics'
  | 'revision'
  | 'goals'
  | 'universe'
  | 'settings';
