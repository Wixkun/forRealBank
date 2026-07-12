'use client';

// Petit bus d'événements navigateur pour synchroniser des composants découplés
// (liste des conversations, centre de notifications) sans store global, quand
// une conversation est lue, qu'un groupe est créé ou que des notifications
// ont été marquées lues côté serveur (ex. détail d'une news consulté).

export type ChatEvent = 'chat:read' | 'chat:conversations-changed' | 'notifications:read';

export function emitChatEvent(event: ChatEvent, detail?: unknown): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

export function onChatEvent(event: ChatEvent, handler: (detail: unknown) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const listener = (e: Event) => handler((e as CustomEvent).detail);
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}
