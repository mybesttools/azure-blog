/**
 * Convert Lexical JSON format to Markdown
 * Handles the Lexical AST structure from Payload CMS
 */

interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  format?: number;
  mode?: string;
  tag?: string;
  direction?: string;
}

interface LexicalContent {
  root?: {
    type: string;
    children: LexicalNode[];
  };
}

export function lexicalToMarkdown(content: any): string {
  // If already a string (markdown), return as is
  if (typeof content === 'string') {
    return content;
  }

  // If not an object or no root, return empty string
  if (!content || typeof content !== 'object' || !content.root) {
    return '';
  }

  const lexicalContent = content as LexicalContent;
  return convertNodes(lexicalContent.root?.children || []);
}

function convertNodes(nodes: LexicalNode[]): string {
  return nodes.map(node => convertNode(node)).join('');
}

function convertNode(node: LexicalNode): string {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node);
    case 'heading':
      return convertHeading(node);
    case 'list':
      return convertList(node);
    case 'listitem':
      return convertListItem(node);
    case 'link':
      return convertLink(node);
    case 'text':
      return convertText(node);
    case 'linebreak':
      return '  \n';
    case 'code':
      return convertCode(node);
    case 'quote':
      return convertQuote(node);
    default:
      return node.children ? convertNodes(node.children) : '';
  }
}

function convertParagraph(node: LexicalNode): string {
  const content = node.children ? convertNodes(node.children) : '';
  return content.trim() ? content + '\n\n' : '\n';
}

function convertHeading(node: LexicalNode): string {
  const tag = (node as any).tag || 'h1';
  const level = parseInt(tag.replace('h', '')) || 1;
  const hashes = '#'.repeat(level);
  const content = node.children ? convertNodes(node.children) : '';
  return `${hashes} ${content.trim()}\n\n`;
}

function convertList(node: LexicalNode): string {
  const listType = (node as any).listType || 'bullet';
  const items = node.children ? node.children.map((child, index) => {
    const itemContent = child.children ? convertNodes(child.children) : '';
    if (listType === 'number') {
      return `${index + 1}. ${itemContent.trim()}`;
    }
    return `- ${itemContent.trim()}`;
  }).join('\n') : '';
  return items + '\n\n';
}

function convertListItem(node: LexicalNode): string {
  return node.children ? convertNodes(node.children) : '';
}

function convertLink(node: LexicalNode): string {
  const url = (node as any).url || '';
  const content = node.children ? convertNodes(node.children) : url;
  return `[${content.trim()}](${url})`;
}

function convertText(node: LexicalNode): string {
  let text = node.text || '';
  const format = node.format || 0;

  // Format flags (from Lexical)
  // 1 = bold, 2 = italic, 4 = strikethrough, 8 = underline, 16 = code
  if (format & 1) text = `**${text}**`; // bold
  if (format & 2) text = `*${text}*`; // italic
  if (format & 4) text = `~~${text}~~`; // strikethrough
  if (format & 16) text = `\`${text}\``; // code

  return text;
}

function convertCode(node: LexicalNode): string {
  const content = node.children ? convertNodes(node.children) : '';
  const language = (node as any).language || '';
  return `\`\`\`${language}\n${content.trim()}\n\`\`\`\n\n`;
}

function convertQuote(node: LexicalNode): string {
  const content = node.children ? convertNodes(node.children) : '';
  return content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
}
