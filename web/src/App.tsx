import { useState, useEffect, useCallback } from "react";
import { Shell } from "./components/Shell";
import { LetterEditor } from "./components/LetterEditor";
import { LetterViewer } from "./components/LetterViewer";
import type { Letter } from "./components/LetterEditor";

const STORAGE_KEY = "future_letters_data";

type Page = "home" | "write" | "sealed" | "opened";

function loadLetters(): Letter[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLetters(letters: Letter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysUntil(dateStr: string) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isDelivered(dateStr: string) {
  return daysUntil(dateStr) <= 0;
}

export default function App() {
  const [letters, setLetters] = useState<Letter[]>(loadLetters);
  const [page, setPage] = useState<Page>("home");
  const [viewingLetter, setViewingLetter] = useState<Letter | null>(null);

  useEffect(() => {
    saveLetters(letters);
  }, [letters]);

  // Check for newly delivered letters
  useEffect(() => {
    const newlyDelivered = letters.filter(
      (l) => isDelivered(l.deliveryDate) && !l.opened
    );
    if (newlyDelivered.length > 0) {
      // Don't auto-open, but they'll show in "Ready to Open" section
    }
  }, [letters]);

  const sealedLetters = letters.filter((l) => !isDelivered(l.deliveryDate));
  const deliveredLetters = letters.filter((l) => isDelivered(l.deliveryDate) && !l.opened);
  const openedLetters = letters.filter((l) => l.opened);

  const handleSaveLetter = useCallback(
    (letter: Letter) => {
      setLetters((prev) => [letter, ...prev]);
      setPage("sealed");
    },
    []
  );

  const handleOpenLetter = useCallback(
    (letter: Letter) => {
      setLetters((prev) =>
        prev.map((l) => (l.id === letter.id ? { ...l, opened: true } : l))
      );
      setViewingLetter({ ...letter, opened: true });
    },
    []
  );

  const handleDeleteLetter = useCallback(
    (id: string) => {
      setLetters((prev) => prev.filter((l) => l.id !== id));
      setViewingLetter(null);
      setPage("home");
    },
    []
  );

  const nav = [
    {
      id: "home",
      label: "Home",
      icon: "🏠",
      active: page === "home",
      onClick: () => { setPage("home"); setViewingLetter(null); },
      badge: deliveredLetters.length || undefined,
    },
    {
      id: "write",
      label: "Write",
      icon: "✍️",
      active: page === "write",
      onClick: () => { setPage("write"); setViewingLetter(null); },
    },
    {
      id: "sealed",
      label: "Sealed",
      icon: "🔒",
      active: page === "sealed",
      onClick: () => { setPage("sealed"); setViewingLetter(null); },
      badge: sealedLetters.length || undefined,
    },
    {
      id: "opened",
      label: "Opened",
      icon: "📖",
      active: page === "opened",
      onClick: () => { setPage("opened"); setViewingLetter(null); },
      badge: openedLetters.length || undefined,
    },
  ];

  return (
    <Shell nav={nav}>
      {/* Viewing a specific letter */}
      {viewingLetter && (
        <LetterViewer
          letter={viewingLetter}
          onClose={() => setViewingLetter(null)}
          onDelete={handleDeleteLetter}
        />
      )}

      {/* Home Page */}
      {!viewingLetter && page === "home" && (
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            ✉️ Future Letters
          </h1>
          <p className="text-base mb-8" style={{ color: "var(--muted)" }}>
            Write letters to your future self. Seal them with a date, and open them when the time comes.
          </p>

          {/* Delivered Letters Alert */}
          {deliveredLetters.length > 0 && (
            <div
              className="p-5 mb-6 border-2"
              style={{
                borderRadius: "1.25rem",
                borderColor: "var(--accent)",
                background: "var(--panel)",
              }}
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
                    style={{
                      borderRadius: "1.25rem",
                      borderColor: "var(--accent)",
                      background: "var(--paper)",
                    }}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div
              className="p-4 text-center border"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <div className="text-2xl font-bold" style={{ fontFamily: "Fraunces, serif" }}>
                {sealedLetters.length}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Sealed</div>
            </div>
            <div
              className="p-4 text-center border"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <div className="text-2xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--accent)" }}>
                {deliveredLetters.length}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Ready</div>
            </div>
            <div
              className="p-4 text-center border"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
            >
              <div className="text-2xl font-bold" style={{ fontFamily: "Fraunces, serif" }}>
                {openedLetters.length}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Opened</div>
            </div>
          </div>

          {/* Empty State */}
          {letters.length === 0 && (
            <div
              className="text-center p-10 border-2 border-dashed"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)" }}
            >
              <div className="text-5xl mb-4">💌</div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "Fraunces, serif" }}
              >
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

          {/* Upcoming Letters Timeline */}
          {sealedLetters.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "Fraunces, serif" }}>
                🔒 Upcoming Deliveries
              </h3>
              <div className="space-y-3">
                {sealedLetters
                  .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
                  .slice(0, 5)
                  .map((letter) => {
                    const days = daysUntil(letter.deliveryDate);
                    return (
                      <div
                        key={letter.id}
                        className="p-4 border flex items-center justify-between"
                        style={{
                          borderRadius: "1.25rem",
                          borderColor: "var(--line)",
                          background: "var(--panel)",
                        }}
                      >
                        <div>
                          <span className="font-semibold text-sm">{letter.title}</span>
                          <span className="block text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            Opens {formatDate(letter.deliveryDate)} {letter.mood && `• ${letter.mood}`}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                            {days} day{days !== 1 ? "s" : ""}
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            remaining
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Write CTA */}
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

      {/* Write Page */}
      {!viewingLetter && page === "write" && (
        <LetterEditor
          onSave={handleSaveLetter}
          onCancel={() => setPage("home")}
        />
      )}

      {/* Sealed Letters Page */}
      {!viewingLetter && page === "sealed" && (
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            🔒 Sealed Letters
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            These letters are waiting for their delivery date. Be patient — good things take time!
          </p>

          {sealedLetters.length === 0 ? (
            <div
              className="text-center p-10 border-2 border-dashed"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)" }}
            >
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No sealed letters. Write one to get started!
              </p>
              <button
                onClick={() => setPage("write")}
                className="mt-4 px-5 py-2.5 text-sm font-bold text-white"
                style={{ borderRadius: "0.75rem", background: "var(--accent)" }}
              >
                ✍️ Write a Letter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sealedLetters
                .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
                .map((letter) => {
                  const days = daysUntil(letter.deliveryDate);
                  const totalDays = Math.ceil(
                    (new Date(letter.deliveryDate).getTime() - new Date(letter.createdAt).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const elapsed = totalDays - days;
                  const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));

                  return (
                    <div
                      key={letter.id}
                      className="p-5 border"
                      style={{
                        borderRadius: "1.25rem",
                        borderColor: "var(--line)",
                        background: "var(--panel)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{letter.title}</h4>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                            Written {formatDate(letter.createdAt)} {letter.mood && `• ${letter.mood}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-lg font-bold" style={{ color: "var(--accent)", fontFamily: "Fraunces, serif" }}>
                            {days}
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            days left
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 h-2 overflow-hidden"
                          style={{ borderRadius: "9999px", background: "var(--line)" }}
                        >
                          <div
                            className="h-full transition-all"
                            style={{
                              borderRadius: "9999px",
                              background: "var(--accent)",
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium shrink-0" style={{ color: "var(--muted)" }}>
                          {Math.round(progress)}%
                        </span>
                      </div>

                      <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                        Opens on {formatDate(letter.deliveryDate)}
                      </p>

                      {/* Delete option */}
                      <button
                        onClick={() => {
                          if (confirm("Delete this sealed letter? You can't undo this.")) {
                            handleDeleteLetter(letter.id);
                          }
                        }}
                        className="text-xs mt-2 font-medium"
                        style={{ color: "var(--error)" }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Opened Letters Page */}
      {!viewingLetter && page === "opened" && (
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            📖 Opened Letters
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
            Letters you've already opened and read. Revisit your past self anytime.
          </p>

          {openedLetters.length === 0 ? (
            <div
              className="text-center p-10 border-2 border-dashed"
              style={{ borderRadius: "1.25rem", borderColor: "var(--line)" }}
            >
              <div className="text-4xl mb-3">📖</div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No opened letters yet. When a sealed letter's date arrives, you'll be able to open it!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {openedLetters
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((letter) => (
                  <button
                    key={letter.id}
                    onClick={() => setViewingLetter(letter)}
                    className="w-full text-left p-5 border transition-all hover:shadow-md"
                    style={{
                      borderRadius: "1.25rem",
                      borderColor: "var(--line)",
                      background: "var(--panel)",
                    }}
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
