import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { uploadUnitMedia, addMediaToUnit } from '../../utils/mediaUpload';

export const MediaUploader = ({ unitId, userId, onUploadComplete, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    if (disabled) return;
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newUploads = files.map((file) => ({
      id: `${Date.now()}_${file.name}`,
      file,
      progress: 0,
      status: 'pending',
      error: null,
      preview: null,
    }));

    newUploads.forEach((upload) => {
      if (upload.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === upload.id ? { ...item, preview: reader.result } : item
            )
          );
        };
        reader.readAsDataURL(upload.file);
      }
    });

    setUploadQueue((prev) => [...prev, ...newUploads]);
    startUploads(newUploads);
  };

  const startUploads = async (uploads) => {
    for (const upload of uploads) {
      try {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === upload.id ? { ...item, status: 'uploading' } : item
          )
        );

        const mediaData = await uploadUnitMedia(
          unitId,
          upload.file,
          userId,
          (progress) => {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === upload.id ? { ...item, progress } : item
              )
            );
          }
        );

        await addMediaToUnit(unitId, mediaData);

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === upload.id ? { ...item, status: 'completed', progress: 100 } : item
          )
        );

        if (onUploadComplete) {
          onUploadComplete(mediaData);
        }

        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((item) => item.id !== upload.id));
        }, 2000);
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === upload.id
              ? { ...item, status: 'error', error: error.message }
              : item
          )
        );
      }
    }
  };

  const removeFromQueue = (uploadId) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== uploadId));
  };

  const retryUpload = (upload) => {
    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === upload.id
          ? { ...item, status: 'pending', error: null, progress: 0 }
          : item
      )
    );
    startUploads([upload]);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          {disabled ? 'Upload disabled' : 'Drop files here or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground">
          Images (JPG, PNG, WebP, GIF) up to 10MB or Videos (MP4, WebM, MOV) up to 100MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          {uploadQueue.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {upload.preview ? (
                  <img
                    src={upload.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : upload.file.type.startsWith('video/') ? (
                  <Video className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                {upload.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${upload.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(upload.progress)}%
                    </p>
                  </div>
                )}

                {upload.status === 'completed' && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Upload completed
                  </p>
                )}

                {upload.status === 'error' && (
                  <div className="mt-1">
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {upload.error}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => retryUpload(upload)}
                      className="mt-1 h-6 text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>

              {upload.status === 'uploading' ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
              ) : upload.status === 'error' || upload.status === 'pending' ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromQueue(upload.id)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
