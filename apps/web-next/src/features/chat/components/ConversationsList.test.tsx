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

describe('ConversationsList — masquer une conversation', () => {
  it('affiche une action Masquer par conversation, qui ne sélectionne pas la conversation', async () => {
    const onHideConversation = vi.fn();
    const onSelectConversation = vi.fn();
    render(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={onSelectConversation}
        conversations={conversations}
        loadingOverride={false}
        onHideConversation={onHideConversation}
      />,
    );
    const hideButtons = screen.getAllByRole('button', { name: 'list.hideConversation' });
    // Une action Masquer pour chaque conversation (privées ET groupes).
    expect(hideButtons.length).toBe(conversations.length);
    await userEvent.click(hideButtons[0]);
    expect(onHideConversation).toHaveBeenCalledWith('p1');
    expect(onSelectConversation).not.toHaveBeenCalled();
  });
});

describe('ConversationsList — création de groupe & recherche', () => {
  it("montre l'icône de création de groupe uniquement quand autorisé", () => {
    const onCreateGroup = vi.fn();
    const { rerender } = render(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={vi.fn()}
        conversations={conversations}
        loadingOverride={false}
        canCreateGroup
        onCreateGroup={onCreateGroup}
      />,
    );
    expect(screen.getByRole('button', { name: 'list.createGroupTooltip' })).toBeInTheDocument();

    rerender(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={vi.fn()}
        conversations={conversations}
        loadingOverride={false}
        canCreateGroup={false}
        onCreateGroup={onCreateGroup}
      />,
    );
    expect(screen.queryByRole('button', { name: 'list.createGroupTooltip' })).toBeNull();
  });

  it("l'icône ouvre le flux de création de groupe existant", async () => {
    const onCreateGroup = vi.fn();
    render(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={vi.fn()}
        conversations={conversations}
        loadingOverride={false}
        canCreateGroup
        onCreateGroup={onCreateGroup}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'list.createGroupTooltip' }));
    expect(onCreateGroup).toHaveBeenCalledTimes(1);
  });

  it('filtre les conversations par nom, insensible à la casse et aux espaces', async () => {
    render(
      <ConversationsList
        selectedConversationId=""
        onSelectConversation={vi.fn()}
        conversations={conversations}
        loadingOverride={false}
      />,
    );
    const input = screen.getByPlaceholderText('list.searchPlaceholder');
    await userEvent.type(input, '  ALICE ');
    expect(screen.getByText('Alice Advisor')).toBeInTheDocument();
    expect(screen.queryByText('Groupe A')).toBeNull();
    expect(screen.queryByText('Groupe B')).toBeNull();
  });
});
