export function lexicalToHtml(content: any): string {
  if (!content || !content.root) {
    return '';
  }

  const processNode = (node: any): string => {
    if (!node) return '';

    // Handle text nodes
    if (node.type === 'text') {
      let text = node.text || '';
      
      // Apply formatting
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
        if (node.format & 2) text = `<em>${text}</em>`; // Italic
        if (node.format & 4) text = `<s>${text}</s>`; // Strikethrough
        if (node.format & 8) text = `<u>${text}</u>`; // Underline
        if (node.format & 16) text = `<code>${text}</code>`; // Code
      }
      
      return text;
    }

    // Process children
    const childrenHtml = node.children
      ? node.children.map((child: any) => processNode(child)).join('')
      : '';

    // Handle different node types
    switch (node.type) {
      case 'root':
        return childrenHtml;
      
      case 'paragraph':
        return `<p>${childrenHtml}</p>`;
      
      case 'heading':
        const tag = node.tag || 'h2';
        return `<${tag}>${childrenHtml}</${tag}>`;
      
      case 'list':
        const listTag = node.listType === 'number' ? 'ol' : 'ul';
        return `<${listTag}>${childrenHtml}</${listTag}>`;
      
      case 'listitem':
        return `<li>${childrenHtml}</li>`;
      
      case 'quote':
        return `<blockquote>${childrenHtml}</blockquote>`;
      
      case 'code':
        return `<pre><code>${childrenHtml}</code></pre>`;
      
      case 'link':
        const url = node.fields?.url || node.url || '#';
        const newTab = node.fields?.newTab || node.newTab;
        const rel = newTab ? 'rel="noopener noreferrer"' : '';
        const target = newTab ? 'target="_blank"' : '';
        return `<a href="${url}" ${target} ${rel}>${childrenHtml}</a>`;
      
      case 'linebreak':
        return '<br>';
      
      case 'horizontalrule':
        return '<hr>';
      
      default:
        return childrenHtml;
    }
  };

  return processNode(content.root);
}
