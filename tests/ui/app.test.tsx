import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';

describe('PrivyShield UI & XSS Safety Integration', () => {
  it('renders Overview, loads synthetic demo, switches modes, and renders unsafe HTML safely as text', () => {
    render(<App />);

    // Overview renders tagline and primary CTA
    expect(screen.getAllByText(/Detect\. Understand\. Sanitize\. Verify\./i).length).toBeGreaterThanOrEqual(1);

    // Navigate to Sanitize Workspace
    fireEvent.click(screen.getByRole('button', { name: /Start Sanitizing/i }));
    expect(screen.getByText('1. Original Document')).toBeTruthy();

    // Switch to Edit mode and paste XSS payload + synthetic PII
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }));
    const editor = screen.getByLabelText('Original document text editor');
    fireEvent.change(editor, {
      target: {
        value: '<img src=x onerror="window.__xss=1" /> Email rahul@example.com and Card 4111-1111-1111-1111',
      },
    });

    // Sanitized preview escapes HTML and redacts PII
    const preview = screen.getByTestId('sanitized-preview');
    expect(preview.textContent).toContain('<img src=x onerror="window.__xss=1" />');
    expect(preview.textContent).toContain('EMAIL_01');
    expect(preview.textContent).toContain('CARD_01');
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();

    // Switch to Full Masking
    fireEvent.click(screen.getByRole('button', { name: /Full Masking/i }));
    expect(preview.textContent).toContain('[REDACTED]');
    expect(preview.textContent).not.toContain('rahul@example.com');
  });
});
