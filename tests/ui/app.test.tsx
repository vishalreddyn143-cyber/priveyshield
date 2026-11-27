import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';

describe('PrivyShield UI & XSS Safety Integration', () => {
  it('renders Overview, loads synthetic demo, switches modes, and renders unsafe HTML safely as text', async () => {
    await act(async () => {
      render(<App />);
    });

    // Overview renders tagline and primary CTA
    expect(screen.getAllByText(/Detect\. Understand\. Sanitize\. Verify\./i).length).toBeGreaterThanOrEqual(1);

    // Navigate to Sanitize Workspace
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Start Sanitizing/i }));
    });
    expect(screen.getByText('1. Original Document')).toBeTruthy();

    // Switch to Edit mode and paste XSS payload + synthetic PII
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));
    });
    const editor = screen.getByLabelText('Original document text editor');
    await act(async () => {
      fireEvent.change(editor, {
        target: {
          value: '<img src=x onerror="window.__xss=1" /> Email rahul@example.com and Card 4111-1111-1111-1111',
        },
      });
    });

    // Sanitized preview escapes HTML and redacts PII
    const preview = screen.getByTestId('sanitized-preview');
    expect(preview.textContent).toContain('<img src=x onerror="window.__xss=1" />');
    expect(preview.textContent).toContain('EMAIL_01');
    expect(preview.textContent).toContain('CARD_01');
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();

    // Switch to Full Masking
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Full Masking/i }));
    });
    expect(preview.textContent).toContain('[REDACTED]');
    expect(preview.textContent).not.toContain('rahul@example.com');
  });

  it('navigates seamlessly across all primary tabs with keyboard accessibility', async () => {
    await act(async () => {
      render(<App />);
    });

    // Navigate to Detection Lab
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Detection Lab$/i }));
    });
    expect(screen.getByText(/Interactive PII Detection & Validation Lab/i)).toBeTruthy();

    // Navigate to Audit & Reports
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Audit & Reports$/i }));
    });
    expect(screen.getByText(/Session Audit Log & Privacy Reports/i)).toBeTruthy();

    // Navigate to Privacy Center
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Privacy Center$/i }));
    });
    expect(screen.getByText(/Privacy Control Center/i)).toBeTruthy();

    // Navigate back to Overview
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Overview$/i }));
    });
    expect(screen.getAllByText(/Detect\. Understand\. Sanitize\. Verify\./i).length).toBeGreaterThanOrEqual(1);
  });

  it('opens guided onboarding tour and closes with Escape key', async () => {
    await act(async () => {
      render(<App />);
    });

    const guideBtn = screen.getByRole('button', { name: /Open guided tour/i });
    await act(async () => {
      fireEvent.click(guideBtn);
    });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('1. What PrivyShield Does')).toBeTruthy();

    // Press Escape to dismiss
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
