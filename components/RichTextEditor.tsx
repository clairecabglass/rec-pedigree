"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type Level = 1 | 2 | 3;

function ToolbarBtn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        background: active ? "var(--teal-muted)" : "transparent",
        border: active ? "1px solid var(--teal-light)" : "1px solid transparent",
        borderRadius: 5,
        padding: "3px 7px",
        cursor: "pointer",
        fontSize: 13,
        color: active ? "var(--teal-dark)" : "var(--text-muted)",
        fontFamily: "var(--font-lato)",
        fontWeight: 600,
        lineHeight: 1.4,
        minWidth: 28,
      }}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "rte-link" } }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "rte-content",
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. initial load)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, title: string, label: React.ReactNode) => (
    <ToolbarBtn active={active} onClick={onClick} title={title}>{label}</ToolbarBtn>
  );

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--white)" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 8px",
        borderBottom: "1px solid var(--border)", background: "var(--cream)",
      }}>
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold (Ctrl+B)", <strong>B</strong>)}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic (Ctrl+I)", <em>I</em>)}
        {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "Underline (Ctrl+U)", <span style={{ textDecoration: "underline" }}>U</span>)}
        {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), "Strikethrough", <s>S</s>)}

        <div style={{ width: 1, background: "var(--border)", margin: "2px 4px" }} />

        {([1, 2, 3] as Level[]).map((lvl) => btn(
          editor.isActive("heading", { level: lvl }),
          () => editor.chain().focus().toggleHeading({ level: lvl }).run(),
          `Heading ${lvl}`,
          `H${lvl}`
        ))}
        {btn(editor.isActive("paragraph"), () => editor.chain().focus().setParagraph().run(), "Paragraph", "¶")}

        <div style={{ width: 1, background: "var(--border)", margin: "2px 4px" }} />

        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bullet list", "• —")}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Numbered list", "1.")}
        {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Blockquote", "“”")}
        {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), "Code block", "{}")}

        <div style={{ width: 1, background: "var(--border)", margin: "2px 4px" }} />

        {btn(editor.isActive("link"), setLink, "Link", "🔗")}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), "Horizontal rule", "—")}
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      <style>{`
        .rte-content {
          min-height: 140px;
          padding: 12px 14px;
          font-family: var(--font-lato);
          font-size: 14px;
          color: var(--teal-dark);
          outline: none;
          line-height: 1.65;
        }
        .rte-content p { margin: 0 0 0.6em; }
        .rte-content p:last-child { margin-bottom: 0; }
        .rte-content h1 { font-family: var(--font-playfair); font-size: 1.5em; color: var(--teal-dark); margin: 0.8em 0 0.3em; }
        .rte-content h2 { font-family: var(--font-playfair); font-size: 1.25em; color: var(--teal-dark); margin: 0.7em 0 0.3em; }
        .rte-content h3 { font-family: var(--font-playfair); font-size: 1.1em; color: var(--teal-dark); margin: 0.6em 0 0.2em; }
        .rte-content ul, .rte-content ol { padding-left: 1.4em; margin: 0.4em 0 0.6em; }
        .rte-content li { margin: 0.15em 0; }
        .rte-content blockquote { border-left: 3px solid var(--teal-light); margin: 0.6em 0; padding: 4px 12px; color: var(--text-muted); font-style: italic; }
        .rte-content code { background: var(--cream); border: 1px solid var(--border); border-radius: 4px; padding: 1px 5px; font-size: 0.88em; }
        .rte-content pre { background: var(--cream); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; overflow-x: auto; }
        .rte-content pre code { background: none; border: none; padding: 0; }
        .rte-link { color: var(--teal); text-decoration: underline; }
        .rte-content hr { border: none; border-top: 1px solid var(--border); margin: 1em 0; }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: var(--text-muted);
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  );
}
