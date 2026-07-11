import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import NewGroupModal from './NewGroupModal';

const candidates = [
  { id: 'u1', firstName: 'Bob', lastName: 'Client' },
  { id: 'u2', firstName: 'Carol', lastName: 'Client' },
  { id: 'u3', firstName: 'Dan', lastName: 'Client' },
];

describe('NewGroupModal', () => {
  it('ne rend rien quand open=false', () => {
    const { container } = render(
      <NewGroupModal open={false} candidates={candidates} onClose={vi.fn()} onCreate={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  // NB : le mock next-intl renvoie la clé brute passée à `t(...)` (sans le
  // namespace), d'où « submit », « nameLabel », « remove … » ci-dessous.
  it('désactive la création tant que nom + 2 participants ne sont pas fournis', async () => {
    render(<NewGroupModal open candidates={candidates} onClose={vi.fn()} onCreate={vi.fn()} />);
    const submit = screen.getByRole('button', { name: 'submit' });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText('nameLabel'), 'Mon groupe');
    expect(submit).toBeDisabled(); // toujours 0 participant

    await userEvent.click(screen.getByRole('button', { name: 'Bob Client' }));
    expect(submit).toBeDisabled(); // 1 seul participant

    await userEvent.click(screen.getByRole('button', { name: 'Carol Client' }));
    expect(submit).toBeEnabled(); // nom + 2 participants
  });

  it('crée le groupe avec le nom et les participants sélectionnés', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<NewGroupModal open candidates={candidates} onClose={vi.fn()} onCreate={onCreate} />);

    await userEvent.type(screen.getByLabelText('nameLabel'), 'Suivi client');
    await userEvent.click(screen.getByRole('button', { name: 'Bob Client' }));
    await userEvent.click(screen.getByRole('button', { name: 'Carol Client' }));
    await userEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(onCreate).toHaveBeenCalledWith('Suivi client', ['u1', 'u2']);
  });

  it('permet de retirer un participant sélectionné', async () => {
    render(<NewGroupModal open candidates={candidates} onClose={vi.fn()} onCreate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Bob Client' }));
    // Un chip retirable apparaît (aria-label « remove Bob Client »).
    const removeBtn = screen.getByRole('button', { name: 'remove Bob Client' });
    await userEvent.click(removeBtn);
    // Bob redevient sélectionnable dans la liste.
    expect(screen.getByRole('button', { name: 'Bob Client' })).toBeInTheDocument();
  });
});
