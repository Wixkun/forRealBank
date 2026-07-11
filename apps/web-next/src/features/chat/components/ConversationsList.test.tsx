import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import ConversationsList from './ConversationsList';
import type { Conversation } from '@/features/chat/useConversations';

// La liste appelle useConversations() même quand on lui passe des props :
// on le neutralise pour éviter tout appel réseau.
vi.mock('@/features/chat/useConversations', () => ({
  useConversations: () => ({ conversations: [], isLoading: false }),
}));

const conversations: Conversation[] = [
  {
    id: 'p1',
    name: 'Alice Advisor',
    type: 'PRIVATE',
    unreadCount: 0,
    hasUnread: false,
    isMuted: false,
  },
  { id: 'g1', name: 'Groupe A', type: 'GROUP', unreadCount: 2, hasUnread: true, isMuted: false },
  // Groupe muté MAIS non lu : le badge doit rester (indépendant du mute).
  { id: 'g2', name: 'Groupe B', type: 'GROUP', unreadCount: 1, hasUnread: true, isMuted: true },
];

describe('ConversationsList — badge New & cloche mute', () => {
  it('affiche le badge New (avec compteur) uniquement pour les conversations non lues', () => {
    render(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={vi.fn()}
        conversations={conversations}
        loadingOverride={false}
        onToggleMute={vi.fn()}
      />,
    );
    // g1 : 2 non lus → "list.new · 2"
    expect(screen.getByText('list.new · 2')).toBeInTheDocument();
    // g2 : 1 non lu (et muté) → "list.new" seul, badge quand même présent
    expect(screen.getByText('list.new')).toBeInTheDocument();
    // p1 : 0 non lu → aucun badge supplémentaire (2 badges au total)
    expect(screen.getAllByText(/^list\.new/).length).toBe(2);
  });

  it('affiche la cloche mute uniquement pour les groupes', () => {
    render(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={vi.fn()}
        conversations={conversations}
        loadingOverride={false}
        onToggleMute={vi.fn()}
      />,
    );
    // Une cloche par groupe (g1 activée, g2 mutée) → 2 boutons cloche.
    const bells = screen.getAllByRole('button', { name: /list\.(mute|unmute)Group/ });
    expect(bells.length).toBe(2);
  });

  it('cliquer la cloche déclenche onToggleMute sans ouvrir la conversation', async () => {
    const onToggleMute = vi.fn();
    const onSelectConversation = vi.fn();
    render(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={onSelectConversation}
        conversations={conversations}
        loadingOverride={false}
        onToggleMute={onToggleMute}
      />,
    );
    const muteBell = screen.getByRole('button', { name: 'list.muteGroup' }); // g1 non mutée
    await userEvent.click(muteBell);
    expect(onToggleMute).toHaveBeenCalledWith('g1', false);
    expect(onSelectConversation).not.toHaveBeenCalled();
  });
});
