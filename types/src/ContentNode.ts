const contentNodeElements = [
  'a',
  'br',
  'caption',
  'col',
  'dd',
  'div',
  'dl',
  'dt',
  'h1',
  'h2',
  'img',
  'li',
  'ol',
  'p',
  'section',
  'span',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
] as const;

export type ContentNodeElement = typeof contentNodeElements[number];

const AttributeKeys = [
  'align',
  'alt',
  'class',
  'colspan',
  'data-sectioncode',
  'href',
  'id',
  'name',
  'rowspan',
  'src',
  'style',
  'valign',
  'width'
] as const;

export type AttributeKey = typeof AttributeKeys[number];

export type TextNode = {
  type: 'text';
  content: string;
};

export type ContentNode = {
  type: 'element';
  tagName: ContentNodeElement;
  attributes: Array<{
    key: AttributeKey;
    value: string;
  }>;
  children: Array<ContentNode | TextNode>;
} | Array<ContentNode>;
