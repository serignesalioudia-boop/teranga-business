"use client";

import { useCallback, useRef, useState } from "react";

type UploadedMedia = {
  id: string;
  url: string;
  alt: string;
  position: number;
};

export function ImageUpload({
  target,
  targetId,
  onUpload,
  onRemove,
  existing = [],
  maxImages = 8,
}: {
  target: "product" | "store";
  targetId?: string;
  onUpload: (media: UploadedMedia) => void;
  onRemove: (mediaId: string) => void;
  existing?: UploadedMedia[];
  maxImages?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<
    { file: File; preview: string; uploading: boolean; error?: string }[]
  >([]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !targetId) return;

      const newPreviews = Array.from(files).slice(0, maxImages - existing.length).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        uploading: true,
      }));

      setPreviews((prev) => [...prev, ...newPreviews]);

      for (const p of newPreviews) {
        try {
          const fd = new FormData();
          fd.append("file", p.file);
          fd.append("target", target);
          fd.append("targetId", targetId);
          fd.append("alt", p.file.name.replace(/\.[^.]+$/, ""));

          const res = await fetch("/api/media/upload", {
            method: "POST",
            body: fd,
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Upload échoué");
          }

          const data = await res.json();
          onUpload({
            id: data.media.id,
            url: data.media.url,
            alt: data.media.alt ?? "",
            position: data.media.position,
          });
        } catch (e) {
          setPreviews((prev) =>
            prev.map((pp) =>
              pp.file === p.file
                ? { ...pp, error: String(e instanceof Error ? e.message : e) }
                : pp,
            ),
          );
        } finally {
          setPreviews((prev) =>
            prev.map((pp) =>
              pp.file === p.file ? { ...pp, uploading: false } : pp,
            ),
          );
        }
      }
    },
    [target, targetId, maxImages, existing.length, onUpload],
  );

  const handleRemovePreview = (index: number) => {
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {existing.map((m) => (
          <div key={m.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
            <img
              src={m.url}
              alt={m.alt}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(m.id)}
              className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition group-hover:opacity-100"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {previews.map((p, i) => (
          <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
            <img
              src={p.preview}
              alt="Aperçu"
              className="h-full w-full object-cover"
            />
            {p.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            {p.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 p-1">
                <span className="text-center text-[10px] text-white">{p.error}</span>
              </div>
            )}
            {!p.uploading && (
              <button
                type="button"
                onClick={() => handleRemovePreview(i)}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {existing.length + previews.length < maxImages && targetId && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary"
          >
            <svg className="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px]">Ajouter</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />

      {!targetId && (
        <p className="text-xs text-muted-foreground">
          Enregistrez d&apos;abord, puis ajoutez les images.
        </p>
      )}
    </div>
  );
}
