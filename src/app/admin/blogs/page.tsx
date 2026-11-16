"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Undo,
  Redo,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Property } from "@/data/properties";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// Inline UI primitives matching Klane Frontsite design system
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Label = ({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-xs font-bold leading-none block", className)}
    {...props}
  >
    {children}
  </label>
);

const Button = ({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
  size?: "default" | "sm";
}) => (
  <button
    type="button"
    className={cn(
      "inline-flex items-center justify-center font-semibold transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
      variant === "outline"
        ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        : "bg-black text-white hover:bg-gray-800",
      size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 py-2 text-xs",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const Switch = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
      checked ? "bg-black" : "bg-gray-200"
    )}
  >
    <span
      className={cn(
        "pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out",
        checked ? "translate-x-5 bg-[#FFD02F]" : "translate-x-0 bg-white"
      )}
    />
  </button>
);

interface BlogPost {
  id: string;
  title: string;
  title_hindi: string | null;
  slug: string;
  excerpt: string | null;
  content: any;
  featured_image: string | null;
  coverImage?: string | null;
  author: string;
  author_role?: string;
  author_avatar?: string;
  status: "draft" | "published";
  tags: string | null;
  category: string | null;
  category_hindi: string | null;
  read_time: string | null;
  featured: number;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonicalUrl?: string | null;
  relatedPropertyIds?: string[];
  created_at: string;
  updated_at: string;
}

const DEFAULT_CATEGORIES = [
  "Market Trends",
  "Legal & RERA",
  "Patna Corridors",
  "Luxury Living",
  "NRI Advisory",
];

const INITIAL_FORM = {
  title: "",
  title_hindi: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  author: "Amit Vikram",
  author_role: "Managing Director, Bihar & Eastern Corridor",
  author_avatar:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  status: "published" as "draft" | "published",
  tags: "Patna Real Estate, Investment, Luxury Homes",
  category: "Market Trends",
  category_hindi: "",
  read_time: "5 min read",
  featured: 0,
  published_at: null as string | null,
  meta_title: "",
  meta_description: "",
  canonicalUrl: "",
  relatedPropertyIds: [] as string[],
};

// Convert markdown or plain text block to HTML string
function convertMarkdownBlockToHtml(block: string): string {
  const trimmed = block.trim();
  if (!trimmed) return "";

  const isHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  if (isHtml) {
    const isBlockTag = /^(<p|<h[1-6]|<ul|<ol|<blockquote|<pre|<div|<img)/i.test(
      trimmed
    );
    return isBlockTag ? trimmed : `<p>${trimmed}</p>`;
  }

  // Inline markdown formatting (bold & italic)
  const formatInline = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>");

  if (trimmed.startsWith("#### ")) {
    return `<h4>${formatInline(trimmed.replace(/^####\s+/, ""))}</h4>`;
  }
  if (trimmed.startsWith("### ")) {
    return `<h3>${formatInline(trimmed.replace(/^###\s+/, ""))}</h3>`;
  }
  if (trimmed.startsWith("## ")) {
    return `<h2>${formatInline(trimmed.replace(/^##\s+/, ""))}</h2>`;
  }
  if (trimmed.startsWith("# ")) {
    return `<h1>${formatInline(trimmed.replace(/^#\s+/, ""))}</h1>`;
  }
  if (trimmed.startsWith("> ")) {
    const quoteText = trimmed
      .split("\n")
      .map((l) => formatInline(l.replace(/^>\s*/, "")))
      .join("<br>");
    return `<blockquote>${quoteText}</blockquote>`;
  }
  if (/^[-*•]\s+/m.test(trimmed)) {
    const items = trimmed
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `<li>${formatInline(item)}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }
  if (/^\d+\.\s+/m.test(trimmed)) {
    const items = trimmed
      .split("\n")
      .map((l) => l.replace(/^\d+\.\s+/, "").trim())
      .filter(Boolean)
      .map((item) => `<li>${formatInline(item)}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  }

  return `<p>${formatInline(trimmed.replace(/\n/g, "<br>"))}</p>`;
}

// Clean pasted HTML from Word/Google Docs/web pages while preserving rich structure
function cleanPastedHtml(rawHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  // Remove script/style/meta tags
  doc
    .querySelectorAll("script, style, meta, link, title, xml")
    .forEach((el) => el.remove());

  // Clean noisy inline styles while keeping semantic tags & href/src
  doc.body.querySelectorAll("*").forEach((el) => {
    const htmlEl = el as HTMLElement;
    const tag = htmlEl.tagName.toLowerCase();

    // Convert bold/italic spans from Google Docs into semantic tags
    if (tag === "span") {
      const fw = htmlEl.style?.fontWeight;
      const fs = htmlEl.style?.fontStyle;
      if (fw === "bold" || fw === "700" || Number(fw) >= 600) {
        const strong = doc.createElement("strong");
        strong.innerHTML = htmlEl.innerHTML;
        htmlEl.replaceWith(strong);
        return;
      }
      if (fs === "italic") {
        const em = doc.createElement("em");
        em.innerHTML = htmlEl.innerHTML;
        htmlEl.replaceWith(em);
        return;
      }
    }

    htmlEl.removeAttribute("style");
    htmlEl.removeAttribute("class");
    htmlEl.removeAttribute("id");

    if (tag === "a") {
      htmlEl.setAttribute(
        "style",
        "color: #000000; text-decoration: underline; font-weight: 650;"
      );
      htmlEl.setAttribute("target", "_blank");
      htmlEl.setAttribute("rel", "noopener noreferrer");
    }
    if (tag === "img") {
      htmlEl.setAttribute(
        "style",
        "max-width: 100%; height: auto; border-radius: 14px; margin: 12px 0;"
      );
    }
  });

  return doc.body.innerHTML;
}

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);

  // Custom states for interactive formatting toolbar
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [linkInputText, setLinkInputText] = useState("");
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [activeFormatLabel, setActiveFormatLabel] = useState("Normal");
  const [uploadingInlineImg, setUploadingInlineImg] = useState(false);

  // Helper to parse DB JSON array, Markdown, or raw HTML to Editor HTML
  const getEditorHtmlFromDb = useCallback((dbContent: string) => {
    if (!dbContent || !dbContent.trim()) return "<p><br></p>";
    try {
      const parsed = JSON.parse(dbContent);
      if (Array.isArray(parsed)) {
        return (
          parsed
            .map((block) => convertMarkdownBlockToHtml(String(block)))
            .filter(Boolean)
            .join("") || "<p><br></p>"
        );
      }
    } catch (_) {
      // Not valid JSON, fallback below
    }

    // Check if raw HTML with block tags
    if (/<(p|h[1-6]|ul|ol|blockquote|pre|div|img)[\s>]/i.test(dbContent)) {
      return dbContent;
    }

    // Parse Markdown / plain text double-newline blocks
    const blocks = dbContent
      .split(/\n\s*\n/)
      .map((b) => convertMarkdownBlockToHtml(b))
      .filter(Boolean);
    return blocks.join("") || "<p><br></p>";
  }, []);

  // Helper to serialize Editor HTML back to DB JSON string (matching Klane Frontsite)
  const getDbStringFromEditorHtml = useCallback((editorHtml: string) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = editorHtml;
    const blocks: string[] = [];

    for (let i = 0; i < tempDiv.childNodes.length; i++) {
      const node = tempDiv.childNodes[i];
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        if (tagName === "p") {
          const innerHtml = el.innerHTML.trim();
          if (innerHtml && innerHtml !== "<br>") {
            blocks.push(innerHtml);
          }
        } else {
          const outerHtml = el.outerHTML.trim();
          if (outerHtml) {
            blocks.push(outerHtml);
          }
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          blocks.push(text);
        }
      }
    }
    return JSON.stringify(blocks);
  }, []);

  // Sync value from parent once on load or switch
  useEffect(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const expectedHtml = getEditorHtmlFromDb(value);
      const currentSerialized = getDbStringFromEditorHtml(currentHtml);

      if (currentSerialized !== value) {
        editorRef.current.innerHTML = expectedHtml;
      }
    }
  }, [value, getEditorHtmlFromDb, getDbStringFromEditorHtml]);

  const handleInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const dbString = getDbStringFromEditorHtml(currentHtml);
      onChange(dbString);
    }
  };

  // Handle Copy-Pasting Content (Rich HTML, Markdown/Text, or Copied Images!)
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 1. Check if user pasted an image file directly from clipboard
    if (clipboardData.files && clipboardData.files.length > 0) {
      const imageFiles = Array.from(clipboardData.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        e.preventDefault();
        setUploadingInlineImg(true);
        try {
          const formData = new FormData();
          imageFiles.forEach((f) => formData.append("files", f));
          const res = await fetch("/api/storefront/media/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.uploaded)) {
            data.uploaded.forEach((imgUrl: string) => {
              document.execCommand(
                "insertHTML",
                false,
                `<p><img src="${imgUrl}" alt="Article Image" style="max-width: 100%; height: auto; border-radius: 14px; margin: 12px 0;" /></p>`
              );
            });
            handleInput();
            toast.success("Pasted image uploaded & inserted!");
          }
        } catch (_) {
          toast.error("Failed to upload pasted image");
        } finally {
          setUploadingInlineImg(false);
        }
        return;
      }
    }

    // 2. Check if user pasted HTML content (from Google Docs, Word, ChatGPT, Web)
    const htmlData = clipboardData.getData("text/html");
    if (htmlData && htmlData.trim()) {
      e.preventDefault();
      const cleaned = cleanPastedHtml(htmlData);
      document.execCommand("insertHTML", false, cleaned);
      handleInput();
      return;
    }

    // 3. Plain text / Markdown paste
    const textData = clipboardData.getData("text/plain");
    if (textData && textData.trim()) {
      e.preventDefault();
      const htmlBlocks = textData
        .split(/\r?\n\s*\r?\n/)
        .map((chunk) => convertMarkdownBlockToHtml(chunk))
        .filter(Boolean)
        .join("");
      document.execCommand("insertHTML", false, htmlBlocks || textData);
      handleInput();
    }
  };

  const handleInlineImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingInlineImg(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      const res = await fetch("/api/storefront/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.uploaded)) {
        editorRef.current?.focus();
        data.uploaded.forEach((imgUrl: string) => {
          document.execCommand(
            "insertHTML",
            false,
            `<p><img src="${imgUrl}" alt="Article Image" style="max-width: 100%; height: auto; border-radius: 14px; margin: 12px 0;" /></p>`
          );
        });
        handleInput();
        toast.success("Image inserted into article!");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (_) {
      toast.error("Error uploading inline image");
    } finally {
      setUploadingInlineImg(false);
      if (inlineImageInputRef.current) inlineImageInputRef.current.value = "";
    }
  };

  const execCmd = (command: string, arg: string = "") => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleLink = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      setSavedRange(range.cloneRange());
      setLinkInputText(range.toString().trim());
    } else {
      setSavedRange(null);
      setLinkInputText("");
    }
    setLinkInputUrl("");
    setLinkModalOpen(true);
  };

  const confirmInsertLink = () => {
    if (!linkInputUrl.trim()) {
      setLinkModalOpen(false);
      return;
    }

    let formattedUrl = linkInputUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl) && !/^\//.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (editorRef.current) {
      editorRef.current.focus();

      if (savedRange) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRange);
        }
      }

      const textToDisplay = linkInputText.trim() || formattedUrl;
      const linkHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" style="color: #000000; text-decoration: underline; font-weight: 650;">${textToDisplay}</a>`;

      document.execCommand("insertHTML", false, linkHtml);
      handleInput();
    }

    setLinkModalOpen(false);
    setLinkInputUrl("");
    setLinkInputText("");
    setSavedRange(null);
  };

  const handleFormatBlock = (tag: string) => {
    execCmd("formatBlock", tag);
  };

  return (
    <div className="space-y-4">
      {/* Custom Styles Injection */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rich-editor h1 { font-size: 1.8rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #111827; }
        .rich-editor h2 { font-size: 1.4rem; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #1f2937; }
        .rich-editor h3 { font-size: 1.2rem; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; color: #374151; }
        .rich-editor h4 { font-size: 1.05rem; font-weight: 600; margin-top: 0.85rem; margin-bottom: 0.4rem; color: #374151; }
        .rich-editor p { margin-top: 0.5rem; margin-bottom: 0.75rem; color: #374151; line-height: 1.7; }
        .rich-editor ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #374151; }
        .rich-editor ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; color: #374151; }
        .rich-editor li { margin-bottom: 0.25rem; }
        .rich-editor blockquote { border-left: 4px solid #000; padding-left: 1rem; color: #4b5563; font-style: italic; margin: 1rem 0; background: #f9fafb; padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .rich-editor pre { background-color: #f3f4f6; padding: 0.75rem; border-radius: 0.5rem; font-family: monospace; overflow-x: auto; margin: 1rem 0; font-size: 0.85rem; }
        .rich-editor a { color: #2563eb; text-decoration: underline; }
        .rich-editor img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; }
        .rich-editor[contenteditable]:empty:before { content: "Write or copy-paste your article content and images here..."; color: #d1d5db; pointer-events: none; display: block; }
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
      `,
        }}
      />

      {/* WYSIWYG text formatting toolbar wrapper to cover scrolling content */}
      <div className="sticky top-[136px] z-10 bg-white py-2 border-b border-gray-100/50 -mx-6 px-6 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-1.5 border border-gray-200 bg-white p-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.035)] max-w-full select-none w-max">
          <button
            type="button"
            onClick={() => execCmd("bold")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Bold"
          >
            <Bold size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("italic")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Italic"
          >
            <Italic size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("underline")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Underline"
          >
            <Underline size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("strikeThrough")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Strikethrough"
          >
            <Strikethrough size={13} strokeWidth={2.5} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />

          {/* Custom Heading Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setFormatDropdownOpen(!formatDropdownOpen)}
              className="h-8 px-3 rounded-full flex items-center gap-1.5 text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all text-[9px] font-extrabold uppercase tracking-wider border border-gray-100 cursor-pointer"
              title="Formatting Styles"
            >
              <span>{activeFormatLabel}</span>
              <ChevronDown size={11} className="stroke-[2.5] text-gray-400" />
            </button>

            <AnimatePresence>
              {formatDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setFormatDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-1.5 w-40 bg-white border border-gray-200 rounded-[20px] shadow-xl p-2 z-50 space-y-0.5"
                  >
                    {[
                      { label: "Normal", tag: "<p>" },
                      { label: "Heading 1", tag: "<h1>" },
                      { label: "Heading 2", tag: "<h2>" },
                      { label: "Heading 3", tag: "<h3>" },
                      { label: "Heading 4", tag: "<h4>" },
                      { label: "Heading 5", tag: "<h5>" },
                      { label: "Heading 6", tag: "<h6>" },
                    ].map((opt) => (
                      <button
                        key={opt.tag}
                        type="button"
                        onClick={() => {
                          handleFormatBlock(opt.tag);
                          setActiveFormatLabel(opt.label);
                          setFormatDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer",
                          activeFormatLabel === opt.label
                            ? "bg-black text-[#FFD02F]"
                            : "text-gray-700 hover:bg-[#f4f4f7] hover:text-black"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />

          <button
            type="button"
            onClick={() => execCmd("insertUnorderedList")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Bullet List"
          >
            <List size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("insertOrderedList")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Numbered List"
          >
            <ListOrdered size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("<blockquote>")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Blockquote"
          >
            <Quote size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock("<pre>")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Code Block"
          >
            <Code size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={handleLink}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Insert Link"
          >
            <Link2 size={13} strokeWidth={2.5} />
          </button>

          {/* Inline Image Upload Button */}
          <input
            ref={inlineImageInputRef}
            type="file"
            accept="image/*"
            onChange={handleInlineImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inlineImageInputRef.current?.click()}
            disabled={uploadingInlineImg}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Insert Image into Content"
          >
            <ImageIcon size={13} strokeWidth={2.5} />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />

          <button
            type="button"
            onClick={() => execCmd("undo")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Undo"
          >
            <Undo size={13} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => execCmd("redo")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#f4f4f7] hover:text-black transition-all cursor-pointer flex-shrink-0"
            title="Redo"
          >
            <Redo size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full min-h-[420px] border-none outline-none focus:ring-0 text-[14px] text-gray-800 bg-transparent focus:outline-none select-text rich-editor px-1"
        style={{
          outline: "none",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      />

      {/* Custom Link Insertion Modal Dialog */}
      <AnimatePresence>
        {linkModalOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center backdrop-blur-sm"
            onClick={() => setLinkModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-[28px] p-6 shadow-2xl max-w-sm w-full space-y-4 text-left"
            >
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest leading-none">
                  Insert Link
                </h3>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-1.5 leading-none">
                  Enter URL address below
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                    Display Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={linkInputText}
                    onChange={(e) => setLinkInputText(e.target.value)}
                    placeholder="e.g. Explore Patna Luxury Properties"
                    className="w-full bg-[#f4f4f7] border border-transparent focus:border-black/20 text-xs font-semibold text-gray-800 rounded-full px-4 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                    Target Web / Blog URL
                  </label>
                  <input
                    type="text"
                    value={linkInputUrl}
                    onChange={(e) => setLinkInputUrl(e.target.value)}
                    placeholder="https://realicproperty.com/properties"
                    className="w-full bg-[#f4f4f7] border border-transparent focus:border-black/20 text-xs font-semibold text-gray-800 rounded-full px-4 py-2.5 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:shadow-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmInsertLink();
                      if (e.key === "Escape") setLinkModalOpen(false);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="h-9 px-4 rounded-full border border-gray-200 text-[10px] font-extrabold uppercase tracking-wider hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmInsertLink}
                  className="h-9 px-4 rounded-full bg-black text-[#FFD02F] text-[10px] font-extrabold uppercase tracking-wider hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Insert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function BlogManager() {
  const [view, setView] = useState<"list" | "editor">("list");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editForm, setEditForm] = useState<any>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [deleteConfirm, setDeleteConfirm] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorTab, setEditorTab] = useState<"content" | "seo" | "settings">(
    "content"
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Custom states for interactive media selector
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState("");
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const quickCoverInputRef = useRef<HTMLInputElement>(null);

  // Custom states for Miro-themed Date Picker
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const [blogRes, propRes] = await Promise.all([
        fetch("/api/storefront/blog?all=true", { cache: "no-store" }),
        fetch("/api/properties", { cache: "no-store" }),
      ]);
      const data = await blogRes.json();
      const propData = await propRes.json();

      if (propData.success && Array.isArray(propData.data)) {
        setProperties(propData.data);
      }

      if (data.success && Array.isArray(data.posts)) {
        setPosts(
          data.posts.map((p: any) => ({
            ...p,
            author:
              typeof p.author === "object"
                ? p.author.name
                : p.author || p.author_name || "Amit Vikram",
            author_role:
              typeof p.author === "object"
                ? p.author.role
                : p.author_role ||
                  p.authorObj?.role ||
                  "Managing Director, Bihar & Eastern Corridor",
            author_avatar:
              typeof p.author === "object"
                ? p.author.avatar
                : p.author_avatar ||
                  p.authorObj?.avatar ||
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
            featured_image: p.featured_image || p.coverImage || "",
            tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
            content:
              typeof p.content === "string"
                ? p.content
                : JSON.stringify(p.content),
          }))
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const formatPublishDate = (dateStr: string | null) => {
    if (!dateStr) return "Not Scheduled (Draft)";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (_) {
      return dateStr || "Not Scheduled (Draft)";
    }
  };

  const handleOpenDatePicker = () => {
    const parsed = editForm.published_at
      ? new Date(editForm.published_at)
      : new Date();
    setTempDate(isNaN(parsed.getTime()) ? new Date() : parsed);
    setDatePickerOpen(!datePickerOpen);
  };

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setTempDate(
      new Date(
        tempDate.getFullYear(),
        tempDate.getMonth() - 1,
        1,
        tempDate.getHours(),
        tempDate.getMinutes()
      )
    );
  };

  const handleNextMonth = () => {
    setTempDate(
      new Date(
        tempDate.getFullYear(),
        tempDate.getMonth() + 1,
        1,
        tempDate.getHours(),
        tempDate.getMinutes()
      )
    );
  };

  const handleDaySelect = (day: number) => {
    setTempDate(
      new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        day,
        tempDate.getHours(),
        tempDate.getMinutes()
      )
    );
  };

  const handleHourSelect = (h: number) => {
    const isPm = tempDate.getHours() >= 12;
    let actualHour = h;
    if (isPm && h < 12) actualHour = h + 12;
    if (!isPm && h === 12) actualHour = 0;
    setTempDate(
      new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        actualHour,
        tempDate.getMinutes()
      )
    );
  };

  const handleMinuteSelect = (m: number) => {
    setTempDate(
      new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        tempDate.getHours(),
        m
      )
    );
  };

  const handleAmpmSelect = (ampm: "AM" | "PM") => {
    const currentHours = tempDate.getHours();
    const isCurrentlyPm = currentHours >= 12;
    let newHours = currentHours;

    if (ampm === "PM" && !isCurrentlyPm) {
      newHours = currentHours + 12;
    } else if (ampm === "AM" && isCurrentlyPm) {
      newHours = currentHours - 12;
    }
    setTempDate(
      new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate(),
        newHours,
        tempDate.getMinutes()
      )
    );
  };

  const applyPublishDate = () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${tempDate.getFullYear()}-${pad(
      tempDate.getMonth() + 1
    )}-${pad(tempDate.getDate())} ${pad(tempDate.getHours())}:${pad(
      tempDate.getMinutes()
    )}:${pad(tempDate.getSeconds())}`;
    setEditForm({ ...editForm, published_at: formatted });
    setDatePickerOpen(false);
    toast.success("Publication date scheduled!");
  };

  const clearPublishDate = () => {
    setEditForm({ ...editForm, published_at: null });
    setDatePickerOpen(false);
    toast.success("Publication date cleared!");
  };

  const fetchMediaFiles = useCallback(async () => {
    setMediaLoading(true);
    try {
      const res = await fetch("/api/storefront/media", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setMediaFiles(data.files || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const openMediaSelector = () => {
    setMediaSelectorOpen(true);
    fetchMediaFiles();
  };

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    autoSelectAsCover: boolean = true
  ) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setMediaUploading(true);
    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("files", selectedFiles[i]);
    }

    try {
      const res = await fetch("/api/storefront/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Image uploaded successfully!");
        await fetchMediaFiles();
        if (
          autoSelectAsCover &&
          Array.isArray(data.uploaded) &&
          data.uploaded.length > 0
        ) {
          setEditForm((prev: any) => ({
            ...prev,
            featured_image: data.uploaded[0],
          }));
          setMediaSelectorOpen(false);
        }
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    } finally {
      setMediaUploading(false);
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
      if (quickCoverInputRef.current) quickCoverInputRef.current.value = "";
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleAutoFormat = () => {
    if (!editForm?.content) {
      toast.info("Write or paste some content first to auto-format.");
      return;
    }
    try {
      let blocks: string[] = [];
      try {
        const parsed = JSON.parse(editForm.content);
        if (Array.isArray(parsed)) {
          blocks = parsed.map((b) => convertMarkdownBlockToHtml(String(b)));
        }
      } catch (_) {
        blocks = String(editForm.content)
          .split(/\n\s*\n/)
          .map((b) => convertMarkdownBlockToHtml(b));
      }
      const cleaned = blocks.filter(Boolean);
      setEditForm({ ...editForm, content: JSON.stringify(cleaned) });
      toast.success("Content auto-formatted cleanly!");
    } catch (_) {
      toast.error("Could not auto-format content");
    }
  };

  const handleCreateNew = () => {
    setEditForm({
      ...INITIAL_FORM,
      published_at: new Date().toISOString(),
    });
    setMode("create");
    setEditorTab("content");
    setView("editor");
  };

  const openEdit = (post: BlogPost) => {
    setEditForm({
      ...post,
      featured_image: post.featured_image || post.coverImage || "",
      author:
        typeof post.author === "object"
          ? (post.author as any).name
          : post.author || "Amit Vikram",
      author_role:
        post.author_role ||
        (typeof post.author === "object" ? (post.author as any).role : "") ||
        "Managing Director, Bihar & Eastern Corridor",
      author_avatar:
        post.author_avatar ||
        (typeof post.author === "object" ? (post.author as any).avatar : "") ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "",
      relatedPropertyIds: post.relatedPropertyIds || [],
    });
    setMode("edit");
    setEditorTab("content");
    setView("editor");
  };

  const toggleRelatedProperty = (propId: string) => {
    setEditForm((prev: any) => {
      const current: string[] = prev.relatedPropertyIds || [];
      const exists = current.includes(propId);
      const updated = exists
        ? current.filter((id) => id !== propId)
        : [...current, propId];
      return { ...prev, relatedPropertyIds: updated };
    });
  };

  const savePost = async () => {
    const cleanTitle = (editForm.title || "").trim();
    const cleanSlug =
      (editForm.slug || "").trim() || generateSlug(cleanTitle);

    if (!cleanTitle || !cleanSlug) {
      toast.error("Title and slug are required");
      return;
    }

    setSaving(true);
    try {
      const isCreate = mode === "create";
      const url = isCreate
        ? "/api/storefront/blog"
        : `/api/storefront/blog/${encodeURIComponent(editForm.id)}`;
      const method = isCreate ? "POST" : "PUT";

      const payload = {
        ...editForm,
        title: cleanTitle,
        slug: cleanSlug,
        coverImage: editForm.featured_image,
        featured_image: editForm.featured_image,
        author: editForm.author || "Amit Vikram",
        author_name: editForm.author || "Amit Vikram",
        author_role:
          editForm.author_role ||
          "Managing Director, Bihar & Eastern Corridor",
        author_avatar:
          editForm.author_avatar ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        meta_title:
          editForm.meta_title ||
          `${cleanTitle} | Realic Property Consultant`,
        meta_description:
          editForm.meta_description || editForm.excerpt || cleanTitle,
        published_at:
          editForm.status === "published" && !editForm.published_at
            ? new Date().toISOString()
            : editForm.published_at,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          isCreate
            ? "Blog post created successfully!"
            : "Blog post updated successfully!"
        );
        await fetchPosts();
        setView("list");
      } else {
        toast.error(data.error || "Failed to save post");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    try {
      const res = await fetch(
        `/api/storefront/blog/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Blog post deleted successfully");
        await fetchPosts();
        setDeleteConfirm(null);
      } else {
        toast.error("Failed to delete blog post");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error occurred during deletion");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const q = search.toLowerCase();
    const matchesSearch =
      post.title.toLowerCase().includes(q) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(q)) ||
      (post.author && post.author.toLowerCase().includes(q)) ||
      (post.content && String(post.content).toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || post.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...(posts.map((p) => p.category).filter(Boolean) as string[]),
    ])
  );

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;
  const featuredCount = posts.filter((p) => Number(p.featured) === 1).length;

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto space-y-6">
      {view === "list" ? (
        <div className="space-y-6">
          {/* Header Banners */}
          <div className="bg-[#FFD02F]/10 border border-[#FFD02F]/20 rounded-[20px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#FFD02F]/20 border border-[#FFD02F]/40 rounded-full text-black">
                <FileText size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  Editorial Hub
                </h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  Manage and write journal articles for your storefront.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/blogs"
                target="_blank"
                className="px-4 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={13} /> View Public Journal
              </Link>
              <Button
                onClick={handleCreateNew}
                className="bg-black hover:bg-gray-800 text-white rounded-full h-10 px-5 font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2"
              >
                <Plus size={14} /> Create Post
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                label: "Published Articles",
                value: publishedCount,
                color: "bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]",
              },
              {
                label: "Draft Posts",
                value: draftCount,
                color: "bg-[#ECEFF1] border-[#CFD8DC] text-[#37474F]",
              },
              {
                label: "Featured Stories",
                value: featuredCount,
                color: "bg-[#FFF9C4] border-[#FFF59D] text-[#5D4037]",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={cn(
                  "p-5 rounded-[20px] border flex items-center justify-between shadow-sm",
                  stat.color
                )}
              >
                <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-80">
                  {stat.label}
                </span>
                <span className="text-3xl font-black tracking-tight">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-center gap-3 justify-between bg-white border border-gray-200 rounded-[20px] p-4">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, or content..."
                className="w-full bg-[#f4f4f7] border border-transparent focus:border-black/25 text-[12px] font-medium text-gray-700 rounded-full pl-9 pr-4 py-2 outline-none transition-all placeholder:text-gray-400 focus:bg-white"
              />
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {["all", "published", "draft"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer",
                    statusFilter === status
                      ? "bg-black text-white border-black"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}
                >
                  {status === "all"
                    ? "All Posts"
                    : status === "published"
                    ? "Published"
                    : "Drafts"}
                </button>
              ))}
            </div>

            {/* Category Filter dropdown */}
            <div className="w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#f4f4f7] border border-transparent focus:border-black/25 text-[11px] font-bold uppercase text-gray-700 rounded-full px-4 py-2 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading spinner */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-gray-200 rounded-[20px]">
              <FileText size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
                No articles found
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                Try resetting your filters or create a new blog post.
              </p>
              <Button
                onClick={handleCreateNew}
                className="bg-black hover:bg-gray-800 text-white rounded-full h-9 px-4 font-bold text-xs uppercase tracking-wider mt-4"
              >
                Write a Post
              </Button>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-[20px] border border-gray-200 p-5 flex flex-col justify-between group shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-50 border border-gray-100 rounded-[14px] mb-4">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                        <FileText size={32} />
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute top-3 left-3 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm",
                        post.status === "published"
                          ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                          : "bg-[#ECEFF1] text-[#37474F] border-[#CFD8DC]"
                      )}
                    >
                      {post.status === "published" ? "LIVE" : "DRAFT"}
                    </span>
                    {Number(post.featured) === 1 && (
                      <span className="absolute top-3 right-3 bg-[#FFD02F] text-black border border-black/10 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 font-semibold">
                        <span className="font-extrabold text-black bg-[#FFD02F] px-2.5 py-0.5 rounded-full uppercase text-[9px] border border-black/5">
                          {post.category || "Market Trends"}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[9px] font-bold">
                          {post.read_time || "5 min read"}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-gray-950 leading-snug group-hover:text-black transition-colors mb-1.5 uppercase line-clamp-2">
                        {post.title}
                      </h3>
                      {post.title_hindi && (
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          {post.title_hindi}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-4">
                      <div className="flex items-center gap-2 min-w-0">
                        {post.author_avatar ? (
                          <img
                            src={post.author_avatar}
                            alt={post.author || "Author"}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#FFD02F]/15 border border-[#FFD02F]/30 text-black text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                            {post.author
                              ? post.author
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "A"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-950 truncate">
                            {post.author || "Amit Vikram"}
                          </p>
                          <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider leading-none mt-0.5 truncate">
                            {post.author_role || "Author"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Link
                          href={`/blogs/${post.slug}`}
                          target="_blank"
                          title="View live article"
                          className="h-8 w-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center transition-colors"
                        >
                          <Eye size={12} />
                        </Link>
                        <Button
                          onClick={() => openEdit(post)}
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Pencil size={12} /> Edit
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(post)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full border-gray-200 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-visible">
          {/* Editor Top Toolbar */}
          <div className="border-b border-gray-100 px-6 sm:px-8 py-4 bg-white rounded-t-[24px] flex flex-wrap items-center justify-between gap-3 sticky top-16 z-20 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setView("list")}
                className="p-2 rounded-full hover:bg-gray-50 border border-gray-200 transition-colors text-gray-500 cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 leading-none">
                  {mode === "create" ? "Create New" : "Edit Post"}
                </h2>
                <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider mt-1.5 leading-none">
                  {mode === "create"
                    ? "Write or copy-paste your story"
                    : `Slug: /blogs/${editForm.slug}`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Button
                onClick={handleAutoFormat}
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full text-xs font-bold uppercase tracking-wider"
              >
                Auto-Format
              </Button>
              <Button
                onClick={() => setPreviewModalOpen(true)}
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Eye size={14} /> Preview
              </Button>

              {mode === "edit" && editForm.slug && (
                <Link
                  href={`/blogs/${editForm.slug}`}
                  target="_blank"
                  className="h-10 px-4 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={13} /> Live
                </Link>
              )}

              <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />

              {/* Segmented Control for Draft/Publish */}
              <div className="bg-[#f4f4f7] p-1 rounded-full flex items-center border border-gray-200 select-none">
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, status: "draft" })}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer",
                    editForm.status === "draft"
                      ? "bg-white text-black shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      : "text-gray-400 hover:text-gray-700"
                  )}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm({ ...editForm, status: "published" })
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer",
                    editForm.status === "published"
                      ? "bg-black text-[#FFD02F] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                      : "text-gray-400 hover:text-gray-700"
                  )}
                >
                  Publish
                </button>
              </div>

              <Button
                onClick={savePost}
                disabled={saving}
                className="bg-black hover:bg-gray-800 text-white rounded-full px-5 h-10 text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5"
              >
                <Save size={14} /> {saving ? "Saving..." : "Save Post"}
              </Button>
            </div>
          </div>

          {/* Sub-tab navigation */}
          <div className="border-b border-gray-100 px-6 sm:px-8 py-3 bg-white flex items-center justify-start">
            <div className="flex gap-2">
              {(["content", "seo", "settings"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setEditorTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all border cursor-pointer",
                    editorTab === tab
                      ? "bg-black text-white border-black"
                      : "bg-white border-gray-200 text-gray-400 hover:text-gray-900"
                  )}
                >
                  {tab === "content"
                    ? "Content"
                    : tab === "seo"
                    ? "SEO & Schema"
                    : "Settings"}
                </button>
              ))}
            </div>
          </div>

          {/* Form area columns */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-8 max-w-7xl mx-auto w-full">
            {/* Left Main column */}
            <div className="lg:col-span-2 space-y-6">
              {editorTab === "content" && (
                <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-none space-y-6">
                  {/* Cover Image Preview */}
                  {editForm.featured_image && (
                    <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[14px] border border-gray-200 bg-gray-50 group">
                      <img
                        src={editForm.featured_image}
                        alt="Featured image cover"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({ ...editForm, featured_image: "" })
                        }
                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm cursor-pointer"
                        title="Remove cover image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Large Compelling Title */}
                  <div className="space-y-1">
                    <textarea
                      value={editForm.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setEditForm({
                          ...editForm,
                          title,
                          slug:
                            mode === "create"
                              ? generateSlug(title)
                              : editForm.slug || generateSlug(title),
                        });
                      }}
                      placeholder="Enter a compelling title..."
                      rows={2}
                      className="w-full text-2xl sm:text-3xl font-extrabold text-gray-900 border-none outline-none focus:ring-0 placeholder:text-gray-300 resize-none leading-tight py-1"
                    />

                    {/* Optional Hindi / Secondary Title */}
                    <input
                      type="text"
                      value={editForm.title_hindi || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title_hindi: e.target.value })
                      }
                      placeholder="हिंदी शीर्षक / Optional Subtitle..."
                      className="w-full text-sm font-bold text-gray-500 border-none outline-none focus:ring-0 placeholder:text-gray-300 pb-2 bg-transparent"
                    />

                    <div className="w-full h-px bg-gray-100" />
                  </div>

                  {/* Excerpt summary */}
                  <div className="space-y-1">
                    <textarea
                      value={editForm.excerpt || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, excerpt: e.target.value })
                      }
                      placeholder="Write a brief, engaging excerpt that sums up your story..."
                      rows={2}
                      className="w-full text-sm text-gray-600 border-none outline-none focus:ring-0 resize-none placeholder:text-gray-300 leading-relaxed font-semibold"
                    />
                    <div className="w-full h-px bg-gray-100" />
                  </div>

                  {/* Premium Rich Text Editor */}
                  <RichTextEditor
                    value={editForm.content || ""}
                    onChange={(newVal) =>
                      setEditForm({ ...editForm, content: newVal })
                    }
                  />
                </div>
              )}

              {editorTab === "seo" && (
                <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-none space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">
                      SEO Configurations
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Optimize how your article appears on Google and search engines.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">
                      Slug / Permanent URL *
                    </Label>
                    <Input
                      value={editForm.slug}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          slug: generateSlug(e.target.value),
                        })
                      }
                      placeholder="post-url-slug"
                      className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">
                        Meta Title
                      </Label>
                      <span className="text-[9px] text-gray-400 font-bold">
                        {(editForm.meta_title || "").length} / 60 chars
                      </span>
                    </div>
                    <Input
                      value={editForm.meta_title || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, meta_title: e.target.value })
                      }
                      placeholder="Custom title for search results..."
                      className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">
                        Meta Description
                      </Label>
                      <span className="text-[9px] text-gray-400 font-bold">
                        {(editForm.meta_description || "").length} / 160 chars
                      </span>
                    </div>
                    <textarea
                      value={editForm.meta_description || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          meta_description: e.target.value,
                        })
                      }
                      placeholder="Brief summary for search engine snippet..."
                      rows={3}
                      className="w-full bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-[14px] px-4 py-2.5 text-xs outline-none focus:bg-white resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">
                      Tags / Keywords
                    </Label>
                    <Input
                      value={editForm.tags || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tags: e.target.value })
                      }
                      placeholder="e.g. Patna Real Estate, Bailey Road, RERA Diligence"
                      className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                    />
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                      Separate keywords with commas.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">
                      Canonical URL (Optional)
                    </Label>
                    <Input
                      value={editForm.canonicalUrl || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          canonicalUrl: e.target.value,
                        })
                      }
                      placeholder={`https://realicproperty.com/blogs/${
                        editForm.slug || "post-slug"
                      }`}
                      className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs font-mono outline-none"
                    />
                  </div>

                  {/* Live Search Snippet Preview */}
                  <div className="p-5 rounded-[20px] border border-gray-200 bg-gray-50/50 space-y-3 mt-4">
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles
                        size={12}
                        className="text-[#FFD02F] bg-black p-0.5 rounded-full"
                      />{" "}
                      Google Search Snippet Preview
                    </h4>
                    <div className="bg-white border border-gray-100 rounded-[14px] p-4 shadow-sm space-y-1 max-w-xl">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#202124]">
                        <span className="font-bold">realicproperty.com</span>
                        <span className="text-gray-400">› blogs ›</span>
                        <span className="text-gray-500 font-mono text-[10px]">
                          {editForm.slug || "post-slug"}
                        </span>
                      </div>
                      <div className="text-[#1a0dab] font-sans hover:underline text-lg font-medium leading-tight cursor-pointer break-words">
                        {editForm.meta_title ||
                          editForm.title ||
                          "Untitled Post"}
                      </div>
                      <div className="text-[#4d5156] text-xs font-normal leading-relaxed break-words">
                        {editForm.meta_description ||
                          editForm.excerpt ||
                          "Please write an excerpt or meta description for this article. This snippet will show up in Google search results."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editorTab === "settings" && (
                <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-none space-y-6">
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-widest border-b border-gray-100 pb-2">
                    Article & Author Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">
                        Category (English) *
                      </Label>
                      <Input
                        value={editForm.category || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                        placeholder="e.g. Market Trends, Legal & RERA"
                        className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() =>
                              setEditForm({ ...editForm, category: cat })
                            }
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors cursor-pointer",
                              editForm.category === cat
                                ? "bg-black text-[#FFD02F] border-black"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">
                        Category (Hindi / Secondary)
                      </Label>
                      <Input
                        value={editForm.category_hindi || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            category_hindi: e.target.value,
                          })
                        }
                        placeholder="e.g. बाज़ार रुझान"
                        className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">
                      Title (Hindi / Subtitle)
                    </Label>
                    <Input
                      value={editForm.title_hindi || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          title_hindi: e.target.value,
                        })
                      }
                      placeholder="Optional Hindi title or secondary headline"
                      className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">
                        Author Name *
                      </Label>
                      <Input
                        value={editForm.author || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, author: e.target.value })
                        }
                        placeholder="e.g. Amit Vikram"
                        className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-500 uppercase">
                        Author Role / Designation
                      </Label>
                      <Input
                        value={editForm.author_role || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            author_role: e.target.value,
                          })
                        }
                        placeholder="e.g. Managing Director, Bihar & Eastern Corridor"
                        className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">
                      Author Avatar URL
                    </Label>
                    <div className="flex items-center gap-3">
                      {editForm.author_avatar && (
                        <img
                          src={editForm.author_avatar}
                          alt="Author Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        />
                      )}
                      <Input
                        value={editForm.author_avatar || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            author_avatar: e.target.value,
                          })
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Interlink Active Properties */}
                  {properties.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div>
                        <Label className="text-[10px] font-bold text-gray-500 uppercase">
                          Interlink Active Properties (Optional)
                        </Label>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Select properties to recommend inside this article:
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                        {properties.map((prop) => {
                          const isChecked = (
                            editForm.relatedPropertyIds || []
                          ).includes(prop.id);
                          return (
                            <label
                              key={prop.id}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-2xl border cursor-pointer transition-all",
                                isChecked
                                  ? "border-black bg-gray-50"
                                  : "border-gray-200 hover:bg-gray-50/60"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={prop.images[0]}
                                  alt={prop.title}
                                  className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-gray-900 block truncate">
                                    {prop.title}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {prop.city} • {prop.priceDisplay}
                                  </span>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleRelatedProperty(prop.id)}
                                className="w-4 h-4 accent-black rounded cursor-pointer ml-2"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right sidebar column */}
            <div className="space-y-6">
              {/* Publish Date panel */}
              <div className="bg-white rounded-[20px] border border-gray-200 p-5 shadow-none relative">
                <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Calendar
                    size={14}
                    className="text-[#FFD02F] bg-black p-1 rounded-full"
                  />{" "}
                  Publish Date
                </h4>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">
                    Set Publication Date
                  </Label>

                  {/* Custom Miro-themed Trigger Button */}
                  <button
                    type="button"
                    onClick={handleOpenDatePicker}
                    className="w-full bg-[#f4f4f7] hover:bg-gray-100/80 border border-transparent text-left focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none cursor-pointer transition-all flex items-center justify-between"
                  >
                    <span className="font-bold text-gray-800 uppercase tracking-wide truncate">
                      {formatPublishDate(editForm.published_at)}
                    </span>
                    <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                  </button>

                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none mt-1">
                    Controls how the date appears on the blog.
                  </p>
                </div>

                {/* Custom Miro-themed Date/Time Picker Dropdown */}
                <AnimatePresence>
                  {datePickerOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setDatePickerOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50 space-y-3"
                      >
                        {/* Month/Year selector header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-black">
                            {
                              [
                                "January",
                                "February",
                                "March",
                                "April",
                                "May",
                                "June",
                                "July",
                                "August",
                                "September",
                                "October",
                                "November",
                                "December",
                              ][tempDate.getMonth()]
                            }{" "}
                            {tempDate.getFullYear()}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={handlePrevMonth}
                              className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-500 cursor-pointer"
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              onClick={handleNextMonth}
                              className="w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-500 cursor-pointer"
                            >
                              ›
                            </button>
                          </div>
                        </div>

                        {/* Calendar Day grid */}
                        <div className="space-y-1">
                          <div className="grid grid-cols-7 gap-0.5 text-center">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                              (w) => (
                                <span
                                  key={w}
                                  className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest"
                                >
                                  {w}
                                </span>
                              )
                            )}
                          </div>
                          <div className="grid grid-cols-7 gap-0.5 text-center">
                            {Array.from({
                              length: getFirstDayOfMonth(
                                tempDate.getFullYear(),
                                tempDate.getMonth()
                              ),
                            }).map((_, idx) => (
                              <div key={`offset-${idx}`} className="w-8 h-8" />
                            ))}
                            {Array.from(
                              {
                                length: getDaysInMonth(
                                  tempDate.getFullYear(),
                                  tempDate.getMonth()
                                ),
                              },
                              (_, idx) => idx + 1
                            ).map((day) => {
                              const isSelected = tempDate.getDate() === day;
                              return (
                                <button
                                  key={`day-${day}`}
                                  type="button"
                                  onClick={() => handleDaySelect(day)}
                                  className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer",
                                    isSelected
                                      ? "bg-black text-[#FFD02F] font-extrabold shadow-sm"
                                      : "text-gray-800 hover:bg-[#f4f4f7] hover:text-black"
                                  )}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="w-full h-px bg-gray-100" />

                        {/* Time Select section */}
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider">
                            Scheduled Time
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <select
                                value={tempDate.getHours() % 12 || 12}
                                onChange={(e) =>
                                  handleHourSelect(Number(e.target.value))
                                }
                                className="bg-[#f4f4f7] border border-transparent focus:border-black/20 text-[10px] font-extrabold rounded-full px-2.5 py-1.5 outline-none cursor-pointer hover:bg-gray-100"
                              >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(
                                  (h) => (
                                    <option key={h} value={h}>
                                      {h.toString().padStart(2, "0")}
                                    </option>
                                  )
                                )}
                              </select>
                              <span className="text-gray-400 text-xs font-bold">
                                :
                              </span>
                              <select
                                value={tempDate.getMinutes()}
                                onChange={(e) =>
                                  handleMinuteSelect(Number(e.target.value))
                                }
                                className="bg-[#f4f4f7] border border-transparent focus:border-black/20 text-[10px] font-extrabold rounded-full px-2.5 py-1.5 outline-none cursor-pointer hover:bg-gray-100"
                              >
                                {Array.from({ length: 60 }, (_, i) => i).map(
                                  (m) => (
                                    <option key={m} value={m}>
                                      {m.toString().padStart(2, "0")}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            {/* AM/PM Switcher */}
                            <div className="bg-[#f4f4f7] border border-transparent p-0.5 rounded-full flex items-center select-none">
                              {["AM", "PM"].map((ampm) => {
                                const isSelected =
                                  ampm === "PM"
                                    ? tempDate.getHours() >= 12
                                    : tempDate.getHours() < 12;
                                return (
                                  <button
                                    key={ampm}
                                    type="button"
                                    onClick={() =>
                                      handleAmpmSelect(ampm as "AM" | "PM")
                                    }
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-[9px] font-extrabold transition-all cursor-pointer",
                                      isSelected
                                        ? "bg-black text-[#FFD02F] shadow-sm"
                                        : "text-gray-400 hover:text-gray-700"
                                    )}
                                  >
                                    {ampm}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons at bottom */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                          <button
                            type="button"
                            onClick={clearPublishDate}
                            className="text-[9px] font-extrabold uppercase tracking-wider text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            Clear
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDatePickerOpen(false)}
                              className="px-3 py-1.5 border border-gray-200 text-gray-500 hover:text-gray-900 rounded-full text-[9px] font-extrabold uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={applyPublishDate}
                              className="px-3 py-1.5 bg-black text-[#FFD02F] rounded-full text-[9px] font-extrabold uppercase tracking-wider cursor-pointer hover:bg-gray-800"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Featured Status panel */}
              <div className="bg-white rounded-[20px] border border-gray-200 p-5 shadow-none">
                <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  ★ Featured Status
                </h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wider leading-none">
                      Featured Post
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 leading-normal">
                      Highlight on homepage & top of journal
                    </p>
                  </div>
                  <Switch
                    checked={
                      editForm.featured === 1 || editForm.featured === true
                    }
                    onCheckedChange={(v) =>
                      setEditForm({ ...editForm, featured: v ? 1 : 0 })
                    }
                  />
                </div>
              </div>

              {/* Featured Media panel */}
              <div className="bg-white rounded-[20px] border border-gray-200 p-5 shadow-none space-y-4">
                <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon
                    size={14}
                    className="text-[#FFD02F] bg-black p-1 rounded-full"
                  />{" "}
                  Featured Media
                </h4>
                <div
                  onClick={openMediaSelector}
                  className="border border-dashed border-gray-200 rounded-[20px] p-4 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FFD02F]/10 text-black flex items-center justify-center mx-auto mb-2">
                    <Plus size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-950 uppercase tracking-wider leading-none">
                    Select Story Cover
                  </p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                    1200 x 800 RECOMMENDED • LIBRARY OR UPLOAD
                  </p>
                </div>

                {/* Direct Computer Upload Shortcut */}
                <div>
                  <input
                    ref={quickCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaUpload(e, true)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => quickCoverInputRef.current?.click()}
                    disabled={mediaUploading}
                    className="w-full py-2 px-4 rounded-full bg-black text-[#FFD02F] hover:bg-gray-800 text-[10px] font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload size={12} />
                    <span>
                      {mediaUploading
                        ? "Uploading Image..."
                        : "Upload Cover from Computer"}
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">
                    Or Use External URL
                  </Label>
                  <Input
                    value={editForm.featured_image || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        featured_image: e.target.value,
                      })
                    }
                    placeholder="Paste image URL here..."
                    className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs font-mono outline-none"
                  />
                </div>
                {editForm.featured_image && (
                  <div className="rounded-[14px] overflow-hidden border border-gray-100 max-h-36">
                    <img
                      src={editForm.featured_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Post Metrics & Author Attribution panel */}
              <div className="bg-white rounded-[20px] border border-gray-200 p-5 shadow-none space-y-4">
                <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  ⚡ Post Metrics & Author
                </h4>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">
                    Category
                  </Label>
                  <select
                    value={editForm.category || "Market Trends"}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="w-full bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">
                    Read Estimate
                  </Label>
                  <Input
                    value={editForm.read_time || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, read_time: e.target.value })
                    }
                    placeholder="e.g. 5 min read"
                    className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                  />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                    e.g. &quot;5 min read&quot;, &quot;10 mins&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">
                    Author Name
                  </Label>
                  <Input
                    value={editForm.author || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, author: e.target.value })
                    }
                    placeholder="Author name"
                    className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">
                    Author Role / Designation
                  </Label>
                  <Input
                    value={editForm.author_role || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, author_role: e.target.value })
                    }
                    placeholder="e.g. Managing Director"
                    className="bg-[#f4f4f7]/80 border border-transparent focus:border-black/25 text-gray-900 rounded-full px-4 py-2.5 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <div
            className="fixed inset-0 bg-black/40 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 text-gray-900 max-w-sm w-full rounded-[24px] shadow-xl p-6 space-y-4"
            >
              <h3 className="text-gray-900 text-lg font-extrabold uppercase tracking-tight">
                Delete Post?
              </h3>
              <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                This will permanently delete{" "}
                <strong className="text-gray-900">{deleteConfirm.title}</strong>
                . This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-full px-5 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => deletePost(deleteConfirm.id)}
                  className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-full px-5 text-xs font-bold uppercase tracking-wider"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blog Preview Dialog Modal */}
      <AnimatePresence>
        {previewModalOpen && editForm && (
          <div
            className="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-[32px] shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-8 md:p-14 space-y-6 relative flex flex-col no-scrollbar"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-gray-200 transition-colors text-gray-500 cursor-pointer"
              >
                <X size={15} className="stroke-[2.5]" />
              </button>

              {/* Title & Metadata */}
              <div className="space-y-3">
                <span className="inline-block px-3 py-1 rounded-full bg-[#f4f4f7] text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
                  {editForm.category || "Market Trends"}
                </span>
                <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight select-text">
                  {editForm.title || "Untitled Post"}
                </h1>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">
                  By {editForm.author || "Amit Vikram"} •{" "}
                  {editForm.read_time || "5 min read"}
                </p>
              </div>

              <div className="w-full h-px bg-gray-100" />

              {/* Cover Image */}
              {editForm.featured_image && (
                <div className="w-full overflow-hidden rounded-[24px]">
                  <img
                    src={editForm.featured_image}
                    alt="Blog Cover Preview"
                    className="w-full h-[300px] md:h-[420px] object-cover"
                  />
                </div>
              )}

              {/* Content Body */}
              <div
                className="rich-editor text-gray-800 leading-relaxed text-sm space-y-4 select-text"
                dangerouslySetInnerHTML={{
                  __html: (() => {
                    const contentStr = editForm.content;
                    if (!contentStr)
                      return '<p class="text-gray-400 italic">No content written yet...</p>';
                    try {
                      const parsed = JSON.parse(contentStr);
                      if (Array.isArray(parsed)) {
                        return parsed
                          .map((block: any) =>
                            convertMarkdownBlockToHtml(String(block))
                          )
                          .join("");
                      }
                    } catch (_) {}
                    return String(contentStr)
                      .split(/\n\s*\n/)
                      .map((b) => convertMarkdownBlockToHtml(b))
                      .join("");
                  })(),
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Selector Dialog Modal */}
      <AnimatePresence>
        {mediaSelectorOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-[999999] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setMediaSelectorOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-[32px] shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto p-8 space-y-6 relative flex flex-col no-scrollbar"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setMediaSelectorOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center border border-gray-200 transition-colors text-gray-500 cursor-pointer"
              >
                <X size={15} className="stroke-[2.5]" />
              </button>

              {/* Title & Upload Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest leading-none">
                    Select Story Cover
                  </h3>
                  <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-1.5 leading-none">
                    Choose an image from your library or upload a new one
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <input
                    ref={mediaFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMediaUpload(e, true)}
                    className="hidden"
                    id="media-modal-upload"
                  />
                  <label
                    htmlFor="media-modal-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-[#FFD02F] font-bold text-[10px] uppercase tracking-wider rounded-full hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                  >
                    {mediaUploading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-[#FFD02F]/30 border-t-[#FFD02F] rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={12} className="stroke-[2.5]" /> Upload
                        Image
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Search uploaded or project images by filename..."
                  className="w-full bg-[#f4f4f7] border border-transparent focus:border-black/20 text-xs font-semibold text-gray-800 rounded-full pl-10 pr-4 py-3 outline-none transition-all placeholder:text-gray-400 focus:bg-white focus:shadow-sm"
                />
              </div>

              {/* Grid of Images */}
              {mediaLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Loading Library...
                  </p>
                </div>
              ) : (
                (() => {
                  const filtered = mediaFiles.filter(
                    (f) =>
                      f.name
                        .toLowerCase()
                        .includes(mediaSearch.toLowerCase()) ||
                      f.url.toLowerCase().includes(mediaSearch.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 bg-gray-50/50 rounded-[24px] border border-dashed border-gray-200">
                        <ImageIcon
                          size={40}
                          className="text-gray-300 mx-auto mb-2"
                        />
                        <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                          No matching images found
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[45vh] pr-2 no-scrollbar">
                      {filtered.map((file) => (
                        <div
                          key={file.url}
                          onClick={() => {
                            setEditForm({
                              ...editForm,
                              featured_image: file.url,
                            });
                            setMediaSelectorOpen(false);
                            toast.success(
                              "Cover image selected successfully!"
                            );
                          }}
                          className="group relative aspect-video sm:aspect-square overflow-hidden rounded-[20px] border border-gray-200 hover:border-black bg-gray-50 cursor-pointer transition-all hover:shadow-md"
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <p className="text-[9px] font-bold text-white uppercase tracking-wider truncate w-full">
                              {file.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
