/**
 * Tests for the escapeHtml utility function.
 */

import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('should return plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('should escape ampersand characters', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape less-than characters', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('should escape greater-than characters', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("It's fine")).toBe('It&#039;s fine');
  });

  it('should escape multiple HTML entities in the same string', () => {
    expect(escapeHtml('<div>"Hello" & \'world\'</div>')).toBe(
      '&lt;div&gt;&quot;Hello&quot; &amp; &#039;world&#039;&lt;/div&gt;',
    );
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should handle already escaped text', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
