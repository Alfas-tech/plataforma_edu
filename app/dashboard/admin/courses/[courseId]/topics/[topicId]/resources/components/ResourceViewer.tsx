"use client";

import { useEffect, useState } from "react";
import NextImage from "next/image";
import { ExternalLink, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getResourceSignedUrl } from "@/src/presentation/actions/storage.actions";
import { formatFileSize, getFileIcon, isImageFile, isPDFFile } from "@/lib/storage.utils";

interface ResourceViewerProps {
  resource: {
    id: string;
    title: string;
    description: string | null;
    resourceType: string;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    externalUrl: string | null;
  };
  showPreview?: boolean;
}

export function ResourceViewer({
  resource,
  showPreview = true,
}: ResourceViewerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    // Si es un recurso externo (link), no necesitamos URL firmada
    if (resource.externalUrl) {
      return;
    }

    // Si tiene fileUrl, obtener URL firmada
    if (resource.fileUrl) {
      loadSignedUrl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.fileUrl, resource.externalUrl]);

  const loadSignedUrl = async () => {
    if (!resource.fileUrl) return;

    setIsLoadingUrl(true);
    setUrlError(null);

    try {
      const result = await getResourceSignedUrl(resource.fileUrl, 3600); // 1 hora

      if (result.success && result.signedUrl) {
        setSignedUrl(result.signedUrl);
      } else {
        setUrlError(result.error || "Error al cargar el recurso");
      }
    } catch (error) {
      console.error("Error al obtener URL firmada:", error);
      setUrlError("Error inesperado al cargar el recurso");
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleDownload = () => {
    const url = resource.externalUrl || signedUrl;
    if (url) {
      // Abrir en nueva pestaña para descarga
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleView = () => {
    const url = resource.externalUrl || signedUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Recurso externo (link)
  if (resource.externalUrl) {
    return (
      <div className="rounded-lg border bg-white p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {getFileIcon(resource.resourceType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 truncate">
              {resource.title}
            </h3>
            {resource.description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {resource.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleView}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir enlace
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Recurso con archivo
  if (isLoadingUrl) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full" />
          <span className="text-sm text-slate-600">Cargando recurso...</span>
        </div>
      </div>
    );
  }

  if (urlError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <h3 className="font-medium text-red-900">{resource.title}</h3>
            <p className="text-sm text-red-700 mt-1">{urlError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={loadSignedUrl}
              className="mt-2 text-xs"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!signedUrl) {
    return null;
  }

  const canPreview = showPreview && resource.mimeType && (
    isImageFile(resource.mimeType) || isPDFFile(resource.mimeType)
  );

  return (
    <div className="rounded-lg border bg-white overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview (solo para imágenes y PDFs) */}
      {canPreview && resource.mimeType && isImageFile(resource.mimeType) && (
        <div className="relative h-48 bg-slate-100">
          <NextImage
            src={signedUrl}
            alt={resource.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={false}
          />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {getFileIcon(resource.resourceType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 truncate">
              {resource.title}
            </h3>
            {resource.description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {resource.description}
              </p>
            )}
            
            {/* Metadatos del archivo */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {resource.fileName && (
                <span className="truncate">{resource.fileName}</span>
              )}
              {resource.fileSize && (
                <span>• {formatFileSize(resource.fileSize)}</span>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleView}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Descargar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
