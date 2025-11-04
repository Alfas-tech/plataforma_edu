"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BookOpen,
  Edit,
  ExternalLink,
  FileAudio2,
  FileCode2,
  FileText,
  Film,
  GripVertical,
  Image as ImageIcon,
  Link2,
  PackageOpen,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResourceFormDialog } from "./ResourceFormDialog";
import { DeleteResourceDialog } from "./DeleteResourceDialog";
import { ResourceViewer } from "@/components/ui/resource-viewer";
import { reorderResources } from "@/src/presentation/actions/content.actions";

interface ResourceData {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  resourceType:
    | "pdf"
    | "document"
    | "image"
    | "audio"
    | "video"
    | "link";
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  externalUrl: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface TopicSummary {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
}

interface ResourceManagementClientProps {
  courseVersionId: string | null;
  branchName: string;
  isDefaultBranch: boolean;
  isViewingDraftVersion: boolean;
  isViewingPublishedVersion: boolean;
  isViewingArchivedVersion: boolean;
  canEditPublishedVersion: boolean;
  topic: TopicSummary;
  resources: ResourceData[];
  courseId: string;
}

const RESOURCE_TYPE_META: Record<
  ResourceData["resourceType"],
  { label: string; icon: LucideIcon }
> = {
  pdf: { label: "PDF", icon: FileText },
  document: { label: "Documento", icon: FileText },
  image: { label: "Imagen", icon: ImageIcon },
  audio: { label: "Audio", icon: FileAudio2 },
  video: { label: "Video", icon: Film },
  link: { label: "Enlace", icon: Link2 },
};

function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) {
    return null;
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / Math.pow(1024, exponent);

  return `${size % 1 === 0 ? size : size.toFixed(1)} ${units[exponent]}`;
}

export function ResourceManagementClient({
  courseVersionId,
  branchName,
  isDefaultBranch,
  isViewingDraftVersion,
  isViewingPublishedVersion,
  isViewingArchivedVersion,
  canEditPublishedVersion,
  topic,
  resources,
  courseId,
}: ResourceManagementClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceData | null>(
    null
  );
  const [deletingResource, setDeletingResource] = useState<ResourceData | null>(
    null
  );
  const [viewingResource, setViewingResource] = useState<ResourceData | null>(
    null
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Estado local para el orden de recursos (permite reordenamiento visual inmediato)
  const [localResources, setLocalResources] = useState<ResourceData[]>([]);

  // Inicializar y sincronizar localResources con resources del servidor
  useEffect(() => {
    const sorted = [...resources].sort((a, b) => a.orderIndex - b.orderIndex);
    setLocalResources(sorted);
  }, [resources]);

  const sortedResources = localResources;

  const nextOrderIndex = useMemo(() => {
    if (sortedResources.length === 0) {
      return 1;
    }

    return (
      sortedResources.reduce((max, resource) => {
        return resource.orderIndex > max ? resource.orderIndex : max;
      }, sortedResources[0].orderIndex) + 1
    );
  }, [sortedResources]);

  // Solo se puede editar si:
  // 1. Existe courseVersionId Y
  // 2. NO es versión archivada (las archivadas son solo lectura) Y
  // 3. (Es una versión NO publicada) O (Es admin editando versión publicada)
  const canMutateContent = Boolean(courseVersionId) && 
    !isViewingArchivedVersion &&
    (!isViewingPublishedVersion || canEditPublishedVersion);
  
  const branchLabel = isDefaultBranch
    ? "edición principal"
    : `edición ${branchName}`;

  // Funciones de drag & drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    try {
      // Crear nueva lista con el elemento movido
      const newResources = [...localResources];
      const [draggedResource] = newResources.splice(draggedIndex, 1);
      newResources.splice(dropIndex, 0, draggedResource);

      // Actualizar estado local primero (optimistic update)
      setLocalResources(newResources);

      // Crear array de actualizaciones con nuevos índices
      const updates = newResources.map((resource, idx) => ({
        resourceId: resource.id,
        orderIndex: idx + 1,
      }));

      const result = await reorderResources(topic.id, updates);
      
      if (result.error) {
        showToast(result.error, "error");
        // Revertir cambios locales si falla
        router.refresh();
      } else {
        showToast("✨ Orden actualizado", "success");
      }
    } catch (error) {
      showToast("Error al actualizar el orden", "error");
      router.refresh();
    } finally {
      setDraggedIndex(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {isViewingArchivedVersion ? (
          <>
            <p className="font-semibold text-slate-800">
              📦 Versión archivada - Solo lectura
            </p>
            <p>
              Estás visualizando recursos de una versión archivada del curso. Esta versión ya no está activa 
              y su contenido no puede ser editado. Los recursos se muestran tal como estaban cuando 
              la versión fue archivada.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-slate-800">
              Gestionas recursos del tópico "{topic.title}" en la {branchLabel}.
            </p>
            {isViewingDraftVersion ? (
              <p>
                📝 <strong>Versión borrador</strong> - Los cambios no afectarán a los estudiantes 
                hasta que esta versión sea publicada.
              </p>
            ) : isDefaultBranch ? (
              <p>
                Los recursos publicados impactan a los estudiantes inmediatamente. Utiliza
                una versión borrador para preparar modificaciones sin afectar la
                experiencia vigente.
              </p>
            ) : (
              <p>
                Las modificaciones permanecen aisladas en esta edición hasta que la
                fusiones con la edición principal.
              </p>
            )}
            {!canMutateContent && !isViewingArchivedVersion && (
              <p className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-700">
                {isViewingPublishedVersion && !canEditPublishedVersion 
                  ? "⚠️ Los editores y docentes solo pueden modificar borradores. Contacta a un administrador para editar la versión publicada."
                  : "⚠️ La versión seleccionada no está activa. Activa o crea una versión antes de agregar recursos."}
              </p>
            )}
          </>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 sm:text-2xl">
            Recursos del tópico
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            Orden actual: #{topic.orderIndex} dentro del curso
          </p>
        </div>
        <Button
          onClick={() => canMutateContent && setIsCreateDialogOpen(true)}
          className="self-start bg-purple-600 hover:bg-purple-700"
          disabled={!canMutateContent}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar recurso
        </Button>
      </div>

      {sortedResources.length === 0 ? (
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                Sin recursos registrados
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Crea tu primer recurso para acompañar este tópico.
              </p>
              <Button
                onClick={() => canMutateContent && setIsCreateDialogOpen(true)}
                variant="outline"
                disabled={!canMutateContent}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear recurso
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedResources.map((resource, index) => {
            const meta = RESOURCE_TYPE_META[resource.resourceType];
            const Icon = meta?.icon ?? FileCode2;
            const fileSizeLabel = formatFileSize(resource.fileSize);
            const isDragging = draggedIndex === index;

            return (
              <Card
                key={resource.id}
                draggable={canMutateContent}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`border-2 transition-all ${
                  isDragging ? "opacity-50 shadow-2xl scale-105" : "hover:shadow-lg"
                } ${canMutateContent ? "cursor-move" : ""}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {canMutateContent && (
                        <div className="flex-shrink-0 pt-1 cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-600">
                            {resource.orderIndex}
                          </span>
                          <CardTitle className="text-xl text-slate-900">
                            {resource.title}
                          </CardTitle>
                          <Badge variant="outline" className="border-slate-300">
                            Actualizado {new Date(resource.updatedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <Badge className="bg-slate-900 text-white">
                          <Icon className="mr-1 h-3.5 w-3.5" />
                          {meta?.label ?? resource.resourceType}
                        </Badge>
                        {resource.externalUrl && (
                          <Badge variant="secondary" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Enlace externo
                          </Badge>
                        )}
                        {resource.fileUrl && (
                          <Badge variant="secondary" className="gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            Archivo adjunto
                          </Badge>
                        )}
                        {fileSizeLabel && (
                          <Badge variant="outline">{fileSizeLabel}</Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="mt-3 text-sm text-slate-700">
                          {resource.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {resource.fileName && <span>Archivo: {resource.fileName}</span>}
                        {resource.mimeType && <span>Tipo: {resource.mimeType}</span>}
                      </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
                      {(resource.externalUrl || resource.fileUrl) && (
                        <Button
                          variant="default"
                          onClick={() => setViewingResource(resource)}
                          className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto"
                        >
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Ver recurso
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => canMutateContent && setEditingResource(resource)}
                        disabled={!canMutateContent}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => canMutateContent && setDeletingResource(resource)}
                        disabled={!canMutateContent}
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      <ResourceFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
        topicId={topic.id}
        courseId={courseId}
        defaultOrderIndex={nextOrderIndex}
        canMutateContent={canMutateContent}
      />

      <ResourceFormDialog
        isOpen={Boolean(editingResource)}
        onClose={() => setEditingResource(null)}
        mode="edit"
        topicId={topic.id}
        courseId={courseId}
        resource={editingResource}
        defaultOrderIndex={nextOrderIndex}
        canMutateContent={canMutateContent}
      />

      <DeleteResourceDialog
        isOpen={Boolean(deletingResource)}
        onClose={() => setDeletingResource(null)}
        resource={deletingResource}
      />

      {viewingResource && (
        <ResourceViewer
          isOpen={Boolean(viewingResource)}
          onClose={() => setViewingResource(null)}
          resource={{
            title: viewingResource.title,
            resourceType: viewingResource.resourceType,
            fileUrl: viewingResource.fileUrl,
            fileName: viewingResource.fileName,
            mimeType: viewingResource.mimeType,
            externalUrl: viewingResource.externalUrl,
          }}
        />
      )}
    </>
  );
}
