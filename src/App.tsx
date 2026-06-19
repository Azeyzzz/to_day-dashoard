function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning Zaeya";
  if (hour < 18) return "Good afternoon Zaeya";
  return "Good evening Zaeya";
}

function getToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function App() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="px-8 pt-10 pb-6">
        <p className="font-sans text-sm font-medium tracking-wide text-accent-2 uppercase">
          {getToday()}
        </p>
        <h1 className="font-serif text-4xl text-ink mt-1">
          {getGreeting()}. Let's see what today holds.
        </h1>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-accent via-card-border to-transparent" />
      </header>

      <main className="grid grid-cols-12 grid-rows-6 gap-5 px-8 pb-8 h-[calc(100vh-148px)]">
        <Card title="Calendar" className="col-span-12 lg:col-span-5 row-span-3">
          Calendar
        </Card>
        <Card title="To-do" className="col-span-12 lg:col-span-7 row-span-3">
          Todo List
        </Card>
        <Card title="Habits" className="col-span-12 lg:col-span-5 row-span-3">
          Habit Tracker
        </Card>
        <Card title="Notes" className="col-span-12 lg:col-span-7 row-span-3">
          Notes
        </Card>
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
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-card border border-card-border rounded-2xl p-6 shadow-sm overflow-auto ${className}`}
    >
      <h2 className="font-serif text-lg text-ink mb-4">{title}</h2>
      <div className="font-sans text-sm text-muted h-[calc(100%-2rem)]">
        {children}
      </div>
    </section>
  );
}

export default App;
