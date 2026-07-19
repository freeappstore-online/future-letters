import { useState, useEffect, useCallback, useRef } from "react";
import { Shell } from "./components/Shell";
import { LetterEditor } from "./components/LetterEditor";
import { LetterViewer } from "./components/LetterViewer";
import type { Letter } from "./components/LetterEditor";

const STORAGE_KEY = "future_letters_data";

type Page = "home" | "write" | "sealed" | "opened";

// ── helpers ──────────────────────────────────────────────────────────────────

function loadLetters(): Letter[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed: Letter[] = data ? JSON.parse(data) : [];
    // back-compat: letters saved before deliveryTime existed
    return parsed.map((l) => ({ deliveryTime: "09:00", notificationScheduled: false, ...l }));
  } catch {
    return [];
  }
}

function saveLetters(letters: Letter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
}

/** Full delivery datetime as a Date object */
function deliveryDateTime(letter: Letter): Date {
  return new Date(`${letter.deliveryDate}T${letter.deliveryTime ?? "09:00"}`);
}

function isDelivered(letter: Letter): boolean {
  return deliveryDateTime(letter).getTime() <= Date.now();
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateTime(letter: Letter) {
  return deliveryDateTime(letter).toLocaleString("en-US", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeUntilLabel(letter: Letter): string {
  const diff = deliveryDateTime(letter).getTime() - Date.now();
  if (diff <= 0) return "now";
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days >= 1)  return `${days} day${days !== 1 ? "s" : ""}`;
  if (hours >= 1) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${mins} min${mins !== 1 ? "s" : ""}`;
}

function daysUntil(letter: Letter): number {
  const diff = deliveryDateTime(letter).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

// ── notification scheduling ───────────────────────────────────────────────────

/**
 * Schedule a single browser notification for a letter.
 * Uses setTimeout internally; the timeout id is stored in a ref map
 * so we can cancel it if the user deletes the letter.
 * NOTE: setTimeout only fires while the tab is open — this is a
 * best-effort reminder, not a push notification.
 */
function scheduleNotification(
  letter: Letter,
  timeoutMap: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>
) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // Cancel any existing timer for this letter
  const existing = timeoutMap.current.get(letter.id);
  if (existing !== undefined) clearTimeout(existing);

  const delay = deliveryDateTime(letter).getTime() - Date.now();
  if (delay <= 0) return; // already past

  const tid = setTimeout(() => {
    const writtenOn = formatDate(letter.createdAt);
    new Notification("✉️ A letter from your past self!", {
      body: `"${letter.title}" — written on ${writtenOn} is ready to open!`,
      icon: "/manifest.json", // fallback icon
      tag: `future-letter-${letter.id}`,
    });
    timeoutMap.current.delete(letter.id);
  }, delay);

  timeoutMap.current.set(letter.id, tid);
}

function cancelNotification(
  letterId: string,
  timeoutMap: React.MutableRefObject<Map<string, ReturnType<typeof setTimeout>>>
) {
  const tid = timeoutMap.current.get(letterId);
  if (tid !== undefined) {
    clearTimeout(tid);
    timeoutMap.current.delete(letterId);
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [letters, setLetters]           = useState<Letter[]>(loadLetters);
  const [page, setPage]                 = useState<Page>("home");
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);
  const notifTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // persist
  useEffect(() => { saveLetters(letters); }, [letters]);

  // (re-)schedule notifications for all sealed letters on mount + when letters change
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    letters.forEach((l) => {
      if (!isDelivered(l) && l.notificationScheduled) {
        scheduleNotification(l, notifTimers);
      }
    });
    // cleanup timers for letters that are gone
    const ids = new Set(letters.map((l) => l.id));
    notifTimers.current.forEach((_, id) => {
      if (!ids.has(id)) cancelNotification(id, notifTimers);
    });
  }, [letters]);

  // derived lists
  const sealedLetters    = letters.filter((l) => !isDelivered(l));
  const deliveredLetters = letters.filter((l) =>  isDelivered(l) && !l.opened);
  const openedLetters    = letters.filter((l) =>  l.opened);

  // poll every minute so delivered letters surface automatically
  useEffect(() => {
    const id = setInterval(() => setLetters((prev) => [...prev]), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleSaveLetter = useCallback((letter: Letter) => {
    setLetters((prev) => [letter, ...prev]);
    // schedule notification if permission already granted
    if (letter.notificationScheduled) {
      scheduleNotification(letter, notifTimers);
    }
    setPage("sealed");
  }, []);

  const handleOpenLetter = useCallback((letter: Letter) => {
    cancelNotification(letter.id, notifTimers);
    setLetters((prev) =>
      prev.map((l) => (l.id === letter.id ? { ...l, opened: true } : l))
    );
    setViewingLetter({ ...letter, opened: true });
  }, []);

  const handleDeleteLetter = useCallback((id: string) => {
    cancelNotification(id, notifTimers);
    setLetters((prev) => prev.filter((l) => l.id !== id));
    setViewingLetter(null);
    setPage("home");
  }, []);

  const nav = [
    {
      id: "home", label: "Home", icon: "🏠",
      active: page === "home",
      onClick: () => { setPage("home"); setViewingLetter(null); },
      badge: deliveredLetters.length || undefined,
    },
    {
      id: "write", label: "Write", icon: "✍️",
      active: page === "write",
      onClick: () => { setPage("write"); setViewingLetter(null); },
    },
    {
      id: "sealed", label: "Sealed", icon: "🔒",
      active: page === "sealed",
      onClick: () => { setPage("sealed"); setViewingLetter(null); },
      badge: sealedLetters.length || undefined,
    },
    {
      id: "opened", label: "Opened", icon: "📖",
      active: page === "opened",
      onClick: () => { setPage("opened"); setViewingLetter(null); },
      badge: openedLetters.length || undefined,
    },
  ];

  return (
    <Shell nav={nav}>

      {/* ── Letter Viewer ───────────────────────────────────────────── */}
      {viewingLetter && (
        <LetterViewer
          letter={viewingLetter}
          onClose={() => setViewingLetter(null)}
          onDelete={handleDeleteLetter}
        />
      )}

      {/* ── Home ────────────────────────────────────────────────────── */}
      {!viewingLetter && page === "home" && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif" }}>
            ✉️ Future Letters
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--muted)" }}>
            Write letters to your future self. Seal them with a date &amp; time, and open them when the moment arrives.
          </p>

          {/* Delivered alert */}
          {deliveredLetters.length > 0 && (
            <div
              className="p-5 mb-6 border-2"
              style={{ borderRadius: "1.25rem", borderColor: "var(--accent)", background: "var(--panel)" }}
            >
              <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "Fraunces, serif" }}>
                🎉 {deliveredLetters.length} letter{deliveredLetters.length > 1 ? "s" : ""} ready to open!
              </h3>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                Your past self sent {deliveredLetters.length > 1 ? "these" : "this"} to you. Ready to read?
              </p>
              <div className="space-y-3">
                {deliveredLetters.map((letter) => (
                  <button
                    key={letter.id}
                    onClick={() => handleOpenLetter(letter)}
                    className="w-full text-left p-4 border transition-all hover:shadow-md flex items-center justify-between"
                    style={{ borderRadius: "1.25rem", borderColor: "var(--accent)", background: "var(--paper)" }}
                  >
                    <div>
                      <span className="font-semibold">{letter.title}</span>
                      <span className="block text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        Written {formatDate(letter.createdAt)} {letter.mood && `• ${letter.mood}`}
                      </span>
                    </div>
                    <span className="text-2xl">📬</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Sealed",  value: sealedLetters.length,    color: "var(--ink)" },
              { label: "Ready",   value: deliveredLetters.length, color: "var(--accent)" },
              { label: "Opened",  value: openedLetters.length,    color: "var(--ink)" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 text-center border"
                style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
              >
                <div className="text-2xl font-bold" style={{ fontFamily: "Fraunces, serif", color: s.color }}>
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {letters.length === 0 && (
            <div
              className="text-center p-10 border-2 border-dashed"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)" }}
            >
              <div className="text-5xl mb-4">💌</div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif" }}>
                No letters yet
              </h3>
              <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
                Write your first letter to your future self. Tell them what you're going through, ask questions, or just say hi!
              </p>
              <button
                onClick={() => setPage("write")}
                className="px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ borderRadius: "0.75rem", background: "var(--accent)" }}
              >
                ✍️ Write Your First Letter
              </button>
            </div>
          )}

          {/* Upcoming timeline */}
          {sealedLetters.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Fraunces, serif" }}>
                🔒 Upcoming Deliveries
              </h3>
              <div className="space-y-3">
                {[...sealedLetters]
                  .sort((a, b) => deliveryDateTime(a).getTime() - deliveryDateTime(b).getTime())
                  .slice(0, 5)
                  .map((letter) => (
                    <div
                      key={letter.id}
                      className="p-4 border flex items-center justify-between"
                      style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
                    >
                      <div>
                        <span className="font-semibold text-sm">{letter.title}</span>
                        <span className="block text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          🕐 {formatDateTime(letter)} {letter.mood && `• ${letter.mood}`}
                        </span>
                        {letter.notificationScheduled && (
                          <span className="text-xs" style={{ color: "var(--success)" }}>🔔 Reminder set</span>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                          {timeUntilLabel(letter)}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted)" }}>left</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {letters.length > 0 && (
            <button
              onClick={() => setPage("write")}
              className="w-full mt-6 py-4 text-base font-bold text-white transition-all hover:opacity-90"
              style={{ borderRadius: "1.25rem", background: "var(--accent)" }}
            >
              ✍️ Write a New Letter
            </button>
          )}
        </div>
      )}

      {/* ── Write ───────────────────────────────────────────────────── */}
      {!viewingLetter && page === "write" && (
        <LetterEditor
          onSave={handleSaveLetter}
          onCancel={() => setPage("home")}
        />
      )}

      {/* ── Sealed ──────────────────────────────────────────────────── */}
      {!viewingLetter && page === "sealed" && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif" }}>
            🔒 Sealed Letters
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            These letters are waiting for their delivery date &amp; time. Be patient!
          </p>

          {sealedLetters.length === 0 ? (
            <div
              className="text-center p-10 border-2 border-dashed"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)" }}
            >
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No sealed letters. Write one!</p>
              <button
                onClick={() => setPage("write")}
                className="mt-4 px-5 py-2.5 text-sm font-bold text-white"
                style={{ borderRadius: "0.75rem", background: "var(--accent)" }}
              >
                ✍️ Write a Letter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {[...sealedLetters]
                .sort((a, b) => deliveryDateTime(a).getTime() - deliveryDateTime(b).getTime())
                .map((letter) => {
                  const totalMs  = deliveryDateTime(letter).getTime() - new Date(letter.createdAt).getTime();
                  const elapsedMs = Date.now() - new Date(letter.createdAt).getTime();
                  const progress  = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
                  const days      = daysUntil(letter);

                  return (
                    <div
                      key={letter.id}
                      className="p-5 border"
                      style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{letter.title}</h4>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            Written {formatDate(letter.createdAt)} {letter.mood && `• ${letter.mood}`}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            🕐 Opens {formatDateTime(letter)}
                          </p>
                          {letter.notificationScheduled && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--success)" }}>
                              🔔 Notification scheduled
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div
                            className="text-xl font-bold"
                            style={{ fontFamily: "Fraunces, serif", color: "var(--accent)" }}
                          >
                            {days > 0 ? days : "<1"}
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            {days === 1 ? "day" : "days"} left
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="flex-1 h-2 overflow-hidden"
                          style={{ borderRadius: "9999px", background: "var(--line)" }}
                        >
                          <div
                            className="h-full transition-all"
                            style={{ borderRadius: "9999px", background: "var(--accent)", width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium shrink-0" style={{ color: "var(--muted)" }}>
                          {Math.round(progress)}%
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm("Delete this sealed letter? This cannot be undone.")) {
                            handleDeleteLetter(letter.id);
                          }
                        }}
                        className="text-xs font-medium"
                        style={{ color: "var(--error)" }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── Opened ──────────────────────────────────────────────────── */}
      {!viewingLetter && page === "opened" && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif" }}>
            📖 Opened Letters
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Letters you've already read. Revisit your past self anytime.
          </p>

          {openedLetters.length === 0 ? (
            <div
              className="text-center p-10 border-2 border-dashed"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)" }}
            >
              <div className="text-4xl mb-3">📖</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No opened letters yet. When a letter's delivery time arrives, you'll be able to open it!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...openedLetters]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((letter) => (
                  <button
                    key={letter.id}
                    onClick={() => setViewingLetter(letter)}
                    className="w-full text-left p-5 border transition-all hover:shadow-md"
                    style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{letter.title}</h4>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          Written {formatDate(letter.createdAt)} {letter.mood && `• ${letter.mood}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                          {letter.blocks.length} section{letter.blocks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span className="text-2xl">📖</span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

    </Shell>
  );
}
