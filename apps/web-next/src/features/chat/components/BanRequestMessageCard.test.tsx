import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BanRequestMessageCard } from './BanRequestMessageCard';
import type { BanRequestCard } from '@/features/users/types';

const acceptMock = vi.fn(async (_id: string) => ({ success: true }));
const rejectMock = vi.fn(async (_id: string, _comment?: string) => ({ success: true }));
vi.mock('@/features/users/api', () => ({
  acceptBanRequest: (id: string) => acceptMock(id),
  rejectBanRequest: (id: string, comment?: string) => rejectMock(id, comment),
}));

function request(overrides: Partial<BanRequestCard> = {}): BanRequestCard {
  return {
    id: 'br-1',
    messageId: 'msg-1',
    status: 'PENDING',
    clientId: 'client-1',
    clientName: 'Jean Dupont',
    advisorName: 'Alice Martin',
    reason: 'Comportement frauduleux',
    decisionComment: null,
    processedAt: null,
    createdAt: new Date().toISOString(),
    canDecide: true,
    ...overrides,
  };
}

beforeEach(() => {
  acceptMock.mockClear();
  rejectMock.mockClear();
});

function renderCard(req: BanRequestCard, onDecided = vi.fn()) {
  render(
    <BanRequestMessageCard
      request={req}
      attachments={[]}
      renderAttachment={() => null}
      isDark
      onDecided={onDecided}
    />,
  );
  return onDecided;
}

describe('BanRequestMessageCard', () => {
  it('affiche les informations de la demande', () => {
    renderCard(request());
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Alice Martin')).toBeInTheDocument();
    expect(screen.getByText('Comportement frauduleux')).toBeInTheDocument();
  });

  it('montre Accepter/Refuser uniquement pour le director assigné (canDecide)', () => {
    renderCard(request({ canDecide: false }));
    expect(screen.queryByRole('button', { name: 'accept' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'reject' })).toBeNull();
  });

  it("l'acceptation appelle l'API avec l'identifiant de la demande", async () => {
    const onDecided = renderCard(request());
    await userEvent.click(screen.getByRole('button', { name: 'accept' }));
    expect(acceptMock).toHaveBeenCalledWith('br-1');
    expect(onDecided).toHaveBeenCalled();
  });

  it('le refus demande un commentaire facultatif puis appelle l’API', async () => {
    const onDecided = renderCard(request());
    await userEvent.click(screen.getByRole('button', { name: 'reject' }));
    await userEvent.type(
      screen.getByPlaceholderText('commentPlaceholder'),
      'Preuves insuffisantes',
    );
    await userEvent.click(screen.getByRole('button', { name: 'confirmReject' }));
    expect(rejectMock).toHaveBeenCalledWith('br-1', 'Preuves insuffisantes');
    expect(onDecided).toHaveBeenCalled();
  });

  it('une demande traitée n’affiche plus de boutons (désactivés visuellement)', () => {
    renderCard(
      request({ status: 'ACCEPTED', canDecide: false, processedAt: new Date().toISOString() }),
    );
    expect(screen.queryByRole('button', { name: 'accept' })).toBeNull();
    expect(screen.getByText('status.ACCEPTED')).toBeInTheDocument();
  });
});
