"use client";

import { useMemo, useState } from "react";
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

interface ResourceData {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  resourceType:
    | "pdf"
    | "video"
    | "audio"
    | "document"
    | "link"
    | "image"
    | "other";
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
  topic: TopicSummary;
  resources: ResourceData[];
}

const RESOURCE_TYPE_META: Record<
  ResourceData["resourceType"],
  { label: string; icon: LucideIcon }
> = {
  pdf: { label: "PDF", icon: FileText },
  video: { label: "Video", icon: Film },
  audio: { label: "Audio", icon: FileAudio2 },
  document: { label: "Documento", icon: FileText },
  link: { label: "Enlace", icon: Link2 },
  image: { label: "Imagen", icon: ImageIcon },
  other: { label: "Otro", icon: PackageOpen },
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
  topic,
  resources,
}: ResourceManagementClientProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceData | null>(
    null
  );
  const [deletingResource, setDeletingResource] = useState<ResourceData | null>(
    null
  );

  const sortedResources = useMemo(() => {
    return [...resources].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [resources]);

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

  const canMutateContent = Boolean(courseVersionId);
  const branchLabel = isDefaultBranch
    ? "edición principal"
    : `edición ${branchName}`;

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">
          Gestionas recursos del tópico {topic.title} en la {branchLabel}.
        </p>
        {isDefaultBranch ? (
          <p>
            Los recursos publicados impactan inmediatamente la experiencia de
            los estudiantes. Usa una edición de trabajo para preparar cambios
            importantes.
          </p>
        ) : (
          <p>
            Las modificaciones permanecen aisladas en esta edición hasta que la
            fusiones con la edición principal.
          </p>
        )}
        {!canMutateContent && (
          <p className="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-2 text-xs text-yellow-700">
            La edición seleccionada no tiene una versión activa. Activa o crea
            una versión antes de agregar recursos.
          </p>
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
          {sortedResources.map((resource) => {
            const meta = RESOURCE_TYPE_META[resource.resourceType];
            const Icon = meta?.icon ?? FileCode2;
            const fileSizeLabel = formatFileSize(resource.fileSize);

            return (
              <Card
                key={resource.id}
                className="border-2 transition-shadow hover:shadow-lg"
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                    <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row">
                      {resource.externalUrl && (
                        <a
                          href={resource.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <Button variant="outline" className="w-full">
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Abrir enlace
                          </Button>
                        </a>
                      )}
                      {resource.fileUrl && !resource.externalUrl && (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <Button variant="outline" className="w-full">
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Abrir archivo
                          </Button>
                        </a>
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
        defaultOrderIndex={nextOrderIndex}
        canMutateContent={canMutateContent}
      />

      <ResourceFormDialog
        isOpen={Boolean(editingResource)}
        onClose={() => setEditingResource(null)}
        mode="edit"
        topicId={topic.id}
        resource={editingResource}
        defaultOrderIndex={nextOrderIndex}
        canMutateContent={canMutateContent}
      />

      <DeleteResourceDialog
        isOpen={Boolean(deletingResource)}
        onClose={() => setDeletingResource(null)}
        resource={deletingResource}
      />
    </>
  );
}
