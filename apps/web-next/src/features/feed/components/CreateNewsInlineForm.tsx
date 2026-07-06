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

type Props = {
  apiUrl?: string;
  onCreatedAction?: () => void;
};

export function CreateNewsInlineForm({ apiUrl = '/api', onCreatedAction }: Props) {
  const t = useTranslations('feed.create');

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerWrapperRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<NewsStatus>('INFORMATION');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const resizeContent = () => {
    const el = contentRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const el = contentRef.current;
    if (!el) {
      setContent((prev) => prev + emojiData.emoji);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emojiData.emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + emojiData.emoji.length;
      el.setSelectionRange(cursor, cursor);
      resizeContent();
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ text: t('messages.invalidImageType'), ok: false });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage({ text: t('messages.imageTooLarge'), ok: false });
      e.target.value = '';
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set('title', title);
      formData.set('content', content);
      formData.set('status', status);
      if (image) formData.set('image', image);

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
      setTitle('');
      setContent('');
      setStatus('INFORMATION');
      handleRemoveImage();
      setShowEmojiPicker(false);
      if (contentRef.current) contentRef.current.style.height = 'auto';
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
      <h3 className="text-sm font-semibold text-white mb-3">{t('title')}</h3>

      {message && (
        <div
          className={`mb-3 text-xs px-3 py-2 rounded-lg border ${
            message.ok
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] text-gray-500 mb-1.5">Type d&apos;actualité</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  status === opt.value
                    ? `${opt.color} border-current bg-white/5`
                    : 'text-gray-600 border-white/5 hover:text-gray-400 hover:border-white/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-gray-500 mb-1.5">{t('fields.title')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50"
            required
            maxLength={120}
            placeholder="Titre de l'actualité"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] text-gray-500">{t('fields.content')}</label>
            <div className="flex items-center gap-1 relative" ref={emojiPickerWrapperRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker((v) => !v)}
                className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
                aria-label="Emoji"
                title="Emoji"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-white/5 transition"
                aria-label="Image"
                title="Image"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {showEmojiPicker && (
                <div className="absolute right-0 top-7 z-50">
                  <EmojiPicker onEmojiClick={handleEmojiClick} theme={Theme.DARK} />
                </div>
              )}
            </div>
          </div>
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              resizeContent();
            }}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50 min-h-20 resize-none overflow-hidden"
            required
            maxLength={2000}
            placeholder="Contenu du message..."
          />
        </div>

        {imagePreview && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="" className="max-h-40 rounded-lg border border-white/10" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-900 border border-white/20 text-gray-300 hover:text-white flex items-center justify-center text-xs leading-none"
              aria-label="Retirer l'image"
            >
              ✕
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !title || !content}
          className="px-4 py-2 rounded-lg bg-teal-500 text-gray-900 text-xs font-semibold hover:bg-teal-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t('submitLoading') : t('submit')}
        </button>
      </form>
    </>
  );
}
