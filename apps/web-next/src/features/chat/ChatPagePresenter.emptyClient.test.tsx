import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import ChatPagePresenter from './ChatPagePresenter';
import type { Conversation } from '@/features/chat/useConversations';

// Enfants lourds neutralisés : on teste uniquement l'état vide côté client.
vi.mock('@/features/chat/components/ChatDisplay', () => ({
  default: () => <div data-testid="chat-display" />,
}));
vi.mock('@/features/chat/components/UserDirectoryPanel', () => ({
  default: () => <div data-testid="directory" />,
}));
vi.mock('@/features/chat/useConversations', () => ({
  useConversations: () => ({ conversations: [], isLoading: false }),
}));

const advisor = { id: 'alice', firstName: 'Alice', lastName: 'Advisor' };

function baseProps() {
  return {
    isLoading: false,
    user: { id: 'bob', firstName: 'Bob', lastName: 'Client', roles: ['CLIENT'] },
    conversations: [] as Conversation[],
    conversationId: '',
    onSelectConversation: vi.fn(),
    onOpenContact: vi.fn(),
    isOpeningContact: false,
    isClient: true,
    clientAdvisor: advisor as typeof advisor | null,
    isAdvisorLoading: false,
    onToggleMute: vi.fn(),
    onHideConversation: vi.fn(),
    showDirectory: false,
    canCreateGroup: false,
    groupCandidates: [],
    isGroupModalOpen: false,
    onOpenGroupModal: vi.fn(),
    onCloseGroupModal: vi.fn(),
    onCreateGroup: vi.fn(async () => {}),
  };
}

describe('ChatPagePresenter — état vide client « Contacter mon conseiller »', () => {
  it('affiche le bouton et ouvre la conversation avec le conseiller au clic', async () => {
    const props = baseProps();
    render(<ChatPagePresenter {...props} />);

    const button = screen.getByRole('button', { name: 'emptyClient.contactAdvisor' });
    await userEvent.click(button);
    expect(props.onOpenContact).toHaveBeenCalledWith('alice');
  });

  it('désactive le bouton pendant l’ouverture (pas de doublon au double clic)', () => {
    const props = { ...baseProps(), isOpeningContact: true };
    render(<ChatPagePresenter {...props} />);

    expect(screen.getByRole('button', { name: 'emptyClient.opening' })).toBeDisabled();
  });

  it('affiche un message explicite (sans erreur) quand aucun conseiller n’est attribué', () => {
    const props = { ...baseProps(), clientAdvisor: null };
    render(<ChatPagePresenter {...props} />);

    expect(screen.getByText('emptyClient.noAdvisor')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'emptyClient.contactAdvisor' })).toBeNull();
  });

  it("n'affiche rien de tout cela pour un non-client", () => {
    const props = { ...baseProps(), isClient: false, clientAdvisor: null };
    render(<ChatPagePresenter {...props} />);

    expect(screen.queryByRole('button', { name: 'emptyClient.contactAdvisor' })).toBeNull();
    expect(screen.queryByText('emptyClient.noAdvisor')).toBeNull();
  });

  it("n'affiche pas le bouton quand une conversation existe déjà", () => {
    const props = {
      ...baseProps(),
      conversations: [{ id: 'c1', name: 'Alice Advisor', type: 'PRIVATE' } as Conversation],
    };
    render(<ChatPagePresenter {...props} />);

    expect(screen.queryByRole('button', { name: 'emptyClient.contactAdvisor' })).toBeNull();
  });
});
