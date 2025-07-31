
import React from 'react';
import { ContentNode, TextNode } from '@drug-info/types';

export function renderContentNode(node: ContentNode | TextNode | Array<ContentNode | TextNode>, index?: number): React.ReactNode {
  // Handle arrays of nodes
  if (Array.isArray(node)) {
    return node.map((child, idx) => renderContentNode(child, idx));
  }

  // Handle text nodes
  if (node.type === 'text') {
    return node.content;
  }

  // Handle element nodes
  if (node.type === 'element') {
    const { tagName, attributes, children } = node;
    
    // Convert attributes array to props object
    const props: Record<string, any> = {
      key: index
    };
    
    // Process attributes
    attributes.forEach(attr => {
      switch (attr.key) {
        case 'class':
          props.className = attr.value;
          break;
        case 'data-sectioncode':
          props['data-sectioncode'] = attr.value;
          break;
        case 'colspan':
          props.colSpan = parseInt(attr.value) || 1;
          break;
        case 'rowspan':
          props.rowSpan = parseInt(attr.value) || 1;
          break;
        default:
          props[attr.key] = attr.value;
      }
    });

    // Render children recursively
    const childElements = children?.map((child, idx) => renderContentNode(child, idx)) || [];

    // Map tagName to appropriate React element with enhanced styling
    switch (tagName) {
      case 'a':
        return React.createElement('a', { ...props, style: { color: 'var(--accent-9)', textDecoration: 'underline', ...props.style } }, ...childElements);
      case 'br':
        return React.createElement('br', props);
      case 'caption':
        return React.createElement('caption', { ...props, style: { fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'left', ...props.style } }, ...childElements);
      case 'col':
        return React.createElement('col', props);
      case 'dd':
        return React.createElement('dd', { ...props, style: { marginLeft: '1.5rem', marginBottom: '0.5rem', ...props.style } }, ...childElements);
      case 'div':
        return React.createElement('div', props, ...childElements);
      case 'dl':
        return React.createElement('dl', { ...props, style: { marginBottom: '1rem', ...props.style } }, ...childElements);
      case 'dt':
        return React.createElement('dt', { ...props, style: { fontWeight: 'bold', marginTop: '0.5rem', marginBottom: '0.25rem', ...props.style } }, ...childElements);
      case 'h1':
        return React.createElement('h2', { ...props, style: { fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1.5rem', marginBottom: '0.75rem', lineHeight: '1.3', ...props.style } }, ...childElements);
      case 'h2':
        return React.createElement('h3', { ...props, style: { fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1.25rem', marginBottom: '0.5rem', lineHeight: '1.3', ...props.style } }, ...childElements);
      case 'img':
        return React.createElement('img', { ...props, style: { maxWidth: '100%', height: 'auto', ...props.style } });
      case 'li':
        return React.createElement('li', { ...props, style: { marginBottom: '0.25rem', lineHeight: '1.5', ...props.style } }, ...childElements);
      case 'ol':
        return React.createElement('ol', { ...props, style: { marginBottom: '1rem', paddingLeft: '1.5rem', ...props.style } }, ...childElements);
      case 'p':
        return React.createElement('p', { ...props, style: { marginBottom: '0.75rem', lineHeight: '1.6', ...props.style } }, ...childElements);
      case 'section':
        return React.createElement('section', { ...props, style: { marginBottom: '1.5rem', ...props.style } }, ...childElements);
      case 'span':
        return React.createElement('span', props, ...childElements);
      case 'table':
        return React.createElement('table', { 
          ...props, 
          style: { 
            width: '100%', 
            borderCollapse: 'collapse', 
            marginBottom: '1rem',
            border: '1px solid var(--gray-6)',
            backgroundColor: 'var(--color-surface)',
            ...props.style 
          } 
        }, ...childElements);
      case 'tbody':
        return React.createElement('tbody', props, ...childElements);
      case 'td':
        return React.createElement('td', { 
          ...props, 
          style: { 
            padding: '0.75rem', 
            borderBottom: '1px solid var(--gray-4)',
            borderRight: '1px solid var(--gray-4)',
            verticalAlign: 'top',
            lineHeight: '1.5',
            ...props.style 
          } 
        }, ...childElements);
      case 'tfoot':
        return React.createElement('tfoot', { ...props, style: { backgroundColor: 'var(--gray-3)', ...props.style } }, ...childElements);
      case 'th':
        return React.createElement('th', { 
          ...props, 
          style: { 
            padding: '0.75rem', 
            borderBottom: '2px solid var(--gray-6)',
            borderRight: '1px solid var(--gray-4)',
            backgroundColor: 'var(--gray-3)',
            fontWeight: 'bold',
            textAlign: 'left',
            verticalAlign: 'top',
            ...props.style 
          } 
        }, ...childElements);
      case 'thead':
        return React.createElement('thead', { ...props, style: { backgroundColor: 'var(--gray-3)', ...props.style } }, ...childElements);
      case 'tr':
        return React.createElement('tr', { 
          ...props, 
          style: { 
            '&:hover': { backgroundColor: 'var(--gray-2)' },
            ...props.style 
          } 
        }, ...childElements);
      case 'ul':
        return React.createElement('ul', { ...props, style: { marginBottom: '1rem', paddingLeft: '1.5rem', ...props.style } }, ...childElements);
      default:
        // Fallback for any unhandled tags
        console.warn(`Unhandled tagName: ${tagName}`);
        return React.createElement('div', props, ...childElements);
    }
  }

  // Fallback for unexpected node types
  return null;
}
