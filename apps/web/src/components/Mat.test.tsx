import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Mat } from './Mat';

describe('Mat', () => {
  it('lays what it holds on the mat, its four corner ornaments hidden from screen readers', () => {
    const { container } = render(
      <Mat>
        <p>Pli</p>
      </Mat>,
    );
    expect(screen.getByText('Pli')).toBeTruthy();
    const corners = container.querySelectorAll('svg[data-corner]');
    expect([...corners].map((svg) => svg.getAttribute('data-corner'))).toEqual([
      'topLeft',
      'topRight',
      'bottomRight',
      'bottomLeft',
    ]);
    corners.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
  });
});
