import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar laboratory navigation', () => {
  it('expands Laboratory and selects its subpages', () => {
    const onSelectLaboratoryPage = vi.fn();
    render(
      <Sidebar
        activeModule="dashboard"
        setActiveModule={vi.fn()}
        pendingLabCount={0}
        queueCount={0}
        laboratoryPage="Visits"
        onSelectLaboratoryPage={onSelectLaboratoryPage}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Laboratory/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Specimen' }));

    expect(onSelectLaboratoryPage).toHaveBeenCalledWith('Specimen');
  });
});
