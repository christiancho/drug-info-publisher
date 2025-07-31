import { describe, test, expect } from 'vitest';
import { sanitizeString } from './sanitizeString';

describe('sanitizeString', () => {
  test('should remove unwanted characters while preserving alphanumeric and punctuation', () => {
    const input = 'Hello! This is a test string with émojis 🚀 and spëcial chars ñ';
    const result = sanitizeString(input);
    
    expect(result).toBe('Hello! This is a test string with émojis and spëcial chars ñ');
    expect(result).not.toContain('🚀');
  });

  test('should remove smart quotes and replace with nothing', () => {
    const input = "This has 'smart' quotes and \"double\" quotes";
    const result = sanitizeString(input);
    
    expect(result).toBe('This has smart quotes and "double" quotes');
    expect(result).not.toContain('\u2018');
    expect(result).not.toContain('\u2019');
  });

  test('should normalize various whitespace characters to regular spaces', () => {
    const input = 'Text\u00A0with\u1680different\u2000types\u200Bof\u202Fwhitespace\u205F\u3000\uFEFF';
    const result = sanitizeString(input);
    
    expect(result).toBe('Text with different types of whitespace');
  });

  test('should collapse multiple spaces into single spaces', () => {
    const input = 'Text    with     multiple      spaces';
    const result = sanitizeString(input);
    
    expect(result).toBe('Text with multiple spaces');
  });

  test('should trim leading and trailing whitespace', () => {
    const input = '   Text with leading and trailing spaces   ';
    const result = sanitizeString(input);
    
    expect(result).toBe('Text with leading and trailing spaces');
  });

  test('should handle empty strings and edge cases', () => {
    expect(sanitizeString('')).toBe('');
    expect(sanitizeString('   ')).toBe('');
    expect(sanitizeString('\t\n\r')).toBe('');
  });

  test('should preserve valid punctuation marks', () => {
    const input = 'Text with punctuation: periods, commas! Question marks? Exclamation marks! Colons: semicolons; parentheses() brackets[] braces{} quotes"quotes"';
    const result = sanitizeString(input);
    
    expect(result).toBe('Text with punctuation: periods, commas! Question marks? Exclamation marks! Colons: semicolons; parentheses() brackets[] braces{} quotes"quotes"');
  });

  test('should handle Unicode characters correctly', () => {
    const input = 'Café naïve résumé piñata';
    const result = sanitizeString(input);
    
    expect(result).toBe('Café naïve résumé piñata');
  });

  test('should remove control characters but preserve newlines in context', () => {
    const input = 'Line 1\nLine 2\tTabbed\rCarriage return';
    const result = sanitizeString(input);
    
    expect(result).toBe('Line 1 Line 2 Tabbed Carriage return');
  });

  test('should handle mixed content with all transformation rules', () => {
    const input = '   This\u00A0is\u2000a \u2018test\u2019\u202F   with    émojis🎉   and\tspecial\rchars!   ';
    const result = sanitizeString(input);
    
    expect(result).toBe('This is a test with émojis and special chars!');
  });

  test('should preserve numbers and alphanumeric combinations', () => {
    const input = 'Product123 costs $45.99 (available 24/7)';
    const result = sanitizeString(input);
    
    expect(result).toBe('Product123 costs $45.99 (available 24/7)');
  });

  test('should handle strings with only unwanted characters', () => {
    const input = '🚀🎉💫⭐';
    const result = sanitizeString(input);
    
    expect(result).toBe('');
  });

  test('should handle complex pharmaceutical text', () => {
    const input = `  Each\u00A0tablet\u2000contains:\n\n• 500mg\tof\ractive\u202Fingredient\n• Store at 15-30°C\n• "Keep\u2019out\u2018of\u201Creach\u201Dof children"  `;
    const result = sanitizeString(input);
    
    expect(result).toBe('Each tablet contains: • 500mg of active ingredient • Store at 15-30°C • "Keep out of reach of children"');
  });

  test('should handle very long strings efficiently', () => {
    const longInput = 'A'.repeat(1000) + '   ' + 'B'.repeat(1000);
    const result = sanitizeString(longInput);
    
    expect(result).toBe('A'.repeat(1000) + ' ' + 'B'.repeat(1000));
    expect(result.length).toBe(2001); // 1000 A's + 1 space + 1000 B's
  });

  test('should handle medical terminology and abbreviations', () => {
    const input = 'Take 2 tablets p.o. b.i.d. (twice daily) with or w/o food. Contraindicated in pts. w/ severe hepatic impairment.';
    const result = sanitizeString(input);
    
    expect(result).toBe('Take 2 tablets p.o. b.i.d. (twice daily) with or w/o food. Contraindicated in pts. w/ severe hepatic impairment.');
  });
});