import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BeneficiariesPanel } from './BeneficiariesPanel';
import type { Beneficiary } from '@/features/transfer/api';

const beneficiaries: Beneficiary[] = [
  {
    id: 'b1',
    label: 'Jean Dupont',
    iban: 'FR1420041010050500013M02606',
    createdAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'b2',
    label: 'Marie Curie',
    iban: 'DE89370400440532013000',
    createdAt: '2026-07-02T00:00:00Z',
  },
];

const fetchBeneficiariesMock = vi.fn();

vi.mock('@/features/transfer/api', () => ({
  fetchBeneficiaries: (...args: unknown[]) => fetchBeneficiariesMock(...args),
  createBeneficiary: vi.fn(),
  updateBeneficiary: vi.fn(),
  deleteBeneficiary: vi.fn(),
}));

beforeEach(() => {
  fetchBeneficiariesMock.mockReset();
});

describe('BeneficiariesPanel', () => {
  it('affiche la liste avec IBAN masqué et remonte la sélection', async () => {
    fetchBeneficiariesMock.mockResolvedValue(beneficiaries);
    const onSelect = vi.fn();

    render(<BeneficiariesPanel selectedIban="" onSelectAction={onSelect} />);

    expect(await screen.findByText('Jean Dupont')).toBeInTheDocument();
    // IBAN partiellement masqué : début + fin visibles, jamais l'IBAN complet.
    expect(screen.getByText('FR14 •••• •••• •••• •••• •••• 2606')).toBeInTheDocument();
    expect(screen.queryByText('FR1420041010050500013M02606')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Jean Dupont'));
    expect(onSelect).toHaveBeenCalledWith(beneficiaries[0]);
  });

  it('met en évidence le bénéficiaire dont l’IBAN est dans le formulaire', async () => {
    fetchBeneficiariesMock.mockResolvedValue(beneficiaries);

    render(<BeneficiariesPanel selectedIban={beneficiaries[1].iban} onSelectAction={vi.fn()} />);

    await screen.findByText('Marie Curie');
    const buttons = screen.getAllByRole('button', { pressed: true });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Marie Curie');
  });

  it('affiche l’état vide quand aucun bénéficiaire n’existe', async () => {
    fetchBeneficiariesMock.mockResolvedValue([]);

    render(<BeneficiariesPanel selectedIban="" onSelectAction={vi.fn()} />);

    expect(await screen.findByText('empty')).toBeInTheDocument();
  });

  it('filtre la liste par libellé ou IBAN via la barre de recherche', async () => {
    fetchBeneficiariesMock.mockResolvedValue(beneficiaries);

    render(<BeneficiariesPanel selectedIban="" onSelectAction={vi.fn()} />);
    await screen.findByText('Jean Dupont');

    const search = screen.getByRole('searchbox');
    await userEvent.type(search, 'marie');
    expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument();
    expect(screen.getByText('Marie Curie')).toBeInTheDocument();

    // Recherche par IBAN, avec espaces, insensible à la casse.
    await userEvent.clear(search);
    await userEvent.type(search, 'fr14 2004');
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.queryByText('Marie Curie')).not.toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(screen.getByText('searchNoResults')).toBeInTheDocument();
  });

  it('ouvre la modal d’édition (libellé seul, IBAN masqué) via le crayon', async () => {
    fetchBeneficiariesMock.mockResolvedValue([beneficiaries[0]]);
    const onSelect = vi.fn();

    render(<BeneficiariesPanel selectedIban="" onSelectAction={onSelect} />);
    await screen.findByText('Jean Dupont');

    await userEvent.click(screen.getByRole('button', { name: /editAria/ }));

    // La modal s'ouvre sans déclencher la sélection du bénéficiaire.
    expect(onSelect).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('title');
    // Le libellé est éditable, l'IBAN n'est affiché que masqué.
    expect(screen.getByDisplayValue('Jean Dupont')).toBeInTheDocument();
    expect(dialog).toHaveTextContent('FR14 •••• •••• •••• •••• •••• 2606');
  });
});
