"use client";

import React, { useState } from "react";
import NextImage from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ExternalLink, 
  Maximize2, 
  X,
  FileText,
  Film,
  FileAudio,
  Image as ImageIcon,
  File
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export function ResourceViewer({ isOpen, onClose, resource }: ResourceViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
              <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">
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

      // Documentos de texto / código
      if (
        mimeType.includes("text/") ||
        resource.resourceType === "code" ||
        resource.resourceType === "document"
      ) {
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <FileText className="h-16 w-16 text-slate-400" />
            <p className="text-center text-sm text-slate-600">
              Previsualización no disponible para este tipo de documento
            </p>
            <a href={resource.fileUrl} download={resource.fileName || undefined}>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Descargar archivo
              </Button>
            </a>
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
          <a href={resource.fileUrl} download={resource.fileName || undefined}>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Descargar archivo
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

  const canDownload = resource.fileUrl && !resource.externalUrl;

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
                  {resource.fileName}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {canDownload && (
                <a
                  href={resource.fileUrl!}
                  download={resource.fileName || undefined}
                >
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
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
