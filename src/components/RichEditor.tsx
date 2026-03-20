import { useEditor, EditorContent } from "@tiptap/react";
import { memo } from "react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3,
  List, ListOrdered,
  Quote, Code, Minus,
  Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface RichEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function RichEditor({
  value = "",
  onChange,
  placeholder = "내용을 입력하세요",
  disabled = false,
  className,
}: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { languageClassPrefix: "language-" } }),
      Underline,
      ImageExt.configure({ allowBase64: false, inline: false }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      handlePaste(_, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imgItem = items.find((it) => ALLOWED_IMAGE_TYPES.includes(it.type));
        if (!imgItem) return false;

        event.preventDefault();
        const file = imgItem.getAsFile();
        if (!file) return true;

        uploadImage(file);
        return true;
      },
      handleDrop(_, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          ALLOWED_IMAGE_TYPES.includes(f.type)
        );
        if (!files.length) return false;
        event.preventDefault();
        files.forEach(uploadImage);
        return true;
      },
      attributes: {
        class: "prose prose-sm max-w-none min-h-[220px] px-4 py-3 outline-none bg-transparent",
      },
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [disabled, editor]);

  async function uploadImage(file: File) {
    if (uploadingRef.current || !editor) return;
    uploadingRef.current = true;
    try {
      const result = await api.fileUploadInlineImage(file);
      editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
    } catch (e) {
      console.error("이미지 업로드 실패", e);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      uploadingRef.current = false;
    }
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("링크 URL 입력", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  if (!editor) return null;

  return (
    <div className={cn("rounded-md border border-base bg-surface overflow-hidden", disabled && "opacity-60 cursor-not-allowed", className)}>
      {/* Toolbar */}
      {!disabled && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-base bg-muted px-2 py-1.5">
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")} title="굵게"
          ><Bold className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")} title="기울임"
          ><Italic className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")} title="밑줄"
          ><UnderlineIcon className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")} title="취소선"
          ><Strikethrough className="h-3.5 w-3.5" /></ToolbarBtn>

          <Divider />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })} title="제목2"
          ><Heading2 className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })} title="제목3"
          ><Heading3 className="h-3.5 w-3.5" /></ToolbarBtn>

          <Divider />

          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")} title="목록"
          ><List className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")} title="번호 목록"
          ><ListOrdered className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")} title="인용"
          ><Quote className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")} title="인라인 코드"
          ><Code className="h-3.5 w-3.5" /></ToolbarBtn>

          <Divider />

          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })} title="왼쪽 정렬"
          ><AlignLeft className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })} title="가운데 정렬"
          ><AlignCenter className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })} title="오른쪽 정렬"
          ><AlignRight className="h-3.5 w-3.5" /></ToolbarBtn>

          <Divider />

          <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="링크">
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => fileInputRef.current?.click()} title="이미지 삽입"
          ><ImageIcon className="h-3.5 w-3.5" /></ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선"
          ><Minus className="h-3.5 w-3.5" /></ToolbarBtn>
        </div>
      )}

      {/* 이미지 파일 선택 input (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach(uploadImage);
          e.target.value = "";
        }}
      />

      {/* Editor body */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  children, onClick, active = false, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded text-sm transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-fg hover:bg-accent hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />;
}

// value 변경으로 인한 리렌더를 막는다.
// TipTap은 내부 상태로 컨텐츠를 관리하므로 부모의 value 재전달이 불필요하며,
// 리렌더 시 TipTap이 editorProps를 재적용해 NodeView(이미지 등)가 재생성된다.
export default memo(RichEditor, (prev, next) =>
  prev.disabled === next.disabled &&
  prev.placeholder === next.placeholder &&
  prev.className === next.className &&
  prev.onChange === next.onChange
);
