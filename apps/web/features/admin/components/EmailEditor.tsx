import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

type ToolbarButtonProps = {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
};

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: ToolbarButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${
      active
        ? "bg-spektr-teal text-white"
        : "text-gray-500 hover:bg-gray-100 hover:text-spektr-dark"
    }`}
  >
    {children}
  </button>
);

const EmailEditor = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-2 focus:outline-none text-[13px] leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const tools = [
    {
      icon: <Bold size={14} />,
      title: "Gras (Ctrl+B)",
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: <Italic size={14} />,
      title: "Italique (Ctrl+I)",
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      icon: <UnderlineIcon size={14} />,
      title: "Souligné (Ctrl+U)",
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
    },
    {
      icon: <Strikethrough size={14} />,
      title: "Barré",
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
    },
    { separator: true },
    {
      icon: <Heading1 size={14} />,
      title: "Titre 1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: <Heading2 size={14} />,
      title: "Titre 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: <Heading3 size={14} />,
      title: "Titre 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    { separator: true },
    {
      icon: <List size={14} />,
      title: "Liste à puces",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: <ListOrdered size={14} />,
      title: "Liste numérotée",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
  ];

  const renderTools = (subset?: typeof tools) =>
    (subset ?? tools).map((t, i) =>
      "separator" in t ? (
        <div key={i} className="w-px h-4 bg-gray-200 mx-0.5" />
      ) : (
        <ToolbarButton
          key={i}
          onClick={t.action!}
          active={t.active}
          title={t.title!}
          aria-pressed={active ?? false}
        >
          {t.icon}
        </ToolbarButton>
      ),
    );

  return (
    <div
      className={`border border-spektr-border rounded-lg overflow-hidden ${className ?? ""}`}
    >
      {/* Toolbar statique */}
      <div
        role="toolbar"
        aria-label="Mise en forme"
        className="flex items-center gap-0.5 px-2 py-1.5 border-b border-spektr-border bg-[#fafafa]"
      >
        {renderTools()}
      </div>

      {/* Zone d'édition */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default EmailEditor;
