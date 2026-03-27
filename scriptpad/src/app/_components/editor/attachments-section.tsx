"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Paperclip,
  Image as ImageIcon,
  Video,
  Music,
  FileIcon,
  Upload,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

type Attachment = RouterOutputs["scripts"]["getById"]["attachments"][number];

interface AttachmentsSectionProps {
  scriptId: string;
  attachments: Attachment[];
  onAttachmentsChange: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return ImageIcon;
  if (fileType.startsWith("video/")) return Video;
  if (fileType.startsWith("audio/")) return Music;
  return FileIcon;
}

export function AttachmentsSection({
  scriptId,
  attachments,
  onAttachmentsChange,
}: AttachmentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(attachments.length > 0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createAttachment = api.attachments.create.useMutation({
    onSuccess: () => onAttachmentsChange(),
    onError: () => toast.error("Failed to save attachment"),
  });

  const deleteAttachment = api.attachments.delete.useMutation({
    onSuccess: async (data) => {
      // Also remove from Supabase Storage via server route
      if (data.fileUrl) {
        try {
          await fetch("/api/upload/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileUrl: data.fileUrl }),
          });
        } catch {
          // Storage deletion is best-effort
        }
      }
      onAttachmentsChange();
      toast.success("Attachment deleted");
    },
    onError: () => toast.error("Failed to delete attachment"),
  });

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum size is 50MB.");
        return;
      }

      setIsUploading(true);

      try {
        // Upload via server-side API route (uses service key)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("scriptId", scriptId);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Upload failed");
        }

        const { publicUrl } = (await res.json()) as { publicUrl: string };

        await createAttachment.mutateAsync({
          scriptId,
          fileUrl: publicUrl,
          fileName: file.name,
          fileType: file.type,
          fileSizeBytes: file.size,
        });

        toast.success("File uploaded");
      } catch (err) {
        console.error("Upload failed:", err);
        toast.error(
          err instanceof Error ? err.message : "Failed to upload file",
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [scriptId, createAttachment],
  );

  function handleAttachmentClick(attachment: Attachment) {
    if (
      attachment.fileType.startsWith("image/") ||
      attachment.fileType.startsWith("video/") ||
      attachment.fileType.startsWith("audio/")
    ) {
      setPreviewAttachment(attachment);
    } else {
      window.open(attachment.fileUrl, "_blank");
    }
  }

  return (
    <div className="mt-6 border-t border-[var(--color-border)] pt-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          {isExpanded ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
          <Paperclip size={14} />
          Attachments
          {attachments.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)]/60">
              ({attachments.length})
            </span>
          )}
        </button>

        {isExpanded && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload size={12} />
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isExpanded && (
        <div className="mt-3 space-y-1">
          {attachments.length === 0 && !isUploading ? (
            <p className="py-3 text-center text-xs text-[var(--color-text-muted)]">
              No attachments yet
            </p>
          ) : (
            attachments.map((attachment) => {
              const Icon = getFileIcon(attachment.fileType);
              return (
                <div
                  key={attachment.id}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-surface)]"
                >
                  <button
                    onClick={() => handleAttachmentClick(attachment)}
                    className="flex flex-1 cursor-pointer items-center gap-3 text-left"
                  >
                    <Icon
                      size={16}
                      className="shrink-0 text-[var(--color-text-muted)]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-[var(--color-text-primary)]">
                        {attachment.fileName}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {formatFileSize(attachment.fileSizeBytes)}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      deleteAttachment.mutate({ id: attachment.id })
                    }
                    className="cursor-pointer rounded p-1 text-[var(--color-text-muted)] opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Preview portal */}
      {previewAttachment &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setPreviewAttachment(null)}
          >
            <button
              onClick={() => setPreviewAttachment(null)}
              className="absolute right-4 top-4 cursor-pointer rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={24} />
            </button>
            <div
              className="max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {previewAttachment.fileType.startsWith("image/") && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAttachment.fileUrl}
                  alt={previewAttachment.fileName}
                  className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
                />
              )}
              {previewAttachment.fileType.startsWith("video/") && (
                <video
                  src={previewAttachment.fileUrl}
                  controls
                  autoPlay
                  className="max-h-[90vh] max-w-[90vw] rounded-lg"
                />
              )}
              {previewAttachment.fileType.startsWith("audio/") && (
                <div className="rounded-xl bg-[var(--color-surface-elevated)] p-8">
                  <p className="mb-4 text-center text-sm text-[var(--color-text-primary)]">
                    {previewAttachment.fileName}
                  </p>
                  <audio
                    src={previewAttachment.fileUrl}
                    controls
                    autoPlay
                    className="w-80"
                  />
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
