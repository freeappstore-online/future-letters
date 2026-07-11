import { useState } from "react";

// Survey-style block types
export type BlockType = "text" | "rating" | "choice" | "yesno" | "scale";

export interface TextBlock {
  type: "text";
  id: string;
  content: string;
}

export interface RatingBlock {
  type: "rating";
  id: string;
  question: string;
  rating: number; // 1-5
}

export interface ChoiceBlock {
  type: "choice";
  id: string;
  question: string;
  options: string[];
  selected: string;
}

export interface YesNoBlock {
  type: "yesno";
  id: string;
  question: string;
  answer: "yes" | "no" | "";
}

export interface ScaleBlock {
  type: "scale";
  id: string;
  question: string;
  value: number; // 1-10
  labelLow: string;
  labelHigh: string;
}

export type Block = TextBlock | RatingBlock | ChoiceBlock | YesNoBlock | ScaleBlock;

export interface Letter {
  id: string;
  title: string;
  blocks: Block[];
  deliveryDate: string; // ISO date string
  createdAt: string;
  opened: boolean;
  mood: string;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const MOOD_OPTIONS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "🥰", label: "Grateful" },
  { emoji: "😎", label: "Confident" },
  { emoji: "🤔", label: "Thoughtful" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🔥", label: "Motivated" },
];

const BLOCK_TYPES: { type: BlockType; icon: string; label: string }[] = [
  { type: "text", icon: "📝", label: "Write" },
  { type: "rating", icon: "⭐", label: "Rating" },
  { type: "choice", icon: "📋", label: "Choice" },
  { type: "yesno", icon: "✅", label: "Yes/No" },
  { type: "scale", icon: "📊", label: "Scale" },
];

interface LetterEditorProps {
  onSave: (letter: Letter) => void;
  onCancel: () => void;
}

export function LetterEditor({ onSave, onCancel }: LetterEditorProps) {
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([
    { type: "text", id: generateId(), content: "" },
  ]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [mood, setMood] = useState("");
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const addBlock = (type: BlockType) => {
    const id = generateId();
    let block: Block;
    switch (type) {
      case "text":
        block = { type: "text", id, content: "" };
        break;
      case "rating":
        block = { type: "rating", id, question: "", rating: 0 };
        break;
      case "choice":
        block = { type: "choice", id, question: "", options: ["", ""], selected: "" };
        break;
      case "yesno":
        block = { type: "yesno", id, question: "", answer: "" };
        break;
      case "scale":
        block = {
          type: "scale",
          id,
          question: "",
          value: 5,
          labelLow: "Not at all",
          labelHigh: "Absolutely",
        };
        break;
    }
    setBlocks([...blocks, block]);
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } as Block : b)));
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) return;
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleSave = () => {
    if (!title.trim() || !deliveryDate) return;
    const letter: Letter = {
      id: generateId(),
      title: title.trim(),
      blocks,
      deliveryDate,
      createdAt: new Date().toISOString(),
      opened: false,
      mood,
    };
    onSave(letter);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const isValid = title.trim() && deliveryDate;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "Fraunces, serif" }}
        >
          ✍️ Write a Letter
        </h2>
        <button
          onClick={onCancel}
          className="text-sm font-medium px-4 py-2 transition-colors"
          style={{ color: "var(--muted)", borderRadius: "0.75rem" }}
        >
          Cancel
        </button>
      </div>

      {/* Title */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
          Letter Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dear Future Me..."
          className="w-full px-4 py-3 text-base font-medium border outline-none transition-colors"
          style={{
            borderRadius: "1.25rem",
            borderColor: "var(--line)",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        />
      </div>

      {/* Delivery Date */}
      <div className="mb-5">
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
          📅 Delivery Date — When should future you read this?
        </label>
        <input
          type="date"
          value={deliveryDate}
          min={minDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full px-4 py-3 text-base border outline-none transition-colors"
          style={{
            borderRadius: "1.25rem",
            borderColor: "var(--line)",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        />
      </div>

      {/* Mood */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2" style={{ color: "var(--muted)" }}>
          How are you feeling right now?
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(mood === m.emoji ? "" : m.emoji)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-all"
              style={{
                borderRadius: "9999px",
                borderColor: mood === m.emoji ? "var(--accent)" : "var(--line)",
                background: mood === m.emoji ? "var(--accent)" : "var(--paper)",
                color: mood === m.emoji ? "#fff" : "var(--ink)",
              }}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-4 mb-6">
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="border p-4 relative"
            style={{ borderRadius: "1.25rem", borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {block.type === "text" && "📝 Write"}
                {block.type === "rating" && "⭐ Rating Question"}
                {block.type === "choice" && "📋 Multiple Choice"}
                {block.type === "yesno" && "✅ Yes / No"}
                {block.type === "scale" && "📊 Scale"}
              </span>
              {blocks.length > 1 && (
                <button
                  onClick={() => removeBlock(block.id)}
                  className="text-xs px-2 py-1 font-medium"
                  style={{ color: "var(--error)", borderRadius: "0.5rem" }}
                >
                  Remove
                </button>
              )}
            </div>

            {block.type === "text" && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Write to your future self... What do you want to remember? What are you going through? What advice do you have?"
                rows={5}
                className="w-full px-4 py-3 text-sm border outline-none resize-none"
                style={{
                  borderRadius: "0.75rem",
                  borderColor: "var(--line)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                }}
              />
            )}

            {block.type === "rating" && (
              <div>
                <input
                  type="text"
                  value={block.question}
                  onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                  placeholder="Ask your future self a rating question... e.g. 'How happy are you?'"
                  className="w-full px-4 py-2.5 text-sm border outline-none mb-3"
                  style={{
                    borderRadius: "0.75rem",
                    borderColor: "var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => updateBlock(block.id, { rating: star })}
                      className="text-2xl transition-transform hover:scale-110"
                      style={{ opacity: star <= (block as RatingBlock).rating ? 1 : 0.3 }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                  Rate how you feel <em>now</em> — future you will see this!
                </p>
              </div>
            )}

            {block.type === "choice" && (
              <div>
                <input
                  type="text"
                  value={block.question}
                  onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                  placeholder="Ask a question... e.g. 'What matters most to you right now?'"
                  className="w-full px-4 py-2.5 text-sm border outline-none mb-3"
                  style={{
                    borderRadius: "0.75rem",
                    borderColor: "var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                />
                <div className="space-y-2 mb-3">
                  {(block as ChoiceBlock).options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <button
                        onClick={() => updateBlock(block.id, { selected: opt })}
                        className="w-5 h-5 border-2 shrink-0 flex items-center justify-center"
                        style={{
                          borderRadius: "9999px",
                          borderColor: (block as ChoiceBlock).selected === opt && opt ? "var(--accent)" : "var(--line)",
                          background: (block as ChoiceBlock).selected === opt && opt ? "var(--accent)" : "transparent",
                        }}
                      >
                        {(block as ChoiceBlock).selected === opt && opt && (
                          <div className="w-2 h-2 bg-white" style={{ borderRadius: "9999px" }} />
                        )}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...(block as ChoiceBlock).options];
                          newOptions[optIdx] = e.target.value;
                          updateBlock(block.id, { options: newOptions });
                        }}
                        placeholder={`Option ${optIdx + 1}`}
                        className="flex-1 px-3 py-2 text-sm border outline-none"
                        style={{
                          borderRadius: "0.75rem",
                          borderColor: "var(--line)",
                          background: "var(--paper)",
                          color: "var(--ink)",
                        }}
                      />
                      {(block as ChoiceBlock).options.length > 2 && (
                        <button
                          onClick={() => {
                            const newOptions = (block as ChoiceBlock).options.filter((_, i) => i !== optIdx);
                            updateBlock(block.id, { options: newOptions });
                          }}
                          className="text-xs"
                          style={{ color: "var(--error)" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newOptions = [...(block as ChoiceBlock).options, ""];
                    updateBlock(block.id, { options: newOptions });
                  }}
                  className="text-xs font-medium px-3 py-1.5"
                  style={{ color: "var(--accent)" }}
                >
                  + Add option
                </button>
              </div>
            )}

            {block.type === "yesno" && (
              <div>
                <input
                  type="text"
                  value={block.question}
                  onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                  placeholder="Ask a yes/no question... e.g. 'Are you still at the same job?'"
                  className="w-full px-4 py-2.5 text-sm border outline-none mb-3"
                  style={{
                    borderRadius: "0.75rem",
                    borderColor: "var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                />
                <div className="flex gap-3">
                  {(["yes", "no"] as const).map((ans) => (
                    <button
                      key={ans}
                      onClick={() => updateBlock(block.id, { answer: ans })}
                      className="flex-1 py-2.5 text-sm font-semibold border transition-all"
                      style={{
                        borderRadius: "0.75rem",
                        borderColor: (block as YesNoBlock).answer === ans ? "var(--accent)" : "var(--line)",
                        background: (block as YesNoBlock).answer === ans ? "var(--accent)" : "var(--paper)",
                        color: (block as YesNoBlock).answer === ans ? "#fff" : "var(--ink)",
                      }}
                    >
                      {ans === "yes" ? "👍 Yes" : "👎 No"}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                  Answer for your current self — future you will see what you chose!
                </p>
              </div>
            )}

            {block.type === "scale" && (
              <div>
                <input
                  type="text"
                  value={block.question}
                  onChange={(e) => updateBlock(block.id, { question: e.target.value })}
                  placeholder="Ask a scale question... e.g. 'How confident are you about the future?'"
                  className="w-full px-4 py-2.5 text-sm border outline-none mb-3"
                  style={{
                    borderRadius: "0.75rem",
                    borderColor: "var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                  }}
                />
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="text"
                    value={(block as ScaleBlock).labelLow}
                    onChange={(e) => updateBlock(block.id, { labelLow: e.target.value })}
                    className="text-xs w-24 px-2 py-1 border outline-none text-center"
                    style={{
                      borderRadius: "0.5rem",
                      borderColor: "var(--line)",
                      background: "var(--paper)",
                      color: "var(--muted)",
                    }}
                  />
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={(block as ScaleBlock).value}
                    onChange={(e) => updateBlock(block.id, { value: parseInt(e.target.value) })}
                    className="flex-1 accent-[var(--accent)]"
                  />
                  <input
                    type="text"
                    value={(block as ScaleBlock).labelHigh}
                    onChange={(e) => updateBlock(block.id, { labelHigh: e.target.value })}
                    className="text-xs w-24 px-2 py-1 border outline-none text-center"
                    style={{
                      borderRadius: "0.5rem",
                      borderColor: "var(--line)",
                      background: "var(--paper)",
                      color: "var(--muted)",
                    }}
                  />
                </div>
                <div className="text-center text-lg font-bold" style={{ color: "var(--accent)" }}>
                  {(block as ScaleBlock).value} / 10
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Block Button */}
      <div className="mb-8 relative">
        <button
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="w-full py-3 text-sm font-semibold border-2 border-dashed transition-colors"
          style={{
            borderRadius: "1.25rem",
            borderColor: "var(--line)",
            color: "var(--muted)",
            background: "transparent",
          }}
        >
          + Add a section
        </button>
        {showBlockMenu && (
          <div
            className="absolute top-full left-0 right-0 mt-2 p-2 border shadow-lg z-10 grid grid-cols-2 sm:grid-cols-5 gap-2"
            style={{
              borderRadius: "1.25rem",
              borderColor: "var(--line)",
              background: "var(--panel)",
            }}
          >
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="flex flex-col items-center gap-1 p-3 text-sm font-medium transition-colors hover:opacity-80"
                style={{ borderRadius: "0.75rem", background: "var(--paper)" }}
              >
                <span className="text-xl">{bt.icon}</span>
                <span className="text-xs">{bt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!isValid}
        className="w-full py-4 text-base font-bold transition-all"
        style={{
          borderRadius: "1.25rem",
          background: isValid ? "var(--accent)" : "var(--line)",
          color: isValid ? "#fff" : "var(--muted)",
          cursor: isValid ? "pointer" : "not-allowed",
        }}
      >
        🚀 Seal & Send to the Future
      </button>
      {!isValid && (
        <p className="text-center text-xs mt-2" style={{ color: "var(--muted)" }}>
          Add a title and pick a delivery date to continue
        </p>
      )}
    </div>
  );
}
