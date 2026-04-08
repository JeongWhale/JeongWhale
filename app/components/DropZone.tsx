'use client';

import { useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropZoneProps {
  files: File[];
  setFiles: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function DropZone({
  files,
  setFiles,
  maxFiles = 5,
  disabled = false,
}: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const merged = [...files, ...accepted].slice(0, maxFiles);
      setFiles(merged);
    },
    [files, setFiles, maxFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/png': [],
      'image/jpeg': [],
      'image/webp': [],
    },
    maxFiles,
    disabled,
    onDrop,
  });

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
        size: f.size,
      })),
    [files],
  );

  const removeAt = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone--active' : ''} ${
          disabled ? 'dropzone--disabled' : ''
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>여기에 놓으세요…</p>
        ) : (
          <p>
            템플릿 이미지를 드래그&amp;드롭하거나 클릭해서 선택하세요
            <br />
            <small>
              PNG · JPG · WEBP · 최대 {maxFiles}장 ({files.length}/{maxFiles})
            </small>
          </p>
        )}
      </div>

      {previews.length > 0 && (
        <ul className="thumb-grid">
          {previews.map((p, i) => (
            <li key={`${p.name}-${i}`} className="thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} />
              <button
                type="button"
                className="thumb__remove"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label={`${p.name} 제거`}
              >
                ×
              </button>
              <span className="thumb__name">{p.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
