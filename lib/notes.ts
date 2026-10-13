// Notas automáticas: añade un bloque de texto al board del proyecto.
// El board guarda bloques en localStorage (qbo-project-notes-<id>).
export function appendProjectNote(projectId: string, text: string) {
  try {
    const key = `qbo-project-notes-${projectId}`;
    const raw = localStorage.getItem(key);
    const blocks = raw ? (JSON.parse(raw) as { id: string; type: string; text: string }[]) : [];
    blocks.push({ id: `${Date.now().toString(36)}-auto`, type: "text", text });
    localStorage.setItem(key, JSON.stringify(blocks));
  } catch {}
}
