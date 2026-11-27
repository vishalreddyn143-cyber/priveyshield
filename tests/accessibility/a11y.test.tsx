import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { ErrorBoundary } from '../../src/components/common/ErrorBoundary';

const FaultyComponent = () => {
  throw new Error('Test crash for ErrorBoundary verification');
};

describe('PrivyShield Accessibility (a11y) & Resilience', () => {
  it('provides a skip-to-main-content link pointing to #main-content', async () => {
    await act(async () => {
      render(<App />);
    });

    const skipLink = screen.getByRole('link', { name: /Skip to main content/i });
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute('href')).toBe('#main-content');

    const mainEl = screen.getByRole('main');
    expect(mainEl.id).toBe('main-content');
    expect(mainEl.getAttribute('tabIndex')).toBe('-1');
  });

  it('contains an aria-live="polite" status announcer for screen readers', async () => {
    await act(async () => {
      render(<App />);
    });

    const liveRegion = screen.getByTestId('a11y-announcer');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion.getAttribute('role')).toBe('status');
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  it('ErrorBoundary gracefully renders accessible fallback when an error occurs', () => {
    // Suppress console.error in test log for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <FaultyComponent />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.getByText(/PrivyShield Shield Guard/i)).toBeTruthy();
    expect(screen.getByText(/Test crash for ErrorBoundary verification/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reload Workspace Safely/i })).toBeTruthy();

    spy.mockRestore();
  });

  it('TooltipBadge manages aria-expanded, tooltip role, and Escape key dismissal', async () => {
    const { TooltipBadge } = await import('../../src/components/common/TooltipBadge');
    const { fireEvent } = await import('@testing-library/react');

    render(<TooltipBadge term="Luhn" label="Luhn Algorithm" />);

    const trigger = screen.getByRole('button', { name: /Explain Luhn/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // Click to open
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain('Luhn');

    // Press Escape to dismiss
    fireEvent.keyDown(trigger, { key: 'Escape', code: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
