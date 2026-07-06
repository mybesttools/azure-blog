'use client';

import { useEffect, useRef, useState } from 'react';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  alt?: string;
  mimeType: string;
}

interface ImagePickerModalProps {
  onSelect: (url: string, alt: string) => void;
  onClose: () => void;
}

export default function ImagePickerModal({ onSelect, onClose }: ImagePickerModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/media?_end=200', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load media');
        return res.json();
      })
      .then((data) => setMedia(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load media library.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }
      const created = await res.json();
      onSelect(created.url, created.alt || '');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          width: '640px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          <strong>Insert Image</strong>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e5e5' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: '#f7f7f7',
              cursor: uploading ? 'default' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : 'Upload new image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
          {error && <div style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</div>}
        </div>

        <div style={{ padding: '1rem', overflowY: 'auto' }}>
          {loading ? (
            <div>Loading media library...</div>
          ) : media.length === 0 ? (
            <div style={{ color: '#666' }}>No images uploaded yet.</div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.url, item.alt || '')}
                  title={item.filename}
                  style={{
                    border: '1px solid #e5e5e5',
                    borderRadius: '4px',
                    padding: '0.25rem',
                    background: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    style={{
                      width: '100%',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '2px',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      width: '100%',
                      textAlign: 'center',
                    }}
                  >
                    {item.filename}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
