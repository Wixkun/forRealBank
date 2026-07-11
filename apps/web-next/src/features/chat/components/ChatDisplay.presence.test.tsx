import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ChatDisplay from './ChatDisplay';

// useChat pilote la présence (onlineUserIds) : on le remplace par un stub
// contrôlé pour tester l'affichage « En ligne / Hors ligne ».
const useChatMock = vi.fn();
vi.mock('@/features/chat/useChat', () => ({
  useChat: (opts: unknown) => useChatMock(opts),
}));

// MessageComposer tire des dépendances lourdes (emoji, uploads) : stub.
vi.mock('@/features/chat/components/MessageComposer', () => ({
  default: () => <div data-testid="composer" />,
  IconPdf: () => null,
}));

function baseChat(onlineUserIds: Set<string>) {
  return {
    messages: [],
    typingUsers: [],
    isConnected: true,
    onlineUserIds,
    sendMessage: vi.fn(),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
  };
}

const conversation = {
  id: 'c1',
  name: 'Alice Advisor',
  type: 'PRIVATE' as const,
  participants: [
    { id: 'me', firstName: 'Me', lastName: 'User' },
    { id: 'advisor1', firstName: 'Alice', lastName: 'Advisor' },
  ],
};

describe('ChatDisplay — présence réelle de l’interlocuteur', () => {
  beforeEach(() => {
    // L'endpoint REST de présence renvoie « hors ligne » par défaut : seule la
    // présence temps réel (onlineUserIds) doit faire basculer « En ligne ».
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ advisor1: false }),
    }) as unknown as typeof fetch;
  });

  it('affiche « En ligne » quand l’interlocuteur est présent', async () => {
    useChatMock.mockReturnValue(baseChat(new Set(['advisor1'])));
    render(<ChatDisplay conversationId="c1" userId="me" conversation={conversation} />);
    expect(await screen.findByText(/display\.online/)).toBeInTheDocument();
    expect(screen.queryByText(/display\.offline/)).not.toBeInTheDocument();
  });

  it('affiche « Hors ligne » quand l’interlocuteur est absent', async () => {
    useChatMock.mockReturnValue(baseChat(new Set()));
    render(<ChatDisplay conversationId="c1" userId="me" conversation={conversation} />);
    expect(await screen.findByText(/display\.offline/)).toBeInTheDocument();
    expect(screen.queryByText(/display\.online/)).not.toBeInTheDocument();
  });
});
