"use client";

import { useEffect, useRef, useState } from "react";
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  SquareCheckBig, Quote, Code2, Minus, Trash2, Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

type BlockType = "text" | "h1" | "h2" | "h3" | "bullet" | "numbered" | "todo" | "quote" | "code" | "divider";

type Block = {
  id: string;
  type: BlockType;
  text: string;
  checked?: boolean;
};

const MENU: { type: BlockType; label: string; hint: string; icon: React.ReactNode }[] = [
  { type: "text", label: "Texto", hint: "Texto plano", icon: <Type className="w-4 h-4" /> },
  { type: "h1", label: "Título 1", hint: "# ", icon: <Heading1 className="w-4 h-4" /> },
  { type: "h2", label: "Título 2", hint: "## ", icon: <Heading2 className="w-4 h-4" /> },
  { type: "h3", label: "Título 3", hint: "### ", icon: <Heading3 className="w-4 h-4" /> },
  { type: "bullet", label: "Lista", hint: "- ", icon: <List className="w-4 h-4" /> },
  { type: "numbered", label: "Lista numerada", hint: "1. ", icon: <ListOrdered className="w-4 h-4" /> },
  { type: "todo", label: "Tarea", hint: "[] ", icon: <SquareCheckBig className="w-4 h-4" /> },
  { type: "quote", label: "Cita", hint: "> ", icon: <Quote className="w-4 h-4" /> },
  { type: "code", label: "Código", hint: "```", icon: <Code2 className="w-4 h-4" /> },
  { type: "divider", label: "Divisor", hint: "---", icon: <Minus className="w-4 h-4" /> },
];

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const emptyBlock = (): Block => ({ id: uid(), type: "text", text: "" });

function projectStorageKey(projectId: string) {
  return `qbo-project-notes-${projectId}`;
}

function contactStorageKey(contactId: string) {
  return `qbo-contact-notes-${contactId}`;
}

function applyMarkdownShortcut(block: Block): Block | null {
  const t = block.text;
  const rules: [RegExp, BlockType][] = [
    [/^###\s/, "h3"],
    [/^##\s/, "h2"],
    [/^#\s/, "h1"],
    [/^-\s|^\*\s/, "bullet"],
    [/^1\.\s/, "numbered"],
    [/^\[\]\s|^\[\s\]\s/, "todo"],
    [/^>\s/, "quote"],
    [/^```/, "code"],
    [/^---$/, "divider"],
  ];
  for (const [re, type] of rules) {
    if (re.test(t)) {
      return { ...block, type, text: t.replace(re, "") };
    }
  }
  return null;
}

export function NotesBoard({
  storageKey,
  title = "Notas",
  subtitle = "Escribe",
}: {
  storageKey: string;
  title?: string;
  subtitle?: string;
}) {
  const [blocks, setBlocks] = useState<Block[]>([emptyBlock()]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [slashOpen, setSlashOpen] = useState<string | null>(null);
  const [slashFilter, setSlashFilter] = useState("");
  const [savedAt, setSavedAt] = useState<string>("");
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  // Load per storageKey
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Block[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBlocks(parsed);
          return;
        }
      }
    } catch { /* ignore */ }
    setBlocks([emptyBlock()]);
    setActiveId(null);
    setSlashOpen(null);
  }, [storageKey]);

  // Persist local only
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(blocks));
      const empty = blocks.length === 1 && blocks[0].text === "" && blocks[0].type === "text";
      setSavedAt(empty ? "" : `Guardado local ${new Date().toLocaleTimeString()}`);
    } catch { /* ignore */ }
  }, [blocks, storageKey]);

  useEffect(() => {
    if (activeId) inputRefs.current[activeId]?.focus();
  }, [activeId]);

  const focusBlock = (id: string) => setActiveId(id);

  const updateText = (id: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const next: Block = { ...b, text: value };
        const converted = applyMarkdownShortcut(next);
        if (converted) {
          setSlashOpen(null);
          return converted;
        }
        // slash menu
        if (value.startsWith("/") && !value.includes(" ")) {
          setSlashOpen(id);
          setSlashFilter(value.slice(1).toLowerCase());
        } else {
          if (slashOpen === id) setSlashOpen(null);
        }
        return next;
      })
    );
  };

  const setType = (id: string, type: BlockType) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const clean = b.text.startsWith("/") ? "" : b.text;
        return { ...b, type, text: type === "divider" ? "" : clean };
      })
    );
    setSlashOpen(null);
    setSlashFilter("");
    focusBlock(id);
  };

  const addBlockAfter = (id: string) => {
    const nb = emptyBlock();
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const next = [...prev];
      next.splice(i + 1, 0, nb);
      return next;
    });
    setSlashOpen(null);
    focusBlock(nb.id);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => {
      if (prev.length === 1) return [{ ...prev[0], text: "", type: "text" as BlockType }];
      const i = prev.findIndex((b) => b.id === id);
      const next = prev.filter((b) => b.id !== id);
      const target = next[Math.max(0, i - 1)];
      if (target) setActiveId(target.id);
      return next;
    });
    if (slashOpen === id) setSlashOpen(null);
  };

  const moveFocus = (id: string, dir: 1 | -1) => {
    const i = blocks.findIndex((b) => b.id === id);
    const target = blocks[i + dir];
    if (target) focusBlock(target.id);
  };

  const filtered = MENU.filter(
    (m) => !slashFilter || m.label.toLowerCase().includes(slashFilter) || m.type.includes(slashFilter)
  );

  const numberedCounters = (() => {
    let n = 0;
    const map: Record<string, number> = {};
    for (const b of blocks) {
      if (b.type === "numbered") {
        n += 1;
        map[b.id] = n;
      } else if (b.text !== "" || b.type !== "text") {
        // keep numbering continuous only across consecutive numbered blocks
        n = 0;
      }
    }
    return map;
  })();

  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs text-muted-foreground">
          {title} · escribe <kbd className="px-1 py-0.5 rounded bg-secondary border border-border text-[11px] font-mono">/</kbd> para comandos · {subtitle}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {savedAt && <span className="text-[11px] text-muted-foreground">{savedAt}</span>}
          <button
            onClick={() => { setBlocks([emptyBlock()]); setSlashOpen(null); }}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Borrar pizarra"
          >
            <Eraser className="w-3.5 h-3.5" /> Limpiar
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-0.5 min-h-[420px]">
        {blocks.map((b) => (
          <div key={b.id} className="relative group flex items-start gap-2 px-1 py-0.5">
            {/* glyph per type */}
            {b.type === "bullet" && <span className="mt-2.5 ml-2 w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />}
            {b.type === "numbered" && (
              <span className="mt-1.5 ml-1 min-w-6 text-right text-sm text-muted-foreground shrink-0">{numberedCounters[b.id] ?? 1}.</span>
            )}
            {b.type === "todo" && (
              <button
                onClick={() => setBlocks((prev) => prev.map((x) => (x.id === b.id ? { ...x, checked: !x.checked } : x)))}
                className={cn(
                  "mt-1.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                  b.checked ? "bg-accent border-accent text-white" : "border-border hover:border-accent"
                )}
                title="Marcar tarea"
              >
                {b.checked && <SquareCheckBig className="w-3 h-3" />}
              </button>
            )}
            {b.type === "quote" && <span className="w-1 self-stretch rounded-full bg-accent/60 shrink-0 my-1" />}
            {b.type === "divider" ? (
              <div className="flex-1 flex items-center gap-2 py-2">
                <hr className="flex-1 border-border" />
                <button
                  onClick={() => removeBlock(b.id)}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex-1">
                {b.type === "code" ? (
                  <textarea
                    ref={(el) => { inputRefs.current[b.id] = el; }}
                    value={b.text}
                    rows={Math.max(1, b.text.split("\n").length)}
                    onChange={(e) => updateText(b.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addBlockAfter(b.id);
                      } else if (e.key === "Backspace" && b.text === "") {
                        e.preventDefault();
                        removeBlock(b.id);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        moveFocus(b.id, -1);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        moveFocus(b.id, 1);
                      } else if (e.key === "Escape") {
                        setSlashOpen(null);
                      }
                    }}
                    onFocus={() => setActiveId(b.id)}
                    placeholder="Código…"
                    className="w-full resize-none bg-transparent px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                ) : (
                  <input
                    ref={(el) => { inputRefs.current[b.id] = el; }}
                    value={b.text}
                    onChange={(e) => updateText(b.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (slashOpen === b.id && filtered.length > 0) {
                          setType(b.id, filtered[0].type);
                        } else {
                          addBlockAfter(b.id);
                        }
                      } else if (e.key === "Backspace" && b.text === "") {
                        e.preventDefault();
                        removeBlock(b.id);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        moveFocus(b.id, -1);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        moveFocus(b.id, 1);
                      } else if (e.key === "Escape") {
                        setSlashOpen(null);
                      }
                    }}
                    onFocus={() => setActiveId(b.id)}
                    placeholder={
                      b.type === "text" ? "Escribe algo, o '/' para comandos…" :
                      b.type.startsWith("h") ? `Título ${b.type.slice(1)}` :
                      b.type === "bullet" ? "Elemento de lista" :
                      b.type === "numbered" ? "Elemento numerado" :
                      b.type === "todo" ? "Tarea pendiente" :
                      b.type === "quote" ? "Cita…" : "Escribe…"
                    }
                    className={cn(
                      "w-full bg-transparent px-2 py-1.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none",
                      b.type === "h1" && "text-2xl font-bold",
                      b.type === "h2" && "text-xl font-bold",
                      b.type === "h3" && "text-lg font-semibold",
                      b.type === "text" && "text-sm",
                      b.type === "bullet" && "text-sm",
                      b.type === "numbered" && "text-sm",
                      b.type === "quote" && "text-sm italic text-muted-foreground",
                      b.type === "todo" && b.checked && "line-through text-muted-foreground"
                    )}
                  />
                )}

                {/* slash menu */}
                {slashOpen === b.id && (
                  <div className="absolute left-2 top-full z-30 mt-1 w-64 rounded-xl border border-border bg-card shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
                    <p className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Bloques</p>
                    {filtered.length === 0 && (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Sin coincidencias</p>
                    )}
                    {filtered.map((m) => (
                      <button
                        key={m.type}
                        onMouseDown={(e) => { e.preventDefault(); setType(b.id, m.type); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
                      >
                        <span className="text-muted-foreground">{m.icon}</span>
                        <span className="text-foreground">{m.label}</span>
                        <span className="ml-auto text-[11px] font-mono text-muted-foreground">{m.hint}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {b.type !== "divider" && (
              <button
                onClick={() => removeBlock(b.id)}
                className="mt-1.5 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
                title="Eliminar bloque"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}

export function ProjectNotesBoard({ projectId }: { projectId: string }) {
  return (
    <NotesBoard
      storageKey={projectStorageKey(projectId)}
      title="Notas del proyecto"
      subtitle="se guarda en este navegador"
    />
  );
}

export function ContactNotesBoard({ contactId }: { contactId: string }) {
  return (
    <NotesBoard
      storageKey={contactStorageKey(contactId)}
      title="Notas del contacto"
      subtitle="se guarda en este navegador"
    />
  );
}
