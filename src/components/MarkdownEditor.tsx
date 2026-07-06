'use client';

import { useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';
import './markdown-preview.css';
import ImagePickerModal from './ImagePickerModal';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const codemirrorRef = useRef<CodeMirror.Editor | null>(null);

  const insertImage = (url: string, alt: string) => {
    const cm = codemirrorRef.current;
    if (cm) {
      cm.replaceSelection(`![${alt}](${url})`);
      cm.focus();
    }
    setImagePickerOpen(false);
  };

  const options = useMemo(() => ({
    spellChecker: false,
    placeholder: 'Write your post content in Markdown...',
    status: false,
    minHeight: '400px',
    initialValue: '',
    promptURLs: true,
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
      {
        name: 'image',
        action: (editor: EasyMDE) => {
          codemirrorRef.current = editor.codemirror;
          setImagePickerOpen(true);
        },
        className: 'fa fa-image',
        title: 'Insert Image',
      },
      'code',
      '|',
      'preview', 
      'side-by-side', 
      'fullscreen',
      '|',
      'guide'
    ] as const,
    previewRender: (text: string) => {
      // Use a simple but more accurate markdown preview
      // This will be client-side only, matching closer to what remark produces
      const applyInline = (str: string) =>
        str
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

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
          html += `<h3>${applyInline(line.substring(4))}</h3>`;
        } else if (line.startsWith('## ')) {
          html += `<h2>${applyInline(line.substring(3))}</h2>`;
        } else if (line.startsWith('# ')) {
          html += `<h1>${applyInline(line.substring(2))}</h1>`;
        }
        // Lists
        else if (line.match(/^- /)) {
          if (!html.endsWith('</li>') && !html.endsWith('<ul>')) {
            html += '<ul>';
          }
          html += `<li>${applyInline(line.substring(2))}</li>`;
          if (i === lines.length - 1 || !lines[i + 1].match(/^- /)) {
            html += '</ul>';
          }
        }
        else if (line.match(/^\d+\. /)) {
          if (!html.endsWith('</li>') && !html.endsWith('<ol>')) {
            html += '<ol>';
          }
          html += `<li>${applyInline(line.replace(/^\d+\. /, ''))}</li>`;
          if (i === lines.length - 1 || !lines[i + 1].match(/^\d+\. /)) {
            html += '</ol>';
          }
        }
        // Regular paragraphs
        else if (line.trim()) {
          html += `<p>${applyInline(line)}</p>`;
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
      {imagePickerOpen && (
        <ImagePickerModal
          onSelect={insertImage}
          onClose={() => setImagePickerOpen(false)}
        />
      )}
    </div>
  );
}
