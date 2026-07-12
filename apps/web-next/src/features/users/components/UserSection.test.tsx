import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserSection } from './UserSection';
import type { DirectoryUser } from '@/features/users/types';

const fetchDirectoryMock = vi.fn();
vi.mock('@/features/users/api', () => ({
  fetchDirectory: (role: string, search?: string) => fetchDirectoryMock(role, search),
}));

function user(id: string, firstName: string, lastName: string): DirectoryUser {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}@forreal.bank`,
    isBanned: false,
    lastSeenAt: null,
    createdAt: new Date().toISOString(),
  };
}

beforeEach(() => {
  fetchDirectoryMock.mockReset();
  fetchDirectoryMock.mockResolvedValue([
    user('u1', 'Alice', 'Martin'),
    user('u2', 'Bob', 'Client'),
  ]);
});

describe('UserSection', () => {
  it('affiche le titre, le compteur et la liste', async () => {
    render(<UserSection role="CLIENT" title="Mes clients" online={{}} onOpenUser={vi.fn()} />);
    expect(screen.getByText('Mes clients')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Alice Martin')).toBeInTheDocument());
    expect(screen.getByText('Bob Client')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // Le périmètre est demandé au serveur pour le bon rôle.
    expect(fetchDirectoryMock).toHaveBeenCalledWith('CLIENT', '');
  });

  it('déclenche une recherche serveur debouncée', async () => {
    render(<UserSection role="ADVISOR" title="Advisors" online={{}} onOpenUser={vi.fn()} />);
    await waitFor(() => expect(fetchDirectoryMock).toHaveBeenCalled());

    const input = screen.getByPlaceholderText('searchPlaceholder');
    await userEvent.type(input, 'ali');
    await waitFor(() => expect(fetchDirectoryMock).toHaveBeenCalledWith('ADVISOR', 'ali'), {
      timeout: 2000,
    });
  });

  it('ouvre la fiche au clic sur un utilisateur', async () => {
    const onOpenUser = vi.fn();
    render(<UserSection role="CLIENT" title="Clients" online={{}} onOpenUser={onOpenUser} />);
    await waitFor(() => expect(screen.getByText('Alice Martin')).toBeInTheDocument());
    await userEvent.click(screen.getByText('Alice Martin'));
    expect(onOpenUser).toHaveBeenCalledWith('u1');
  });

  it("affiche l'état vide et l'état d'erreur", async () => {
    fetchDirectoryMock.mockResolvedValueOnce([]);
    const { unmount } = render(
      <UserSection role="CLIENT" title="Clients" online={{}} onOpenUser={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('empty')).toBeInTheDocument());
    unmount();

    fetchDirectoryMock.mockRejectedValueOnce(new Error('boom'));
    render(<UserSection role="CLIENT" title="Clients" online={{}} onOpenUser={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('loadError')).toBeInTheDocument());
  });
});
