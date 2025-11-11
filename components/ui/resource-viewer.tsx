"use client";

import React, { useEffect, useMemo, useState } from "react";
import NextImage from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Maximize2,
  FileText,
  Film,
  FileAudio,
  Image as ImageIcon,
  File,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { prettifyFileName } from "@/lib/storage.utils";

interface ResourceViewerProps {
  isOpen: boolean;
  onClose: () => void;
  resource: {
    title: string;
    resourceType: string;
    fileUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    externalUrl: string | null;
  };
}

export function ResourceViewer({
  isOpen,
  onClose,
  resource,
}: ResourceViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  const normalizedUrlPath = useMemo(() => {
    if (!resource.fileUrl) {
      return "";
    }

    try {
      const url = new URL(resource.fileUrl);
      return url.pathname.toLowerCase();
    } catch (error) {
      return resource.fileUrl.toLowerCase();
    }
  }, [resource.fileUrl]);

  const textResourceHints = useMemo(() => {
    const normalizedMime = resource.mimeType?.toLowerCase() ?? "";
    const normalizedName = resource.fileName?.toLowerCase() ?? "";
    const normalizedUrl = resource.fileUrl?.toLowerCase() ?? "";

    const isTextMime = normalizedMime.startsWith("text/");
    const isTxtName = normalizedName.endsWith(".txt");
    const isTxtUrl = normalizedUrl.includes(".txt");
    const isConfiguredText = resource.resourceType === "text";
    const isDocumentTxt =
      resource.resourceType === "document" && (isTxtName || isTxtUrl);
    const isWordMime =
      normalizedMime === "application/msword" ||
      normalizedMime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isWordName =
      normalizedName.endsWith(".doc") || normalizedName.endsWith(".docx");
    const isWordPath =
      normalizedUrlPath.endsWith(".doc") || normalizedUrlPath.endsWith(".docx");

    return {
      isTextMime,
      isTxtName,
      isTxtUrl,
      isConfiguredText,
      isDocumentTxt,
      isWordMime,
      isWordName,
      isWordPath,
    };
  }, [
    normalizedUrlPath,
    resource.fileName,
    resource.fileUrl,
    resource.mimeType,
    resource.resourceType,
  ]);

  const isTextResource = useMemo(() => {
    const isWordLike =
      textResourceHints.isWordMime ||
      textResourceHints.isWordName ||
      textResourceHints.isWordPath;

    if (
      textResourceHints.isConfiguredText ||
      textResourceHints.isTextMime ||
      textResourceHints.isTxtName ||
      textResourceHints.isTxtUrl ||
      textResourceHints.isDocumentTxt
    ) {
      return true;
    }

    if (isWordLike) {
      return false;
    }

    // Fallback: treat unknown/empty MIME for document/other as text to probe.
    const mime = resource.mimeType?.toLowerCase() ?? "";
    if (
      !mime &&
      (resource.resourceType === "document" ||
        resource.resourceType === "other")
    ) {
      return true;
    }

    return false;
  }, [resource.mimeType, resource.resourceType, textResourceHints]);

  const isWordDocument = useMemo(() => {
    if (!resource.fileUrl) {
      return false;
    }

    return (
      textResourceHints.isWordMime ||
      textResourceHints.isWordName ||
      textResourceHints.isWordPath
    );
  }, [resource.fileUrl, textResourceHints]);

  const officeViewerUrl = useMemo(() => {
    if (!resource.fileUrl || !isWordDocument) {
      return null;
    }

    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resource.fileUrl)}`;
  }, [isWordDocument, resource.fileUrl]);

  useEffect(() => {
    let aborted = false;
    setTextContent(null);
    setTextError(null);

    const fileUrl = resource.fileUrl;

    if (!isOpen || !isTextResource || !fileUrl) {
      setIsLoadingText(false);
      return;
    }

    const controller = new AbortController();

    const loadText = async () => {
      try {
        setIsLoadingText(true);
        const response = await fetch(fileUrl, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("fetch-failed");
        }
        const contentType =
          response.headers.get("content-type")?.toLowerCase() ?? "";
        const canReadAsText =
          !contentType ||
          contentType.startsWith("text/") ||
          contentType.includes("json") ||
          contentType === "application/octet-stream";

        if (!canReadAsText) {
          throw new Error("unsupported-content-type");
        }

        const rawText = await response.text();
        if (!aborted) {
          const normalized = rawText.replace(/\uFEFF/g, "");
          setTextContent(normalized);
        }
      } catch (error) {
        if (
          !aborted &&
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setTextError("No se pudo cargar el contenido del archivo.");
        }
      } finally {
        if (!aborted) {
          setIsLoadingText(false);
        }
      }
    };

    void loadText();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [isOpen, isTextResource, resource.fileUrl]);

  const getViewerContent = () => {
    // Si tiene URL externa, mostrar iframe o enlace
    if (resource.externalUrl) {
      // YouTube, Vimeo, etc.
      if (
        resource.externalUrl.includes("youtube.com") ||
        resource.externalUrl.includes("youtu.be")
      ) {
        const videoId = extractYouTubeId(resource.externalUrl);
        if (videoId) {
          return (
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="h-full w-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
      }

      // Para otros enlaces externos, mostrar iframe o botón
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <ExternalLink className="h-16 w-16 text-slate-400" />
          <p className="text-center text-sm text-slate-600">
            Este recurso está alojado en una plataforma externa
          </p>
          <a
            href={resource.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-purple-600 hover:bg-purple-700">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir en nueva pestaña
            </Button>
          </a>
        </div>
      );
    }

    // Si tiene archivo subido
    if (resource.fileUrl) {
      const mimeType = resource.mimeType || "";

      // PDF
      if (mimeType.includes("pdf") || resource.resourceType === "pdf") {
        return (
          <div className="flex flex-col space-y-4">
            <div className="h-[70vh] w-full">
              <object
                data={resource.fileUrl}
                type="application/pdf"
                className="h-full w-full rounded-lg"
              >
                <iframe
                  src={`${resource.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="h-full w-full rounded-lg"
                  title={resource.title}
                />
              </object>
            </div>
            <div className="flex justify-center gap-2">
              <a
                href={resource.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en nueva pestaña
                </Button>
              </a>
            </div>
          </div>
        );
      }

      // Video
      if (mimeType.startsWith("video/") || resource.resourceType === "video") {
        return (
          <div className="w-full">
            <video
              controls
              className="w-full rounded-lg"
              src={resource.fileUrl}
            >
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
        );
      }

      // Audio
      if (mimeType.startsWith("audio/") || resource.resourceType === "audio") {
        return (
          <div className="flex flex-col items-center space-y-4 p-8">
            <FileAudio className="h-16 w-16 text-purple-600" />
            <audio controls className="w-full" src={resource.fileUrl}>
              Tu navegador no soporta el elemento de audio.
            </audio>
          </div>
        );
      }

      // Imagen
      if (mimeType.startsWith("image/") || resource.resourceType === "image") {
        return (
          <div className="relative flex h-[70vh] w-full items-center justify-center overflow-hidden p-4">
            <NextImage
              src={resource.fileUrl}
              alt={resource.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 75vw, 60vw"
              className="object-contain"
              priority={false}
            />
          </div>
        );
      }

      // Documentos Word (doc, docx)
      if (isWordDocument) {
        if (!officeViewerUrl) {
          return (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center text-sm text-red-600">
              <FileText className="h-16 w-16 text-red-500" />
              <p>No se pudo cargar el documento.</p>
            </div>
          );
        }

        const docUrl = resource.fileUrl;
        return (
          <div className="flex flex-col space-y-4">
            <div className="h-[75vh] w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
              <iframe
                src={officeViewerUrl}
                title={resource.title}
                className="h-full w-full border-0"
                allowFullScreen
              />
            </div>
            {docUrl && (
              <div className="flex justify-end gap-2">
                <a href={docUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir en pestaña nueva
                  </Button>
                </a>
              </div>
            )}
          </div>
        );
      }

      // Documentos de texto / código
      if (isTextResource) {
        const textUrl = resource.fileUrl;
        const hasRenderableText = (textContent?.trim().length ?? 0) > 0;
        if (!textUrl) {
          return (
            <div className="flex flex-col items-center justify-center space-y-4 p-8">
              <FileText className="h-16 w-16 text-slate-400" />
              <p className="text-center text-sm text-slate-600">
                No se encontró un archivo adjunto para este recurso.
              </p>
            </div>
          );
        }

        if (isLoadingText) {
          return (
            <div className="flex flex-col items-center justify-center space-y-3 p-8 text-sm text-slate-600">
              <FileText className="h-12 w-12 animate-pulse text-purple-500" />
              <p>Cargando contenido…</p>
            </div>
          );
        }

        if (textError) {
          return (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center text-sm text-red-600">
              <FileText className="h-16 w-16 text-red-500" />
              <p>{textError}</p>
              <a href={textUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en nueva pestaña
                </Button>
              </a>
            </div>
          );
        }

        return (
          <div className="flex flex-col space-y-4">
            <div className="max-h-[75vh] min-h-[320px] overflow-auto rounded-lg border border-slate-200 bg-slate-900/80 p-4">
              <pre className="min-h-full w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-100">
                {hasRenderableText
                  ? textContent
                  : "El archivo no contiene texto o no se pudo renderizar."}
              </pre>
            </div>
            <div className="flex justify-end gap-2">
              <a href={textUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en pestaña nueva
                </Button>
              </a>
            </div>
          </div>
        );
      }

      // Otros tipos de archivo
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <File className="h-16 w-16 text-slate-400" />
          <p className="text-center text-sm text-slate-600">
            Previsualización no disponible para este tipo de archivo
          </p>
          <p className="text-xs text-slate-500">
            Tipo: {mimeType || "Desconocido"}
          </p>
          <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir en nueva pestaña
            </Button>
          </a>
        </div>
      );
    }

    // Sin archivo ni URL
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <File className="h-16 w-16 text-slate-400" />
        <p className="text-center text-sm text-slate-600">
          No hay contenido disponible para este recurso
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-h-[95vh] overflow-y-auto",
          isFullscreen ? "max-w-[95vw]" : "max-w-4xl"
        )}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{resource.title}</DialogTitle>
              {resource.fileName && (
                <p className="mt-1 text-sm text-slate-500">
                  {prettifyFileName(resource.fileName) ?? resource.fileName}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">{getViewerContent()}</div>
      </DialogContent>
    </Dialog>
  );
}

// Utility para extraer ID de YouTube
function extractYouTubeId(url: string): string | null {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}
