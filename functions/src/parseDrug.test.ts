import { describe, test, expect } from 'vitest';
import { parseDrug } from './parseDrug';

describe('parseDrug', () => {
  test('should parse HTML strings to JSON structure', () => {
    const input = {
      name: 'Test Drug',
      description: '<p>This is a <strong>test</strong> description</p>',
      plainText: 'This is plain text'
    };

    const result = parseDrug(input);

    expect(result.name).toBe('Test Drug');
    expect(result.plainText).toBe('This is plain text');
    expect(Array.isArray(result.description)).toBe(true);
    expect(result.description[0].tagName).toBe('p');
    expect(result.description[0].children).toBeDefined();
  });

  test('should handle nested objects recursively', () => {
    const input = {
      drug: {
        info: {
          label: '<div>Label content</div>',
          name: 'Drug Name'
        },
        dosage: '<span>100mg</span>'
      }
    };

    const result = parseDrug(input);

    expect(result.drug.info.name).toBe('Drug Name');
    expect(Array.isArray(result.drug.info.label)).toBe(true);
    expect(result.drug.info.label[0].tagName).toBe('div');
    expect(Array.isArray(result.drug.dosage)).toBe(true);
    expect(result.drug.dosage[0].tagName).toBe('span');
  });

  test('should handle arrays by mapping over each element', () => {
    const input = [
      { name: 'Drug 1', html: '<p>Description 1</p>' },
      { name: 'Drug 2', html: '<p>Description 2</p>' }
    ];

    const result = parseDrug(input);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('Drug 1');
    expect(Array.isArray(result[0].html)).toBe(true);
    expect(result[1].name).toBe('Drug 2');
    expect(Array.isArray(result[1].html)).toBe(true);
  });

  test('should leave non-HTML strings unchanged', () => {
    const input = {
      name: 'Test Drug',
      dosage: '100mg',
      instructions: 'Take with food'
    };

    const result = parseDrug(input);

    expect(result.name).toBe('Test Drug');
    expect(result.dosage).toBe('100mg');
    expect(result.instructions).toBe('Take with food');
  });

  test('should handle empty and null values', () => {
    const input = {
      name: null,
      description: '',
      html: '<p></p>',
      undefined: undefined
    };

    const result = parseDrug(input);

    expect(result.name).toBe(null);
    expect(result.description).toBe('');
    expect(Array.isArray(result.html)).toBe(true);
    expect(result.undefined).toBe(undefined);
  });

  test('should handle complex HTML structures', () => {
    const input = {
      complexHtml: `
        <div class="drug-info">
          <h1>Drug Name</h1>
          <p>This is a <strong>complex</strong> HTML structure with <em>nested</em> elements.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `
    };

    const result = parseDrug(input);

    expect(Array.isArray(result.complexHtml)).toBe(true);
    expect(result.complexHtml[0].tagName).toBe('div');
    expect(result.complexHtml[0].attributes).toEqual([{ key: 'class', value: 'drug-info' }]);
    expect(result.complexHtml[0].children).toBeDefined();
    expect(result.complexHtml[0].children.length).toBeGreaterThan(0);
  });

  test('should handle mixed content types', () => {
    const input = {
      number: 42,
      boolean: true,
      html: '<span>HTML content</span>',
      text: 'Plain text',
      object: {
        nested: '<p>Nested HTML</p>',
        value: 123
      },
      array: [
        '<div>Array HTML</div>',
        'Array text',
        { nested: '<em>Deep HTML</em>' }
      ]
    };

    const result = parseDrug(input);

    expect(result.number).toBe(42);
    expect(result.boolean).toBe(true);
    expect(Array.isArray(result.html)).toBe(true);
    expect(result.text).toBe('Plain text');
    expect(Array.isArray(result.object.nested)).toBe(true);
    expect(result.object.value).toBe(123);
    expect(Array.isArray(result.array[0])).toBe(true);
    expect(result.array[1]).toBe('Array text');
    expect(Array.isArray(result.array[2].nested)).toBe(true);
  });

  test('should handle self-closing HTML tags', () => {
    const input = {
      selfClosing: '<img src="test.jpg" alt="Test" />',
      multipleElements: '<br/><hr/><input type="text" />'
    };

    const result = parseDrug(input);

    expect(Array.isArray(result.selfClosing)).toBe(true);
    expect(result.selfClosing[0].tagName).toBe('img');
    expect(Array.isArray(result.multipleElements)).toBe(true);
    expect(result.multipleElements.length).toBe(3);
  });

  test('should preserve object structure while parsing HTML', () => {
    const input = {
      level1: {
        level2: {
          level3: {
            html: '<p>Deep nested HTML</p>',
            text: 'Deep nested text'
          }
        }
      }
    };

    const result = parseDrug(input);

    expect(result.level1.level2.level3.text).toBe('Deep nested text');
    expect(Array.isArray(result.level1.level2.level3.html)).toBe(true);
    expect(result.level1.level2.level3.html[0].tagName).toBe('p');
  });
});