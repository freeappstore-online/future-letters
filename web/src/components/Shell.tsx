import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
  nav?: { id: string; label: string; icon: string; active?: boolean; onClick: () => void; badge?: number }[];
}

export function Shell({ children, nav = [] }: ShellProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex h-screen">
        <aside
          className="flex flex-col border-r h-full shrink-0"
          style={{ width: "17rem", borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <div className="p-6 font-bold text-lg flex items-center gap-2" style={{ fontFamily: "Fraunces, serif" }}>
            <span>✉️</span> Future Letters
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderRadius: "0.75rem",
                  background: item.active ? "var(--accent)" : "transparent",
                  color: item.active ? "#fff" : "var(--ink)",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge ? (
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5"
                    style={{
                      borderRadius: "9999px",
                      background: item.active ? "rgba(255,255,255,0.2)" : "var(--line)",
                      color: item.active ? "#fff" : "var(--muted)",
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="p-4 text-xs" style={{ color: "var(--muted)" }}>
            <a
              href="https://freeappstore.online"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--muted)" }}
            >
              Part of FreeAppStore — free forever
            </a>
          </div>
        </aside>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>

      {/* Mobile */}
      <div className="flex flex-col h-screen md:hidden">
        <header
          className="flex items-center px-4 h-14 border-b shrink-0"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span className="font-bold flex items-center gap-2" style={{ fontFamily: "Fraunces, serif" }}>
            <span>✉️</span> Future Letters
          </span>
        </header>
        <main className="flex-1 overflow-auto p-4">{children}</main>
        <nav
          className="flex items-center justify-around h-16 border-t shrink-0"
          style={{ borderColor: "var(--line)", background: "var(--dock)" }}
        >
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex flex-col items-center gap-0.5 text-xs font-medium relative"
              style={{ color: item.active ? "var(--accent)" : "var(--muted)" }}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? (
                <span
                  className="absolute -top-1 -right-2 text-[10px] font-bold px-1.5 py-0.5 text-white"
                  style={{ borderRadius: "9999px", background: "var(--error)" }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
