import { describe, test, expect } from 'vitest';
import { cleanSlug, sanitizeContentKeys } from './sanitize-data';

describe('sanitize-data functions', () => {
  describe('cleanSlug', () => {
    test('should remove the last string and hyphen from slug', () => {
      expect(cleanSlug('emgality-33a147b')).toBe('emgality');
      expect(cleanSlug('advil-pain-reliever-xyz123')).toBe('advil-pain-reliever');
      expect(cleanSlug('simple-drug-abc')).toBe('simple-drug');
    });

    test('should return original slug if no hyphen found', () => {
      expect(cleanSlug('emgality')).toBe('emgality');
      expect(cleanSlug('singledrug')).toBe('singledrug');
      expect(cleanSlug('')).toBe('');
    });

    test('should handle edge cases gracefully', () => {
      expect(cleanSlug(null as any)).toBe(null);
      expect(cleanSlug(undefined as any)).toBe(undefined);
      expect(cleanSlug(123 as any)).toBe(123);
      expect(cleanSlug('-')).toBe('');
      expect(cleanSlug('drug-')).toBe('drug');
      expect(cleanSlug('-suffix')).toBe('');
    });

    test('should handle multiple hyphens correctly', () => {
      expect(cleanSlug('drug-name-with-many-hyphens-suffix')).toBe('drug-name-with-many-hyphens');
      expect(cleanSlug('a-b-c-d-e')).toBe('a-b-c-d');
    });
  });

  describe('sanitizeContentKeys', () => {
    test('should sanitize content fields in simple object', () => {
      const input = {
        name: 'Drug Name',
        content: '  Test content with   extra spaces   ',
        slug: 'drug-name-abc123'
      };

      const result = sanitizeContentKeys(input);
      
      expect(result.name).toBe('Drug Name');
      expect(result.content).toBe('Test content with extra spaces');
      expect(result.slug).toBe('drug-name');
    });

    test('should handle nested objects recursively', () => {
      const input = {
        drug: {
          info: {
            content: '  Nested content  ',
            slug: 'nested-slug-xyz'
          },
          name: 'Test Drug'
        }
      };

      const result = sanitizeContentKeys(input);
      
      expect(result.drug.info.content).toBe('Nested content');
      expect(result.drug.info.slug).toBe('nested-slug');
      expect(result.drug.name).toBe('Test Drug');
    });

    test('should handle arrays correctly', () => {
      const input = [
        { content: '  Content 1  ', slug: 'slug-1-abc' },
        { content: '  Content 2  ', slug: 'slug-2-def' }
      ];

      const result = sanitizeContentKeys(input);
      
      expect(result[0].content).toBe('Content 1');
      expect(result[0].slug).toBe('slug-1');
      expect(result[1].content).toBe('Content 2');
      expect(result[1].slug).toBe('slug-2');
    });

    test('should handle null and undefined values', () => {
      expect(sanitizeContentKeys(null)).toBe(null);
      expect(sanitizeContentKeys(undefined)).toBe(undefined);
      
      const input = {
        content: null,
        slug: undefined,
        normal: 'value'
      };
      
      const result = sanitizeContentKeys(input);
      expect(result.content).toBe(null);
      expect(result.slug).toBe(undefined);
      expect(result.normal).toBe('value');
    });

    test('should only process string values for content and slug', () => {
      const input = {
        content: 123,
        slug: { nested: 'object' },
        normalField: 'value'
      };

      const result = sanitizeContentKeys(input);
      
      expect(result.content).toBe(123);
      expect(result.slug).toEqual({ nested: 'object' });
      expect(result.normalField).toBe('value');
    });

    test('should handle complex nested structures', () => {
      const input = {
        drugs: [
          {
            label: {
              content: '  Drug 1 content  ',
              slug: 'drug-1-hash123'
            },
            metadata: {
              items: [
                { content: '  Item content  ', slug: 'item-slug-abc' }
              ]
            }
          }
        ]
      };

      const result = sanitizeContentKeys(input);
      
      expect(result.drugs[0].label.content).toBe('Drug 1 content');
      expect(result.drugs[0].label.slug).toBe('drug-1');
      expect(result.drugs[0].metadata.items[0].content).toBe('Item content');
      expect(result.drugs[0].metadata.items[0].slug).toBe('item-slug');
    });
  });
});