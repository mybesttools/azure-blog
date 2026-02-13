'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'easymde/dist/easymde.min.css';
import './markdown-preview.css';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const options = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Write your post content in Markdown...',
    status: false,
    minHeight: '400px',
    initialValue: '',
    toolbar: [
      'bold', 
      'italic', 
      'heading', 
      '|',
      'quote', 
      'unordered-list', 
      'ordered-list', 
      '|',
      'link', 
      'image',
      'code',
      '|',
      'preview', 
      'side-by-side', 
      'fullscreen',
      '|',
      'guide'
    ],
    previewRender: (text: string) => {
      // Use a simple but more accurate markdown preview
      // This will be client-side only, matching closer to what remark produces
      const lines = text.split('\n');
      let html = '';
      let inCodeBlock = false;
      let codeLanguage = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Code blocks
        if (line.startsWith('```')) {
          if (inCodeBlock) {
            html += '</code></pre>';
            inCodeBlock = false;
          } else {
            codeLanguage = line.substring(3).trim();
            html += `<pre><code class="language-${codeLanguage}">`;
            inCodeBlock = true;
          }
          continue;
        }
        
        if (inCodeBlock) {
          html += line + '\n';
          continue;
        }
        
        // Headings
        if (line.startsWith('### ')) {
          html += `<h3>${line.substring(4)}</h3>`;
        } else if (line.startsWith('## ')) {
          html += `<h2>${line.substring(3)}</h2>`;
        } else if (line.startsWith('# ')) {
          html += `<h1>${line.substring(2)}</h1>`;
        }
        // Lists
        else if (line.match(/^- /)) {
          if (!html.endsWith('</li>') && !html.endsWith('<ul>')) {
            html += '<ul>';
          }
          html += `<li>${line.substring(2)}</li>`;
          if (i === lines.length - 1 || !lines[i + 1].match(/^- /)) {
            html += '</ul>';
          }
        }
        else if (line.match(/^\d+\. /)) {
          if (!html.endsWith('</li>') && !html.endsWith('<ol>')) {
            html += '<ol>';
          }
          html += `<li>${line.replace(/^\d+\. /, '')}</li>`;
          if (i === lines.length - 1 || !lines[i + 1].match(/^\d+\. /)) {
            html += '</ol>';
          }
        }
        // Inline code
        else if (line.includes('`')) {
          const processed = line.replace(/`([^`]+)`/g, '<code>$1</code>');
          html += processed ? `<p>${processed}</p>` : '';
        }
        // Regular paragraphs
        else if (line.trim()) {
          // Bold and italic
          let processed = line
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
          html += `<p>${processed}</p>`;
        } else {
          html += '<br>';
        }
      }
      
      return html;
    },
  }), []);

  return (
    <div style={{ width: '100%' }}>
      <SimpleMDE
        value={value}
        onChange={onChange}
        options={options}
      />
    </div>
  );
}
