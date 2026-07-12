import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UserDirectoryPanel from './UserDirectoryPanel';

// L'annuaire et la présence sont résolus côté serveur : on les neutralise ici
// (les règles de filtrage par rôle sont testées côté backend).
const useContactsMock = vi.fn();
const usePresenceMock = vi.fn();
vi.mock('@/features/chat/hooks', () => ({
  useContacts: (search: string) => useContactsMock(search),
  usePresence: (ids: string[]) => usePresenceMock(ids),
}));

const contacts = [
  { id: 'bob', firstName: 'Bob', lastName: 'Client', role: 'CLIENT' },
  { id: 'alice', firstName: 'Alice', lastName: 'Advisor', role: 'ADVISOR' },
];

beforeEach(() => {
  useContactsMock.mockReturnValue({ contacts, isLoading: false, error: null });
  usePresenceMock.mockReturnValue({ bob: true });
});

describe('UserDirectoryPanel', () => {
  it('liste les interlocuteurs avec nom, rôle et statut de présence', () => {
    render(<UserDirectoryPanel onOpenContact={vi.fn()} isOpening={false} />);
    expect(screen.getByText('Bob Client')).toBeInTheDocument();
    expect(screen.getByText('Alice Advisor')).toBeInTheDocument();
    // bob en ligne, alice hors ligne (présence issue du backend). Le mock
    // next-intl renvoie la clé sans namespace : "CLIENT · online".
    expect(screen.getByText(/CLIENT · online/)).toBeInTheDocument();
    expect(screen.getByText(/ADVISOR · offline/)).toBeInTheDocument();
  });

  it('ouvre la conversation privée au clic sur la ligne entière', async () => {
    const onOpenContact = vi.fn();
    render(<UserDirectoryPanel onOpenContact={onOpenContact} isOpening={false} />);
    await userEvent.click(screen.getByText('Bob Client'));
    expect(onOpenContact).toHaveBeenCalledWith('bob');
  });

  it('désactive les lignes pendant une ouverture (double clic neutralisé)', async () => {
    const onOpenContact = vi.fn();
    render(<UserDirectoryPanel onOpenContact={onOpenContact} isOpening />);
    const row = screen.getByText('Bob Client').closest('button');
    expect(row).toBeDisabled();
  });

  it('transmet la saisie de recherche (debounce côté hook, filtrage côté serveur)', async () => {
    render(<UserDirectoryPanel onOpenContact={vi.fn()} isOpening={false} />);
    const input = screen.getByPlaceholderText('searchPlaceholder');
    await userEvent.type(input, 'ali');
    expect(useContactsMock).toHaveBeenLastCalledWith('ali');
  });

  it('affiche les états vides distincts (aucun contact / recherche sans résultat)', async () => {
    useContactsMock.mockReturnValue({ contacts: [], isLoading: false, error: null });
    render(<UserDirectoryPanel onOpenContact={vi.fn()} isOpening={false} />);
    expect(screen.getByText('empty')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('searchPlaceholder');
    await userEvent.type(input, 'zzz');
    expect(screen.getByText('emptySearch')).toBeInTheDocument();
  });

  it("affiche l'erreur réseau", () => {
    useContactsMock.mockReturnValue({ contacts: [], isLoading: false, error: 'HTTP 500' });
    render(<UserDirectoryPanel onOpenContact={vi.fn()} isOpening={false} />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});
