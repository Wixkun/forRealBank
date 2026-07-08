'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';

type NewsStatus =
  | 'SECURITY'
  | 'TRANSACTIONS'
  | 'PAYMENTS'
  | 'ACCOUNT_UPDATES'
  | 'SYSTEM'
  | 'INFORMATION';

const STATUS_OPTIONS: { value: NewsStatus; label: string; color: string; dot: string }[] = [
  { value: 'INFORMATION', label: 'Information', color: 'text-amber-400', dot: 'bg-amber-400' },
  { value: 'SYSTEM', label: 'Système', color: 'text-violet-400', dot: 'bg-violet-400' },
];

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;
const MAX_IMAGE_DIMENSION = 1600;
const EDITOR_IMG_CLASS =
  'my-2 max-w-full max-h-48 h-auto rounded-lg border border-white/10 object-contain';

// Redimensionne côté client avant envoi : limite la plus grande dimension et
// ré-encode en webp. On garde l'original si le résultat n'est pas plus léger.
async function downscaleImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file; // préserve l'animation
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 500 * 1024) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.85),
  );
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
}

// Sérialise le contenu de l'éditeur en texte brut avec marqueurs `![image](src)`.
function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof HTMLElement)) return '';
  if (node.tagName === 'BR') return '\n';
  if (node.tagName === 'IMG') return `\n![image](${(node as HTMLImageElement).src})\n`;
  const inner = Array.from(node.childNodes).map(serializeNode).join('');
  return node.tagName === 'DIV' || node.tagName === 'P' ? `\n${inner}` : inner;
}

type Props = {
  apiUrl?: string;
  onCreatedAction?: () => void;
};

export function CreateNewsInlineForm({ apiUrl = '/api', onCreatedAction }: Props) {
  const t = useTranslations('feed.create');

  const editorRef = useRef<HTMLDivElement>(null);
  const emojiPickerWrapperRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // blobUrl -> fichier (déjà redimensionné) inséré dans l'éditeur
  const imageFilesRef = useRef<Map<string, File>>(new Map());

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [status, setStatus] = useState<NewsStatus>('INFORMATION');
  const [hasContent, setHasContent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!emojiPickerWrapperRef.current?.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  useEffect(() => {
    const files = imageFilesRef.current;
    return () => {
      files.forEach((_file, url) => URL.revokeObjectURL(url));
      files.clear();
    };
  }, []);

  const syncHasContent = () => {
    const el = editorRef.current;
    if (!el) return;
    setHasContent(Boolean(el.textContent?.trim()) || el.querySelector('img') !== null);
  };

  const insertAtCaret = (node: Node) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    let range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const insertText = (text: string) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, text);
    syncHasContent();
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertText(emojiData.emoji);
  };

  const addImages = async (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setMessage({ text: t('messages.invalidImageType'), ok: false });
        continue;
      }
      if (imageFilesRef.current.size >= MAX_IMAGES) {
        setMessage({ text: t('messages.tooManyImages'), ok: false });
        break;
      }
      const resized = await downscaleImage(file);
      if (resized.size > MAX_IMAGE_BYTES) {
        setMessage({ text: t('messages.imageTooLarge'), ok: false });
        continue;
      }
      const url = URL.createObjectURL(resized);
      imageFilesRef.current.set(url, resized);
      const img = document.createElement('img');
      img.src = url;
      img.className = EDITOR_IMG_CLASS;
      img.setAttribute('draggable', 'false');
      insertAtCaret(img);
    }
    syncHasContent();
  };

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void addImages(files);
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const imageFiles = Array.from(e.clipboardData.items)
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter((f): f is File => f !== null);
    e.preventDefault();
    if (imageFiles.length > 0) {
      void addImages(imageFiles);
      return;
    }
    // Colle en texte brut pour ne pas importer de HTML mis en forme
    const text = e.clipboardData.getData('text/plain');
    if (text) insertText(text);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Place le point d'insertion à l'endroit du drop quand le navigateur le permet
    type CaretDoc = Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
      caretPositionFromPoint?: (
        x: number,
        y: number,
      ) => { offsetNode: Node; offset: number } | null;
    };
    const doc = document as CaretDoc;
    const sel = window.getSelection();
    if (doc.caretRangeFromPoint) {
      const range = doc.caretRangeFromPoint(e.clientX, e.clientY);
      if (range && sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else if (doc.caretPositionFromPoint) {
      const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos && sel) {
        const range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length) void addImages(files);
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setStatus('INFORMATION');
    setShowEmojiPicker(false);
    imageFilesRef.current.forEach((_file, url) => URL.revokeObjectURL(url));
    imageFilesRef.current.clear();
    if (editorRef.current) editorRef.current.innerHTML = '';
    setHasContent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const editor = editorRef.current;
    if (!editor) return;
    setSubmitting(true);
    setMessage(null);

    try {
      // Images dans l'ordre du document ; le contenu les référence par `cid:N`
      const orderedImages = Array.from(editor.querySelectorAll('img'))
        .map((img) => ({ src: img.src, file: imageFilesRef.current.get(img.src) }))
        .filter((entry): entry is { src: string; file: File } => entry.file !== undefined);

      let content = serializeNode(editor);
      orderedImages.forEach(({ src }, i) => {
        content = content.replaceAll(`](${src})`, `](cid:${i})`);
      });
      content = content.replace(/\n{3,}/g, '\n\n').trim();

      const formData = new FormData();
      formData.set('title', title);
      formData.set('subtitle', subtitle);
      formData.set('content', content);
      formData.set('status', status);
      orderedImages.forEach(({ file }) => formData.append('images', file));

      const res = await fetch(`${apiUrl}/news/admin`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ text: data.message || t('messages.createFailed'), ok: false });
        return;
      }

      setMessage({ text: t('messages.created'), ok: true });
      resetForm();
      onCreatedAction?.();
    } catch (err) {
      const text = err instanceof Error ? err.message : t('messages.unknownError');
      setMessage({ text, ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h3 className="text-base font-semibold text-white mb-3">{t('title')}</h3>

      {message && (
        <div
          className={`mb-3 text-xs px-3 py-2 rounded-lg border ${
            message.ok
              ? 'bg-primary/10 border-primary/40 text-tertiary'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-fg-muted mb-1.5">Type d&apos;actualité</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  status === opt.value
                    ? `${opt.color} border-current bg-white/5`
                    : 'text-fg-muted border-white/5 hover:text-fg-secondary hover:border-white/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-fg-muted mb-1.5">{t('fields.title')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-fg-subtle focus:outline-none focus:border-primary/60"
            required
            maxLength={120}
            placeholder="Titre de l'actualité"
          />
        </div>

        <div>
          <label className="block text-xs text-fg-muted mb-1.5">{t('fields.subtitle')}</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-fg-subtle focus:outline-none focus:border-primary/60"
            required
            maxLength={180}
            placeholder="Résumé affiché dans le fil"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs text-fg-muted">{t('fields.content')}</label>
            <div className="flex items-center gap-1 relative" ref={emojiPickerWrapperRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="p-1 rounded text-fg-muted hover:text-fg-secondary hover:bg-white/5 transition"
                aria-label="Emoji"
                title="Emoji"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-1 rounded text-fg-muted hover:text-fg-secondary hover:bg-white/5 transition"
                aria-label="Image"
                title="Image"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageInputChange}
                className="hidden"
              />
              {showEmojiPicker && (
                <div className="absolute right-0 top-7 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} />
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              onInput={syncHasContent}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={`w-full bg-black/30 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none min-h-24 whitespace-pre-wrap wrap-break-word transition-colors ${
                dragOver
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-white/10 focus:border-primary/60'
              }`}
            />
            {!hasContent && (
              <div className="absolute top-2 left-3 text-sm text-fg-subtle pointer-events-none">
                Contenu du message...
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-fg-muted">{t('editorHint')}</p>
        </div>

        <button
          type="submit"
          disabled={submitting || !title || !subtitle || !hasContent}
          className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('submitLoading') : t('submit')}
        </button>
      </form>
    </>
  );
}
