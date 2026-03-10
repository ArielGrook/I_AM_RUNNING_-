'use client';

import React from 'react';
import { useMediaLibrary } from '@/lib/hooks/useMediaLibrary';

interface MediaLibraryProps {
  userId: string;
  onSelect: (url: string, type: 'image' | 'video') => void;
  onClose: () => void;
  accept?: 'image' | 'video' | 'all';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  accessToken?: string;
}

export function MediaLibrary({
  userId,
  onSelect,
  onClose,
  accept = 'all',
  supabaseUrl,
  supabaseAnonKey,
  accessToken,
}: MediaLibraryProps) {
  const { files, uploading, loading, fetchFiles, uploadFile, deleteFile } =
    useMediaLibrary(userId, supabaseUrl, supabaseAnonKey, accessToken);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      await uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const filteredFiles = files.filter((f) =>
    accept === 'all' ? true : f.type === accept
  );

  const acceptStr =
    accept === 'video'
      ? 'video/*'
      : accept === 'image'
        ? 'image/*'
        : 'image/*,video/*';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 24,
          width: '90vw',
          maxWidth: 800,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Media Library
          </h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                cursor: 'pointer',
                background: 'rgba(255,107,53,0.15)',
                border: '1px solid rgba(255,107,53,0.4)',
                color: '#FF6B35',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {uploading ? 'Uploading...' : '+ Upload'}
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptStr}
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                fontSize: 20,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? '#FF6B35' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10,
            padding: 16,
            textAlign: 'center',
            marginBottom: 20,
            color: dragOver ? '#FF6B35' : '#71717a',
            fontSize: 13,
            transition: 'all 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </div>

        {/* Grid файлов */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {loading ? (
            <div
              style={{
                color: '#71717a',
                fontSize: 13,
                gridColumn: '1/-1',
                textAlign: 'center',
                padding: 40,
              }}
            >
              Loading...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div
              style={{
                color: '#71717a',
                fontSize: 13,
                gridColumn: '1/-1',
                textAlign: 'center',
                padding: 40,
              }}
            >
              No files yet. Upload something!
            </div>
          ) : (
            filteredFiles.map((file) => (
              <MediaFileCard
                key={file.id}
                file={file}
                onSelect={onSelect}
                onClose={onClose}
                onDelete={deleteFile}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MediaFileCard({
  file,
  onSelect,
  onClose,
  onDelete,
}: {
  file: { id: string; name: string; url: string; type: 'image' | 'video' };
  onSelect: (url: string, type: 'image' | 'video') => void;
  onClose: () => void;
  onDelete: (name: string) => void;
}) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={() => {
        onSelect(file.url, file.type);
        onClose();
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer',
        position: 'relative',
        aspectRatio: '1',
        background: 'rgba(255,255,255,0.03)',
        transition: 'border-color 0.2s',
      }}
    >
      {file.type === 'image' ? (
        <img
          src={file.url}
          alt={file.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : file.type === 'video' ? (
        <video
          src={file.url}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          muted
          onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
          onMouseLeave={(e) => {
            const v = e.currentTarget as HTMLVideoElement;
            v.pause();
            v.currentTime = 0;
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 28 }}>▶</span>
          <span style={{ fontSize: 10, color: '#71717a' }}>{file.name}</span>
        </div>
      )}

      {/* Удалить */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(file.name);
        }}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.7)',
          border: 'none',
          color: '#fff',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hover ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        ×
      </button>
    </div>
  );
}
