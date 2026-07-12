'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslations } from 'next-intl';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import { downscaleImage, formatFileSize, MAX_IMAGE_BYTES } from '@/lib/uploads/images';
import { buildMessageContent, type UploadedChatFile } from '@/features/chat/attachments';

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;
const MAX_TEXTAREA_HEIGHT = 160; // ~6 lignes avant scroll interne

interface PendingFile {
  id: string;
  file: File;
  kind: 'image' | 'pdf';
  previewUrl: string | null;
}

export interface MessageComposerHandle {
  addFiles: (files: File[]) => void;
}

interface MessageComposerProps {
  disabled: boolean;
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

function IconSmiley() {
  return (
    <svg
      width="18"
      height="18"
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
  );
}

function IconPaperclip() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

export function IconPdf({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

const MessageComposer = forwardRef<MessageComposerHandle, MessageComposerProps>(
  function MessageComposer({ disabled, onSendMessage, onTypingStart, onTypingStop }, ref) {
    const { theme } = useTheme();
    const t = useTranslations('chat.display');

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiWrapperRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    const [text, setText] = useState('');
    const [pending, setPending] = useState<PendingFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const isDark = theme === 'dark';

    // Auto-resize : hauteur du textarea ajustée au contenu, bornée à
    // MAX_TEXTAREA_HEIGHT (au-delà, scroll interne).
    useLayoutEffect(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const next = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
      el.style.height = `${next}px`;
      el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
    }, [text]);

    // Fermeture du picker emoji au clic extérieur (même pattern que les Actualités)
    useEffect(() => {
      if (!showEmojiPicker) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (!emojiWrapperRef.current?.contains(e.target as Node)) {
          setShowEmojiPicker(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    useEffect(() => {
      return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }, []);

    // Révoque les object URLs restants au démontage
    const pendingRef = useRef<PendingFile[]>([]);
    pendingRef.current = pending;
    useEffect(() => {
      return () => {
        pendingRef.current.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
      };
    }, []);

    const notifyTyping = (value: string) => {
      if (value.trim() && !isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart();
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingStop();
      }, 1000);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      notifyTyping(e.target.value);
    };

    const addFiles = async (files: File[]) => {
      setError(null);
      const additions: PendingFile[] = [];
      for (const file of files) {
        if (pending.length + additions.length >= MAX_FILES) {
          setError(t('composer.errors.tooMany', { count: MAX_FILES }));
          break;
        }
        if (file.type.startsWith('image/')) {
          const resized = await downscaleImage(file);
          if (resized.size > MAX_IMAGE_BYTES) {
            setError(t('composer.errors.imageTooLarge'));
            continue;
          }
          additions.push({
            id: crypto.randomUUID(),
            file: resized,
            kind: 'image',
            previewUrl: URL.createObjectURL(resized),
          });
        } else if (file.type === 'application/pdf') {
          if (file.size > MAX_PDF_BYTES) {
            setError(t('composer.errors.fileTooLarge'));
            continue;
          }
          additions.push({ id: crypto.randomUUID(), file, kind: 'pdf', previewUrl: null });
        } else {
          setError(t('composer.errors.invalidType'));
        }
      }
      if (additions.length) setPending((prev) => [...prev, ...additions]);
    };

    useImperativeHandle(ref, () => ({
      addFiles: (files: File[]) => {
        void addFiles(files);
      },
    }));

    const removePending = (id: string) => {
      setPending((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) void addFiles(files);
      e.target.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) {
        e.preventDefault();
        void addFiles(files);
      }
    };

    const insertEmoji = (emojiData: EmojiClickData) => {
      const emoji = emojiData.emoji;
      const el = textareaRef.current;
      const start = el?.selectionStart ?? text.length;
      const end = el?.selectionEnd ?? start;
      setText(text.slice(0, start) + emoji + text.slice(end));
      requestAnimationFrame(() => {
        if (!el) return;
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange(pos, pos);
      });
    };

    const canSend = (text.trim().length > 0 || pending.length > 0) && !sending && !disabled;

    const handleSend = async () => {
      if (!canSend) return;
      setSending(true);
      setError(null);
      try {
        let uploaded: UploadedChatFile[] = [];
        if (pending.length > 0) {
          const formData = new FormData();
          pending.forEach((p) => formData.append('files', p.file, p.file.name));
          const res = await fetch('/api/chat/uploads', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          if (!res.ok) throw new Error('UPLOAD_FAILED');
          const data = await res.json();
          uploaded = Array.isArray(data) ? (data as UploadedChatFile[]) : [];
        }
        onSendMessage(buildMessageContent(text, uploaded));
        pending.forEach((p) => {
          if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
        });
        setPending([]);
        setText('');
        setShowEmojiPicker(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        isTypingRef.current = false;
        onTypingStop();
        textareaRef.current?.focus();
      } catch {
        setError(t('composer.errors.uploadFailed'));
      } finally {
        setSending(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    };

    const toolButtonClass = `p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      isDark
        ? 'text-fg-muted hover:text-fg-secondary hover:bg-hover'
        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
    }`;

    return (
      <div
        className={`px-6 py-4 border-t ${
          isDark ? 'border-edge bg-surface-1' : 'border-gray-200 bg-white'
        }`}
      >
        {error && (
          <div className="mb-2 text-xs px-3 py-2 rounded-lg border bg-red-500/10 border-red-500/30 text-danger">
            {error}
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pending.map((p) =>
              p.kind === 'image' && p.previewUrl ? (
                <div key={p.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.previewUrl}
                    alt={p.file.name}
                    className={`h-16 w-16 object-cover rounded-lg border ${
                      isDark ? 'border-edge-strong' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removePending(p.id)}
                    aria-label={t('composer.removeAttachment')}
                    title={t('composer.removeAttachment')}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-3 text-fg-secondary border border-edge-strong flex items-center justify-center text-xs leading-none hover:bg-red-500 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  key={p.id}
                  className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    isDark
                      ? 'border-edge-strong bg-surface-2 text-fg-secondary'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-danger shrink-0">
                    <IconPdf size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-40">{p.file.name}</p>
                    <p className={`text-xs ${isDark ? 'text-fg-subtle' : 'text-gray-400'}`}>
                      {formatFileSize(p.file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePending(p.id)}
                    aria-label={t('composer.removeAttachment')}
                    title={t('composer.removeAttachment')}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-surface-3 text-fg-secondary border border-edge-strong flex items-center justify-center text-xs leading-none hover:bg-red-500 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        <div
          className={`flex items-end gap-1.5 rounded-xl border px-2 py-1.5 transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 ${
            isDark ? 'border-edge-strong bg-surface-2' : 'border-gray-300 bg-white'
          }`}
        >
          <div className="relative" ref={emojiWrapperRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              disabled={sending}
              aria-label={t('composer.emojiButton')}
              title={t('composer.emojiButton')}
              className={toolButtonClass}
            >
              <IconSmiley />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-11 left-0 z-50 shadow-xl rounded-lg overflow-hidden">
                <EmojiPicker
                  onEmojiClick={insertEmoji}
                  theme={isDark ? Theme.DARK : Theme.LIGHT}
                  width={320}
                  height={380}
                  skinTonesDisabled
                  lazyLoadEmojis
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            aria-label={t('composer.attachButton')}
            title={t('composer.attachButton')}
            className={toolButtonClass}
          >
            <IconPaperclip />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            placeholder={t('input.placeholder')}
            aria-label={t('input.placeholder')}
            disabled={sending}
            className={`flex-1 resize-none bg-transparent px-2 py-2 text-sm focus:outline-none scrollbar-slim min-h-9 disabled:opacity-60 ${
              isDark ? 'text-fg placeholder:text-fg-subtle' : 'text-gray-900'
            }`}
          />

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="shrink-0 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2"
          >
            {sending && (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {sending ? t('composer.sending') : t('send')}
          </button>
        </div>

        <p className={`mt-1.5 text-xs ${isDark ? 'text-fg-subtle' : 'text-gray-400'}`}>
          {t('composer.hint')}
        </p>
      </div>
    );
  },
);

export default MessageComposer;
