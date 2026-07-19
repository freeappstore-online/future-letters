import type { Letter, RatingBlock, ChoiceBlock, YesNoBlock, ScaleBlock } from "./LetterEditor";

interface LetterViewerProps {
  letter: Letter;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateTime(letter: Letter) {
  const dt = new Date(`${letter.deliveryDate}T${letter.deliveryTime ?? "09:00"}`);
  return dt.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0)   return "today";
  if (days === 1)   return "yesterday";
  if (days < 30)    return `${days} days ago`;
  if (days < 365)   return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function LetterViewer({ letter, onClose, onDelete }: LetterViewerProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onClose}
        className="text-sm font-medium mb-4 flex items-center gap-1"
        style={{ color: "var(--muted)" }}
      >
        ← Back
      </button>

      <div
        className="border p-6 sm:p-8 mb-6"
        style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Fraunces, serif" }}>
              {letter.title}
            </h2>
            {letter.mood && <span className="text-3xl">{letter.mood}</span>}
          </div>
          <div className="space-y-1 text-xs" style={{ color: "var(--muted)" }}>
            <div>✍️ Written on {formatDate(letter.createdAt)} — {timeAgo(letter.createdAt)}</div>
            <div>🕐 Delivered on {formatDateTime(letter)}</div>
            {letter.notificationScheduled && (
              <div style={{ color: "var(--success)" }}>🔔 You had a notification reminder set</div>
            )}
          </div>
        </div>

        <div className="w-full h-px mb-6" style={{ background: "var(--line)" }} />

        {/* Blocks */}
        <div className="space-y-6">
          {letter.blocks.map((block) => (
            <div key={block.id}>

              {/* text */}
              {block.type === "text" && (
                <div className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink)" }}>
                  {block.content || (
                    <span style={{ color: "var(--muted)", fontStyle: "italic" }}>(empty section)</span>
                  )}
                </div>
              )}

              {/* rating */}
              {block.type === "rating" && (
                <div
                  className="p-4 border"
                  style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--paper)" }}
                >
                  <p className="text-sm font-semibold mb-2">
                    ⭐ {(block as RatingBlock).question || "Rating Question"}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-xl"
                        style={{ opacity: star <= (block as RatingBlock).rating ? 1 : 0.2 }}>
                        ⭐
                      </span>
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    Past you rated: {(block as RatingBlock).rating}/5
                  </p>
                </div>
              )}

              {/* choice */}
              {block.type === "choice" && (
                <div
                  className="p-4 border"
                  style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--paper)" }}
                >
                  <p className="text-sm font-semibold mb-2">
                    📋 {(block as ChoiceBlock).question || "Multiple Choice"}
                  </p>
                  <div className="space-y-2">
                    {(block as ChoiceBlock).options.map((opt, i) => {
                      const chosen = (block as ChoiceBlock).selected === opt && opt;
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 text-sm border"
                          style={{
                            borderRadius: "0.75rem",
                            borderColor: chosen ? "var(--accent)" : "var(--line)",
                            background:  chosen ? "var(--accent)" : "transparent",
                            color:       chosen ? "#fff"          : "var(--ink)",
                          }}
                        >
                          {chosen ? "●" : "○"} {opt || "(empty)"}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                    Past you chose: "{(block as ChoiceBlock).selected || "nothing"}"
                  </p>
                </div>
              )}

              {/* yesno */}
              {block.type === "yesno" && (
                <div
                  className="p-4 border"
                  style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--paper)" }}
                >
                  <p className="text-sm font-semibold mb-2">
                    ✅ {(block as YesNoBlock).question || "Yes/No Question"}
                  </p>
                  <div className="flex gap-3">
                    {(["yes", "no"] as const).map((ans) => (
                      <div
                        key={ans}
                        className="flex-1 py-2 text-center text-sm font-semibold border"
                        style={{
                          borderRadius: "0.75rem",
                          borderColor: (block as YesNoBlock).answer === ans ? "var(--accent)" : "var(--line)",
                          background:  (block as YesNoBlock).answer === ans ? "var(--accent)" : "transparent",
                          color:       (block as YesNoBlock).answer === ans ? "#fff"          : "var(--muted)",
                        }}
                      >
                        {ans === "yes" ? "👍 Yes" : "👎 No"}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                    Past you answered: {(block as YesNoBlock).answer || "didn't answer"}
                  </p>
                </div>
              )}

              {/* scale */}
              {block.type === "scale" && (
                <div
                  className="p-4 border"
                  style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--paper)" }}
                >
                  <p className="text-sm font-semibold mb-2">
                    📊 {(block as ScaleBlock).question || "Scale Question"}
                  </p>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {(block as ScaleBlock).labelLow}
                    </span>
                    <div className="flex-1 h-3 relative" style={{ borderRadius: "9999px", background: "var(--line)" }}>
                      <div
                        className="h-full"
                        style={{
                          borderRadius: "9999px",
                          background: "var(--accent)",
                          width: `${((block as ScaleBlock).value / 10) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {(block as ScaleBlock).labelHigh}
                    </span>
                  </div>
                  <p className="text-center text-sm font-bold" style={{ color: "var(--accent)" }}>
                    {(block as ScaleBlock).value}/10
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

      {/* Delete */}
      <div className="text-center">
        <button
          onClick={() => {
            if (confirm("Delete this letter permanently?")) onDelete(letter.id);
          }}
          className="text-xs font-medium px-4 py-2"
          style={{ color: "var(--error)" }}
        >
          🗑️ Delete this letter
        </button>
      </div>
    </div>
  );
}
