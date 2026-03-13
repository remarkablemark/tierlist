/**
 * Tests for the escapeHtml utility function.
 */

import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('returns plain text unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('escapes ampersand characters', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes less-than characters', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes greater-than characters', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("It's fine")).toBe('It&#039;s fine');
  });

  it('escapes multiple HTML entities in the same string', () => {
    expect(escapeHtml('<div>"Hello" & \'world\'</div>')).toBe(
      '&lt;div&gt;&quot;Hello&quot; &amp; &#039;world&#039;&lt;/div&gt;',
    );
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles already escaped text', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
