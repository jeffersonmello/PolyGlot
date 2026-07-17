import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  files: File[];
  onFilesChange: (files: File[]) => void;
  multiple?: boolean;
  maxSizeMb?: number;
}

const FileUploadZone: React.FC<Props> = ({
  files,
  onFilesChange,
  multiple = false,
  maxSizeMb = 50,
}) => {
  const maxSize = maxSizeMb * 1024 * 1024;

  const onDrop = useCallback(
    (accepted: File[]) => {
      onFilesChange(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
    },
    [files, onFilesChange, multiple]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple,
    maxSize,
  });

  const removeFile = (idx: number) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="upload-zone-wrapper">
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'drag-active' : ''} ${files.length > 0 ? 'has-files' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="upload-zone-content">
          <div className="upload-icon">📄</div>
          {isDragActive ? (
            <p>Drop your PDF{multiple ? 's' : ''} here…</p>
          ) : (
            <>
              <p>
                <strong>Drag & drop</strong> your PDF{multiple ? 's' : ''} here
              </p>
              <p className="upload-hint">
                or <span className="link-text">click to browse</span>
              </p>
              <p className="upload-limit">
                Max file size: {maxSizeMb} MB
                {multiple ? ' · Up to 10 files' : ''}
              </p>
            </>
          )}
        </div>
      </div>

      {fileRejections.length > 0 && (
        <ul className="rejection-list">
          {fileRejections.map(({ file, errors }) => (
            <li key={file.name} className="rejection-item">
              <strong>{file.name}</strong>:{' '}
              {errors.map((e) => e.message).join(', ')}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, idx) => (
            <li key={`${file.name}-${idx}`} className="file-item">
              <span className="file-icon">📎</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatSize(file.size)}</span>
              <button
                type="button"
                className="remove-btn"
                onClick={() => removeFile(idx)}
                title="Remove file"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUploadZone;
