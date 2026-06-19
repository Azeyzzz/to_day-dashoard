export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
}

export interface Habit {
  id: string;
  name: string;
  completions: Record<string, boolean>; // date string -> done
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // "2026-06-18"
}
