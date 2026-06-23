import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Habit = {
  id: number;
  label: string;
  done: boolean;
  completedDates: string[]; // YYYY-MM-DD dates when habit was completed
};

type Reminder = {
  id: number;
  title: string;
  time: string;
};

type StickyNote = {
  id: number;
  text: string;
  color: "lavender" | "rose" | "sky" | "mint";
};

type CalendarEvent = {
  id: number;
  date: string;
  title: string;
  time: string;
  color: "lavender" | "rose" | "sky" | "mint";
};

const HABITS_STORAGE_KEY = "to-day-dashboard.habits";
const REMINDER_STORAGE_KEY = "to-day-dashboard.reminders";
const NOTES_STORAGE_KEY = "to-day-dashboard.notes";
const EVENTS_STORAGE_KEY = "to-day-dashboard.events";
const NAME_STORAGE_KEY = "to-day-dashboard.name";

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const who = name ? name : "Friend";
  if (hour < 12) return `Good morning ${who}`;
  if (hour < 18) return `Good afternoon ${who}`;
  return `Good evening ${who}`;
}

function getToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function getInitialName(): string {
  return loadFromStorage<string>(NAME_STORAGE_KEY, "Friend");
}
function getInitialHabits(): Habit[] {
  return loadFromStorage<Habit[]>(HABITS_STORAGE_KEY, [
    { id: 1, label: "Start a habit", done: false, completedDates: [] },
    { id: 2, label: "Add one below", done: false, completedDates: [] },
    {
      id: 3,
      label: "Remove existing ones below",
      done: false,
      completedDates: [],
    },
  ]);
}

function getInitialReminders(): Reminder[] {
  return loadFromStorage<Reminder[]>(REMINDER_STORAGE_KEY, [
    { id: 1, title: "Set reminders here", time: "2:00 PM" },
    { id: 2, title: "LOCK IN", time: "6:00 PM" },
  ]);
}

function getInitialNotes(): StickyNote[] {
  return loadFromStorage<StickyNote[]>(NOTES_STORAGE_KEY, [
    { id: 1, text: "Make your own sticky notes :P", color: "lavender" },
  ]);
}

function getInitialEvents(): CalendarEvent[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return loadFromStorage<CalendarEvent[]>(EVENTS_STORAGE_KEY, [
    {
      id: 1,
      date: `${year}-${month}-03`,
      title: "Coffee",
      time: "10:00 AM",
      color: "lavender",
    },
    {
      id: 2,
      date: `${year}-${month}-08`,
      title: "Work block",
      time: "1:30 PM",
      color: "sky",
    },
  ]);
}

function getDaysInMonth(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDay + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
  });
}

function App() {
  const [name, setName] = useState<string>(getInitialName);
  const [habits, setHabits] = useState<Habit[]>(getInitialHabits);
  const [reminders, setReminders] = useState<Reminder[]>(getInitialReminders);
  const [notes, setNotes] = useState<StickyNote[]>(getInitialNotes);
  const [events, setEvents] = useState<CalendarEvent[]>(getInitialEvents);
  const [draggedNoteId, setDraggedNoteId] = useState<number | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("to-day-dashboard.theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [newHabit, setNewHabit] = useState("");
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editingHabitLabel, setEditingHabitLabel] = useState("");

  const [newReminderTitle, setNewReminderTitle] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");

  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteColor, setNewNoteColor] =
    useState<StickyNote["color"]>("lavender");

  const today = useMemo(() => new Date(), []);
  const currentMonthDays = useMemo(() => getDaysInMonth(viewDate), [viewDate]);
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  const [newEventDate, setNewEventDate] = useState(formatInputDate(today));
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventColor, setNewEventColor] =
    useState<CalendarEvent["color"]>("lavender");

  useEffect(() => {
    window.localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    window.localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify(reminders),
    );
  }, [reminders]);

  useEffect(() => {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("to-day-dashboard.theme", theme);
  }, [theme]);

  function addHabit() {
    const label = newHabit.trim();
    if (!label) return;

    // prevent exact-duplicate labels (case-insensitive)
    const exists = habits.some(
      (h) => h.label.trim().toLowerCase() === label.toLowerCase(),
    );
    if (exists) {
      setNewHabit("");
      return;
    }

    setHabits((current) => [
      { id: Date.now(), label, done: false, completedDates: [] },
      ...current,
    ]);
    setNewHabit("");
  }

  function toggleHabit(id: number) {
    const today = formatInputDate(new Date());
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) return habit;

        const dates = habit.completedDates ?? [];
        const already = dates.includes(today);
        const completedDates = already
          ? dates.filter((d) => d !== today)
          : [today, ...dates];

        return {
          ...habit,
          completedDates,
          done: !already,
        };
      }),
    );
  }

  function startEditHabit(habit: Habit) {
    setEditingHabitId(habit.id);
    setEditingHabitLabel(habit.label);
  }

  function saveHabitEdit(id: number) {
    const label = editingHabitLabel.trim();
    if (!label) return;

    setHabits((current) =>
      current.map((habit) => (habit.id === id ? { ...habit, label } : habit)),
    );
    setEditingHabitId(null);
    setEditingHabitLabel("");
  }

  function cancelEditHabit() {
    setEditingHabitId(null);
    setEditingHabitLabel("");
  }

  function deleteHabit(id: number) {
    setHabits((current) => current.filter((habit) => habit.id !== id));
    if (editingHabitId === id) cancelEditHabit();
  }

  function addReminder() {
    const title = newReminderTitle.trim();
    const time = newReminderTime.trim();
    if (!title || !time) return;

    setReminders((current) => [{ id: Date.now(), title, time }, ...current]);
    setNewReminderTitle("");
    setNewReminderTime("");
  }

  function deleteReminder(id: number) {
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
  }

  function addEvent() {
    const title = newEventTitle.trim();
    const time = newEventTime.trim();

    if (!title || !time || !newEventDate) return;

    setEvents((current) => [
      {
        id: Date.now(),
        date: newEventDate,
        title,
        time,
        color: newEventColor,
      },
      ...current,
    ]);

    setNewEventTitle("");
    setNewEventTime("");
    setNewEventColor("lavender");
  }

  function deleteEvent(id: number) {
    setEvents((current) => current.filter((event) => event.id !== id));
  }

  function addNote() {
    const text = newNoteText.trim();
    if (!text) return;

    setNotes((current) => [
      { id: Date.now(), text, color: newNoteColor },
      ...current,
    ]);
    setNewNoteText("");
    setNewNoteColor("lavender");
  }

  function deleteNote(id: number) {
    setNotes((current) => current.filter((note) => note.id !== id));
  }

  function reorderNotes(activeId: number, overId: number) {
    setNotes((current) => {
      const fromIndex = current.findIndex((note) => note.id === activeId);
      const toIndex = current.findIndex((note) => note.id === overId);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="px-8 pb-6 pt-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sans text-sm font-medium uppercase tracking-wide text-accent-2">
              {getToday()}
            </p>
            <h1 className="mt-1 font-serif text-4xl text-ink">
              {getGreeting(name)}. Welcome to your To_Day Dashboard.
            </h1>
            <div className="mt-5 h-px w-full bg-gradient-to-r from-accent via-card-border to-transparent" />
          </div>

          <button
            type="button"
            onClick={() =>
              setTheme((current) => (current === "dark" ? "light" : "dark"))
            }
            className="rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-background"
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-5 px-8 pb-8 lg:grid-cols-2 items-start">
        <div className="space-y-5 min-w-0">
          <Card title="Calendar">
            <CalendarWidget
              todayDate={todayDate}
              todayMonth={todayMonth}
              todayYear={todayYear}
              viewMonth={viewMonth}
              viewYear={viewYear}
              viewDate={viewDate}
              setViewDate={setViewDate}
              days={currentMonthDays}
              events={events}
              newEventDate={newEventDate}
              setNewEventDate={setNewEventDate}
              newEventTitle={newEventTitle}
              setNewEventTitle={setNewEventTitle}
              newEventTime={newEventTime}
              setNewEventTime={setNewEventTime}
              newEventColor={newEventColor}
              setNewEventColor={setNewEventColor}
              addEvent={addEvent}
              deleteEvent={deleteEvent}
            />
          </Card>

          <Card title="Reminders" className="p-4">
            <ReminderWidget
              reminders={reminders}
              newReminderTitle={newReminderTitle}
              setNewReminderTitle={setNewReminderTitle}
              newReminderTime={newReminderTime}
              setNewReminderTime={setNewReminderTime}
              addReminder={addReminder}
              deleteReminder={deleteReminder}
            />
          </Card>
        </div>

        <div className="space-y-5 min-w-0">
          <Card title="Habit Tracker">
            <HabitWidget
              habits={habits}
              newHabit={newHabit}
              setNewHabit={setNewHabit}
              addHabit={addHabit}
              toggleHabit={toggleHabit}
              startEditHabit={startEditHabit}
              saveHabitEdit={saveHabitEdit}
              cancelEditHabit={cancelEditHabit}
              deleteHabit={deleteHabit}
              editingHabitId={editingHabitId}
              editingHabitLabel={editingHabitLabel}
              setEditingHabitLabel={setEditingHabitLabel}
            />
          </Card>

          <Card title="Sticky Notes">
            <StickyNotesWidget
              notes={notes}
              draggedNoteId={draggedNoteId}
              setDraggedNoteId={setDraggedNoteId}
              reorderNotes={reorderNotes}
              newNoteText={newNoteText}
              setNewNoteText={setNewNoteText}
              newNoteColor={newNoteColor}
              setNewNoteColor={setNewNoteColor}
              addNote={addNote}
              deleteNote={deleteNote}
            />
          </Card>
          <Card title="Settings">
            <SettingWidget currentName={name} setName={setName} />
          </Card>
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-auto rounded-2xl border border-card-border bg-card p-6 shadow-sm ${className}`}
    >
      <h2 className="mb-4 font-serif text-lg text-ink">{title}</h2>
      <div className="font-sans text-sm text-muted">{children}</div>
    </section>
  );
}
function SettingWidget({
  currentName,
  setName,
}: {
  currentName: string;
  setName: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink">Display name</p>
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = draft.trim();
            if (trimmed) setName(trimmed);
            setEditing(false);
          }}
          className="flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-background px-4 py-2 text-ink outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2 text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(currentName);
              setEditing(false);
            }}
            className="rounded-xl border border-card-border px-4 py-2 text-muted"
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="text-ink">{currentName}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl border border-card-border px-3 py-2 text-sm text-accent-2"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function CalendarWidget({
  todayDate,
  todayMonth,
  todayYear,
  viewMonth,
  viewYear,
  viewDate,
  setViewDate,
  days,
  events,
  newEventDate,
  setNewEventDate,
  newEventTitle,
  setNewEventTitle,
  newEventTime,
  setNewEventTime,
  newEventColor,
  setNewEventColor,
  addEvent,
  deleteEvent,
}: {
  todayDate: number;
  todayMonth: number;
  todayYear: number;
  viewMonth: number;
  viewYear: number;
  viewDate: Date;
  setViewDate: (value: Date) => void;
  days: (number | null)[];
  events: CalendarEvent[];
  newEventDate: string;
  setNewEventDate: (value: string) => void;
  newEventTitle: string;
  setNewEventTitle: (value: string) => void;
  newEventTime: string;
  setNewEventTime: (value: string) => void;
  newEventColor: CalendarEvent["color"];
  setNewEventColor: (value: CalendarEvent["color"]) => void;
  addEvent: () => void;
  deleteEvent: (id: number) => void;
}) {
  const [showEventForm, setShowEventForm] = useState(false);

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const currentMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthEvents = events
    .filter((event) => event.date.startsWith(currentMonthKey))
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
    );

  const eventColors: Record<CalendarEvent["color"], string> = {
    lavender: "bg-violet-300",
    rose: "bg-fuchsia-300",
    sky: "bg-sky-300",
    mint: "bg-emerald-300",
  };

  const canAddEvent =
    newEventDate.trim() && newEventTitle.trim() && newEventTime.trim();

  function changeMonth(direction: 1 | -1) {
    setViewDate(new Date(viewYear, viewMonth + direction, 1));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="rounded-xl border border-card-border bg-background px-3 py-2 text-sm font-medium text-ink hover:bg-white"
        >
          ← Prev
        </button>

        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-accent-2">
            Current month
          </p>
          <p className="text-2xl font-serif text-ink">{monthLabel}</p>
        </div>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="rounded-xl border border-card-border bg-background px-3 py-2 text-sm font-medium text-ink hover:bg-white"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} className="font-medium text-accent-2">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const cellDate =
            day === null
              ? ""
              : `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

          const dayEvents = events.filter((event) => event.date === cellDate);

          const isToday =
            day === todayDate &&
            viewMonth === todayMonth &&
            viewYear === todayYear;

          return (
            <div
              key={index}
              className={`min-h-20 rounded-xl p-2 text-left ${
                day === null
                  ? "bg-transparent"
                  : isToday
                    ? "bg-accent text-white"
                    : "bg-background text-ink"
              }`}
            >
              <div className="text-sm font-medium">{day ?? ""}</div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] leading-tight ${
                      isToday
                        ? "bg-white/15 text-white"
                        : "bg-white/70 text-ink"
                    }`}
                  >
                    <span
                      className={`mr-1 inline-block h-2 w-2 rounded-full ${eventColors[event.color]}`}
                    />
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 ? (
                  <div className={isToday ? "text-white/80" : "text-muted"}>
                    +{dayEvents.length - 2} more
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowEventForm((value) => !value)}
        className="w-full rounded-xl border border-card-border bg-background px-4 py-2 text-sm font-medium text-ink hover:bg-white"
      >
        {showEventForm ? "Hide Add Event" : "Add Event"}
      </button>

      {showEventForm ? (
        <form
          className="space-y-2 rounded-2xl border border-card-border bg-background p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canAddEvent) return;
            addEvent();
            setShowEventForm(false);
          }}
        >
          <p className="text-xs uppercase tracking-wide text-accent-2">
            Add event
          </p>
          <input
            type="date"
            value={newEventDate}
            onChange={(e) => setNewEventDate(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <input
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            placeholder="Event title"
            className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-ink outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <input
              value={newEventTime}
              onChange={(e) => setNewEventTime(e.target.value)}
              placeholder="Time, e.g. 2:00 PM"
              className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-ink outline-none focus:border-accent"
            />
            <select
              value={newEventColor}
              onChange={(e) =>
                setNewEventColor(e.target.value as CalendarEvent["color"])
              }
              className="rounded-xl border border-card-border bg-card px-4 py-3 text-ink outline-none focus:border-accent"
            >
              <option value="lavender">Lavender</option>
              <option value="rose">Rose</option>
              <option value="sky">Sky</option>
              <option value="mint">Mint</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-3 font-medium text-white"
          >
            Save Event!
          </button>
        </form>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-accent-2">
          Upcoming events
        </p>
        <div className="space-y-2">
          {monthEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-xl border border-card-border bg-background px-4 py-3"
            >
              <div>
                <p className="text-ink">{event.title}</p>
                <p className="text-xs text-muted">
                  {event.date} · {event.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteEvent(event.id)}
                className="text-sm text-muted"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HabitWidget({
  habits,
  newHabit,
  setNewHabit,
  addHabit,
  toggleHabit,
  startEditHabit,
  saveHabitEdit,
  cancelEditHabit,
  deleteHabit,
  editingHabitId,
  editingHabitLabel,
  setEditingHabitLabel,
}: {
  habits: Habit[];
  newHabit: string;
  setNewHabit: (value: string) => void;
  addHabit: () => void;
  toggleHabit: (id: number) => void;
  startEditHabit: (habit: Habit) => void;
  saveHabitEdit: (id: number) => void;
  cancelEditHabit: () => void;
  deleteHabit: (id: number) => void;
  editingHabitId: number | null;
  editingHabitLabel: string;
  setEditingHabitLabel: (value: string) => void;
}) {
  // helper to compute last-7-days progress percentage
  function last7Progress(dates?: string[]) {
    const datesArr = dates ?? [];
    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return formatInputDate(d);
    });
    const completedCount = last7.reduce(
      (acc, day) => (datesArr.includes(day) ? acc + 1 : acc),
      0,
    );
    return {
      percent: Math.round((completedCount / 7) * 100),
      completedCount,
    };
  }

  // overall today's progress across all habits
  const todayStr = formatInputDate(new Date());
  const completedTodayCount = habits.reduce(
    (acc, h) => acc + ((h.completedDates ?? []).includes(todayStr) ? 1 : 0),
    0,
  );
  const overallPercent = habits.length
    ? Math.round((completedTodayCount / habits.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-accent-2">
          {habits.length}/3 habits
        </p>
        <p className="text-xs text-muted">Daily habits</p>
      </div>

      {/* Overall today's progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink">Today's progress</p>
          <p className="text-sm text-muted">{overallPercent}%</p>
        </div>
        <div className="h-2 w-full rounded-lg bg-card-border">
          <div
            className="h-2 rounded-lg bg-accent transition-all"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addHabit();
        }}
      >
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add a habit..."
          className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-ink outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={newHabit.trim() === ""}
          className={`rounded-xl px-4 py-3 font-medium text-white ${
            newHabit.trim() === ""
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-accent"
          }`}
        >
          Add
        </button>
      </form>

      <ul className="space-y-3">
        {habits.map((habit) => {
          const { percent } = last7Progress(habit.completedDates);
          return (
            <li
              key={habit.id}
              className="flex flex-col gap-2 rounded-xl border border-card-border bg-background px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={(habit.completedDates ?? []).includes(
                    formatInputDate(new Date()),
                  )}
                  onChange={() => toggleHabit(habit.id)}
                />

                <div className="min-w-0 flex-1">
                  {editingHabitId === habit.id ? (
                    <input
                      value={editingHabitLabel}
                      onChange={(e) => setEditingHabitLabel(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-white px-3 py-2 text-ink outline-none focus:border-accent"
                    />
                  ) : (
                    <span
                      className={
                        (habit.completedDates ?? []).includes(
                          formatInputDate(new Date()),
                        )
                          ? "line-through text-muted"
                          : "text-ink"
                      }
                    >
                      {habit.label}
                    </span>
                  )}
                </div>

                {editingHabitId === habit.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => saveHabitEdit(habit.id)}
                      className="text-sm font-medium text-accent-2"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditHabit}
                      className="text-sm text-muted"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEditHabit(habit)}
                      className="text-sm font-medium text-accent-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteHabit(habit.id)}
                      className="text-sm text-muted"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              <div className="mt-1">
                <div className="h-2 w-full rounded-lg bg-card-border">
                  <div
                    className="h-2 rounded-lg bg-accent"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted">
                  {percent}% (last 7 days)
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReminderWidget({
  reminders,
  newReminderTitle,
  setNewReminderTitle,
  newReminderTime,
  setNewReminderTime,
  addReminder,
  deleteReminder,
}: {
  reminders: Reminder[];
  newReminderTitle: string;
  setNewReminderTitle: (value: string) => void;
  newReminderTime: string;
  setNewReminderTime: (value: string) => void;
  addReminder: () => void;
  deleteReminder: (id: number) => void;
}) {
  return (
    <div className="space-y-3">
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          addReminder();
        }}
      >
        <input
          value={newReminderTitle}
          onChange={(e) => setNewReminderTitle(e.target.value)}
          placeholder="Reminder title"
          className="w-full rounded-xl border border-card-border bg-background px-3 py-2 text-ink outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <input
            value={newReminderTime}
            onChange={(e) => setNewReminderTime(e.target.value)}
            placeholder="Time, e.g. 2:00 PM"
            className="w-full rounded-xl border border-card-border bg-background px-3 py-2 text-ink outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white"
          >
            Add
          </button>
        </div>
      </form>

      <ul className="space-y-2">
        {reminders.map((reminder) => (
          <li
            key={reminder.id}
            className="flex items-center justify-between rounded-xl border border-card-border bg-background px-3 py-2"
          >
            <div>
              <p className="text-sm text-ink">{reminder.title}</p>
              <p className="text-[11px] text-muted">{reminder.time}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteReminder(reminder.id)}
              className="text-xs text-muted"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StickyNotesWidget({
  notes,
  draggedNoteId,
  setDraggedNoteId,
  reorderNotes,
  newNoteText,
  setNewNoteText,
  newNoteColor,
  setNewNoteColor,
  addNote,
  deleteNote,
}: {
  notes: StickyNote[];
  draggedNoteId: number | null;
  setDraggedNoteId: (value: number | null) => void;
  reorderNotes: (activeId: number, overId: number) => void;
  newNoteText: string;
  setNewNoteText: (value: string) => void;
  newNoteColor: StickyNote["color"];
  setNewNoteColor: (value: StickyNote["color"]) => void;
  addNote: () => void;
  deleteNote: (id: number) => void;
}) {
  const colorClasses: Record<StickyNote["color"], string> = {
    lavender: "bg-violet-200 text-violet-950",
    rose: "bg-fuchsia-200 text-fuchsia-950",
    sky: "bg-sky-200 text-sky-950",
    mint: "bg-emerald-200 text-emerald-950",
  };

  const noteRotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2"];

  return (
    <div className="space-y-4">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          addNote();
        }}
      >
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Write a sticky note..."
          rows={3}
          className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-ink outline-none focus:border-accent"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={newNoteColor}
            onChange={(e) =>
              setNewNoteColor(e.target.value as StickyNote["color"])
            }
            className="rounded-xl border border-card-border bg-background px-4 py-3 text-ink outline-none focus:border-accent"
          >
            <option value="lavender">Lavender</option>
            <option value="rose">Rose</option>
            <option value="sky">Sky</option>
            <option value="mint">Mint</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-3 font-medium text-white"
          >
            Add Note
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-dashed border-card-border bg-paper/50 p-3">
        <p className="mb-3 text-xs uppercase tracking-wide text-accent-2">
          Drag notes like a board
        </p>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note, index) => (
            <div
              key={note.id}
              draggable
              onDragStart={() => setDraggedNoteId(note.id)}
              onDragEnd={() => setDraggedNoteId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedNoteId !== null && draggedNoteId !== note.id) {
                  reorderNotes(draggedNoteId, note.id);
                }
                setDraggedNoteId(null);
              }}
              className={`${colorClasses[note.color]} ${
                noteRotations[index % noteRotations.length]
              } relative min-h-32 cursor-grab rounded-2xl p-4 shadow-md transition duration-150 active:cursor-grabbing ${
                draggedNoteId === note.id ? "scale-105 opacity-80" : ""
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="h-3 w-3 rounded-full bg-black/20" />
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="text-xs font-medium uppercase tracking-wide text-black/60"
                >
                  Delete
                </button>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6">
                {note.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
