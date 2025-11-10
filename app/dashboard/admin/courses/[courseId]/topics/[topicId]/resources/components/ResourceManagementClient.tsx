"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileAudio2,
  FileCode2,
  FileText,
  Film,
  Image as ImageIcon,
  GripVertical,
  Info,
  Link2,
  PackageOpen,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ResourceFormDialog } from "./ResourceFormDialog";
import { DeleteResourceDialog } from "./DeleteResourceDialog";
import { reorderResources } from "@/src/presentation/actions/content.actions";

interface ResourceData {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  resourceType: "pdf" | "document" | "image" | "audio" | "video" | "link";
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  externalUrl: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface TopicNavigationLink {
  id: string;
  title: string;
}

interface TopicNavigationQuery {
  branchId?: string | null;
  versionId?: string | null;
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
  courseTitle: string;
  previousTopic: TopicNavigationLink | null;
  nextTopic: TopicNavigationLink | null;
  navigationQuery: TopicNavigationQuery;
}

type DragHoverTarget =
  | { type: "slot"; index: number }
  | { type: "overflow"; index: number }
  | { type: "overflowTail" };

type SlotMeta = {
  title: string;
  className: string;
};

const MAX_CANVAS_SLOTS = 4;

const CANVAS_LAYOUT: SlotMeta[] = [
  {
    title: "Foco principal",
    className: "lg:col-span-4 lg:row-span-2 min-h-[320px]",
  },
  {
    title: "Complemento destacado",
    className: "lg:col-span-2 lg:row-span-2 min-h-[320px]",
  },
  {
    title: "Material 3",
    className: "lg:col-span-3 min-h-[200px]",
  },
  {
    title: "Material 4",
    className: "lg:col-span-3 min-h-[200px]",
  },
];

const RESOURCE_TYPE_META: Record<ResourceData["resourceType"], { label: string; icon: typeof FileText }> = {
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

  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, exponent);

  return `${size % 1 === 0 ? size : size.toFixed(1)} ${units[exponent]}`;
}

function partitionResources(resources: ResourceData[]) {
  const slots: Array<ResourceData | null> = Array.from({ length: MAX_CANVAS_SLOTS }, () => null);
  const overflow: ResourceData[] = [];

  const sorted = [...resources].sort((a, b) => a.orderIndex - b.orderIndex);

  sorted.forEach((resource) => {
    const slotPosition = resource.orderIndex - 1;

    if (slotPosition >= 0 && slotPosition < MAX_CANVAS_SLOTS) {
      if (!slots[slotPosition]) {
        slots[slotPosition] = resource;
        return;
      }

      const fallbackSlot = slots.findIndex((slotResource) => slotResource === null);
      if (fallbackSlot !== -1) {
        slots[fallbackSlot] = resource;
        return;
      }
    }

    overflow.push(resource);
  });

  return { slots, overflow };
}

function rebuildResourcesFromLayout(
  slots: Array<ResourceData | null>,
  overflow: ResourceData[]
): ResourceData[] {
  const nextResources: ResourceData[] = [];

  slots.forEach((resource, slotIndex) => {
    if (resource) {
      nextResources.push({
        ...resource,
        orderIndex: slotIndex + 1,
      });
    }
  });

  overflow.forEach((resource, overflowIndex) => {
    nextResources.push({
      ...resource,
      orderIndex: MAX_CANVAS_SLOTS + overflowIndex + 1,
    });
  });

  return nextResources;
}

function InlinePreview({ resource }: { resource: ResourceData }) {
  const suppressParent = (
    event:
      | ReactPointerEvent<HTMLElement>
      | ReactWheelEvent<HTMLElement>
      | ReactDragEvent<HTMLElement>
  ) => {
    event.stopPropagation();
  };

  const wrapperClass = "pointer-events-auto flex h-full w-full items-center justify-center bg-slate-900/70 p-4";

  const mimeType = resource.mimeType ?? "";

  if (resource.fileUrl) {
    if (mimeType.includes("pdf") || resource.resourceType === "pdf") {
      return (
        <iframe
          src={`${resource.fileUrl}#toolbar=1&navpanes=0`}
          title={resource.title}
          className="h-full w-full rounded-2xl border-0 bg-white"
          onPointerDown={suppressParent}
          onPointerUp={suppressParent}
          onWheel={suppressParent}
        />
      );
    }

    if (mimeType.startsWith("video/") || resource.resourceType === "video") {
      return (
        <div
          className={wrapperClass}
          onPointerDown={suppressParent}
          onPointerUp={suppressParent}
          onClick={suppressParent}
          onWheel={suppressParent}
        >
          <video controls className="h-full w-full object-contain" src={resource.fileUrl} />
        </div>
      );
    }

    if (mimeType.startsWith("audio/") || resource.resourceType === "audio") {
      return (
        <div
          className={`${wrapperClass} flex-col gap-3 text-slate-200`}
          onPointerDown={suppressParent}
          onPointerUp={suppressParent}
          onClick={suppressParent}
          onWheel={suppressParent}
        >
          <FileAudio2 className="h-12 w-12 text-purple-200" />
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-200/80">Audio</span>
        </div>
      );
    }

    if (mimeType.startsWith("image/") || resource.resourceType === "image") {
      return (
        <div
          className={wrapperClass}
          onPointerDown={suppressParent}
          onPointerUp={suppressParent}
          onClick={suppressParent}
          onWheel={suppressParent}
        >
          <img
            src={resource.fileUrl}
            alt={resource.title}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      );
    }

    return (
      <div
        className={`${wrapperClass} flex-col gap-3 text-slate-200`}
        onPointerDown={suppressParent}
        onPointerUp={suppressParent}
        onClick={suppressParent}
        onWheel={suppressParent}
      >
        <FileCode2 className="h-10 w-10" />
        <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-200/80">Archivo</span>
      </div>
    );
  }

  if (resource.externalUrl) {
    return (
      <div
        className={`${wrapperClass} flex-col gap-3 text-slate-200`}
        onPointerDown={suppressParent}
        onPointerUp={suppressParent}
        onClick={suppressParent}
        onWheel={suppressParent}
      >
        <Link2 className="h-10 w-10" />
        <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-200/80">Enlace externo</span>
      </div>
    );
  }

  return (
    <div
      className={`${wrapperClass} flex-col gap-3 text-slate-200`}
      onPointerDown={suppressParent}
      onPointerUp={suppressParent}
      onClick={suppressParent}
      onWheel={suppressParent}
    >
      <PackageOpen className="h-10 w-10" />
      <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-200/80">Sin vista previa</span>
    </div>
  );
}

interface CanvasSlotProps {
  slotIndex: number;
  slotMeta: SlotMeta;
  resource: ResourceData | null;
  canMutate: boolean;
  isSelected: boolean;
  isDragOver: boolean;
  onSelect: (resourceId: string) => void;
  onInspect: (resource: ResourceData) => void;
  onEdit: (resource: ResourceData) => void;
  onDelete: (resource: ResourceData) => void;
  onDragStart: (event: ReactDragEvent<HTMLElement>, resourceId: string) => void;
  onDragOver: (event: ReactDragEvent<HTMLDivElement>, slotIndex: number) => void;
  onDrop: (event: ReactDragEvent<HTMLDivElement>, slotIndex: number) => void;
  onDragEnd: () => void;
}

function CanvasSlot({
  slotIndex,
  slotMeta,
  resource,
  canMutate,
  isSelected,
  isDragOver,
  onSelect,
  onInspect,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CanvasSlotProps) {
  return (
    <div
      className={cn(
        "group relative flex min-h-[200px] flex-col overflow-hidden rounded-3xl border bg-slate-900/5 transition",
        slotMeta.className,
        resource
          ? cn(
              "border-slate-200",
              isSelected && "ring-2 ring-purple-500/60",
              isDragOver && "ring-2 ring-purple-400/70 border-purple-300/60"
            )
          : cn(
              "border-dashed border-slate-300 bg-slate-100/70",
              isDragOver && "ring-2 ring-purple-300 border-purple-200"
            )
      )}
      onDragOver={(event) => canMutate && onDragOver(event, slotIndex)}
      onDrop={(event) => canMutate && onDrop(event, slotIndex)}
      onClick={() => resource && onSelect(resource.id)}
    >
      {resource ? (
        <>
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <InlinePreview resource={resource} />
          </div>

          <div className="pointer-events-none absolute left-4 bottom-4">
            <div className="inline-flex max-w-full items-center rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
              <span className="truncate">{resource.title}</span>
            </div>
          </div>

          <div
            className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-1 text-white opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          >
            {canMutate && (
              <button
                type="button"
                draggable={canMutate}
                onDragStart={(event) => onDragStart(event, resource.id)}
                onDragEnd={onDragEnd}
                className="rounded-full bg-slate-900/70 p-2 transition hover:bg-slate-900"
                title="Reordenar"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            {(resource.fileUrl || resource.externalUrl) && (
              <a
                href={resource.externalUrl || resource.fileUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-slate-900/70 p-2 transition hover:bg-slate-900"
                onClick={(event) => event.stopPropagation()}
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onInspect(resource);
              }}
              className="rounded-full bg-slate-900/70 p-2 transition hover:bg-slate-900"
            >
              <Info className="h-4 w-4" />
            </button>
            {canMutate && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(resource);
                  }}
                  className="rounded-full bg-slate-900/70 p-2 transition hover:bg-slate-900"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(resource);
                  }}
                  className="rounded-full bg-red-600/80 p-2 transition hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
          <PackageOpen className="h-8 w-8" />
          <span className="text-xs font-semibold uppercase tracking-[0.24em]">{slotMeta.title}</span>
          <span className="text-[11px]">Arrastra un recurso aquí</span>
        </div>
      )}
    </div>
  );
}

interface OverflowResourceRowProps {
  resource: ResourceData;
  resourceIndex: number;
  canMutate: boolean;
  isSelected: boolean;
  isDragOver: boolean;
  onSelect: (resourceId: string) => void;
  onInspect: (resource: ResourceData) => void;
  onEdit: (resource: ResourceData) => void;
  onDelete: (resource: ResourceData) => void;
  onDragStart: (event: ReactDragEvent<HTMLElement>, resourceId: string) => void;
  onDragOver: (event: ReactDragEvent<HTMLDivElement>, resourceIndex: number) => void;
  onDrop: (event: ReactDragEvent<HTMLDivElement>, resourceIndex: number) => void;
  onDragEnd: () => void;
}

function OverflowResourceRow({
  resource,
  resourceIndex,
  canMutate,
  isSelected,
  isDragOver,
  onSelect,
  onInspect,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: OverflowResourceRowProps) {
  const meta = RESOURCE_TYPE_META[resource.resourceType];
  const sizeLabel = formatFileSize(resource.fileSize);

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm transition",
        isSelected && "ring-2 ring-purple-500/60",
        isDragOver && "border-purple-300/60 ring-2 ring-purple-300/60"
      )}
      onDragOver={(event) => canMutate && onDragOver(event, resourceIndex)}
      onDrop={(event) => canMutate && onDrop(event, resourceIndex)}
      onClick={() => onSelect(resource.id)}
    >
      <div className="flex flex-1 items-start gap-3">
        <span className="mt-1 text-xs font-semibold text-slate-400">#{resource.orderIndex}</span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-900">{resource.title}</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{meta.label}</span>
            {sizeLabel && <span>{sizeLabel}</span>}
            {resource.externalUrl && <span>Enlace externo</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {canMutate && (
          <button
            type="button"
            draggable={canMutate}
            onDragStart={(event) => onDragStart(event, resource.id)}
            onDragEnd={onDragEnd}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            title="Reordenar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {(resource.fileUrl || resource.externalUrl) && (
          <a
            href={resource.externalUrl || resource.fileUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            onClick={(event) => event.stopPropagation()}
          >
            <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onInspect(resource);
          }}
          className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
        >
          <Info className="h-4 w-4" />
        </button>
        {canMutate && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(resource);
              }}
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
            >
              <PencilLine className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(resource);
              }}
              className="rounded-full bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

interface OverflowDropZoneProps {
  label: string;
  canMutate: boolean;
  isActive: boolean;
  onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
  onDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
}

function OverflowDropZone({ label, canMutate, isActive, onDragOver, onDrop }: OverflowDropZoneProps) {
  if (!canMutate) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-400 transition",
        isActive && "border-purple-300/80 bg-purple-50 text-purple-600"
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {label}
    </div>
  );
}

interface ResourceInfoDialogProps {
  resource: ResourceData | null;
  onClose: () => void;
}

function ResourceInfoDialog({ resource, onClose }: ResourceInfoDialogProps) {
  return (
    <Dialog open={Boolean(resource)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md space-y-4">
        {resource && (
          <>
            <DialogHeader>
              <DialogTitle>{resource.title}</DialogTitle>
              <DialogDescription>
                {RESOURCE_TYPE_META[resource.resourceType].label}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tipo</span>
                <span className="font-medium text-slate-700">
                  {RESOURCE_TYPE_META[resource.resourceType].label}
                </span>
              </div>
              {resource.fileName && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Archivo</span>
                  <span className="font-medium text-slate-700">{resource.fileName}</span>
                </div>
              )}
              {resource.fileSize && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Peso</span>
                  <span className="font-medium text-slate-700">{formatFileSize(resource.fileSize)}</span>
                </div>
              )}
              {resource.mimeType && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">MIME</span>
                  <span className="font-medium text-slate-700">{resource.mimeType}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Actualizado</span>
                <span className="font-medium text-slate-700">
                  {new Date(resource.updatedAt).toLocaleString("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              {resource.externalUrl && (
                <a
                  href={resource.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                  onClick={() => onClose()}
                >
                  <ArrowUpRight className="h-4 w-4" /> Abrir enlace externo
                </a>
              )}
              {resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  download={resource.fileName ?? undefined}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <Download className="h-4 w-4" /> Descargar archivo
                </a>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
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
  courseTitle,
  previousTopic,
  nextTopic,
  navigationQuery,
}: ResourceManagementClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceData | null>(null);
  const [deletingResource, setDeletingResource] = useState<ResourceData | null>(null);
  const [inspectingResource, setInspectingResource] = useState<ResourceData | null>(null);
  const [draggedResourceId, setDraggedResourceId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DragHoverTarget | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [localResources, setLocalResources] = useState<ResourceData[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  useEffect(() => {
    const sorted = [...resources].sort((a, b) => a.orderIndex - b.orderIndex);
    setLocalResources(sorted);
    setSelectedResourceId((previous) => {
      if (previous && sorted.some((resource) => resource.id === previous)) {
        return previous;
      }
      return sorted[0]?.id ?? null;
    });
  }, [resources]);

  const sortedResources = localResources;

  const canMutateContent =
    Boolean(courseVersionId) &&
    !isViewingArchivedVersion &&
    (!isViewingPublishedVersion || canEditPublishedVersion);

  const canMutateResources = canMutateContent && !isReordering;

  const { slots: slotResources, overflow: overflowResources } = useMemo(
    () => partitionResources(sortedResources),
    [sortedResources]
  );

  const nextOrderIndex = useMemo(() => {
    for (let slot = 0; slot < MAX_CANVAS_SLOTS; slot += 1) {
      if (!slotResources[slot]) {
        return slot + 1;
      }
    }

    if (sortedResources.length === 0) {
      return 1;
    }

    const currentMax = sortedResources.reduce((max, resource) => {
      return resource.orderIndex > max ? resource.orderIndex : max;
    }, sortedResources[0].orderIndex);

    return currentMax + 1;
  }, [slotResources, sortedResources]);

  const branchLabel = isDefaultBranch ? "edición principal" : `edición ${branchName}`;

  const buildTopicHref = (topicId: string) => {
    const query: Record<string, string> = {};
    if (navigationQuery.branchId) {
      query.branchId = navigationQuery.branchId;
    }
    if (navigationQuery.versionId) {
      query.versionId = navigationQuery.versionId;
    }

    return {
      pathname: `/dashboard/admin/courses/${courseId}/topics/${topicId}/resources`,
      query,
    } as const;
  };

  const navigateToTopic = (topicLink: TopicNavigationLink | null) => {
    if (!topicLink) return;
    const target = buildTopicHref(topicLink.id);
    const queryString = new URLSearchParams(target.query).toString();
    const url = queryString ? `${target.pathname}?${queryString}` : target.pathname;
    router.push(url);
  };

  const stateBadge = (() => {
    if (isViewingArchivedVersion) {
      return { label: "Versión archivada", tone: "bg-slate-800/70 text-slate-100" };
    }

    if (isViewingDraftVersion) {
      return { label: "Versión borrador", tone: "bg-amber-100 text-amber-700" };
    }

    if (isViewingPublishedVersion) {
      return { label: "Versión publicada", tone: "bg-emerald-100 text-emerald-700" };
    }

    return { label: branchLabel, tone: "bg-slate-100 text-slate-600" };
  })();

  const stateMessage = (() => {
    if (isViewingArchivedVersion) {
      return "Esta versión es solo lectura.";
    }

    if (!canMutateContent) {
      if (isViewingPublishedVersion && !canEditPublishedVersion) {
        return "Solo un administrador puede modificar una versión publicada.";
      }

      return "Activa una versión para editar los recursos.";
    }

    if (isViewingDraftVersion) {
      return "Los cambios quedan en borrador hasta ser publicados.";
    }

    return "Los cambios se publican inmediatamente para los estudiantes.";
  })();

  const handleDragStart = (event: ReactDragEvent<HTMLElement>, resourceId: string) => {
    if (!canMutateResources) return;
    setDraggedResourceId(resourceId);
    setDragOverTarget(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", resourceId);
  };

  const handleDragEnd = () => {
    setDragOverTarget(null);
    setDraggedResourceId(null);
  };

  const performDrop = async (nextTarget: DragHoverTarget) => {
    if (!canMutateResources || isReordering || !draggedResourceId) {
      setDragOverTarget(null);
      setDraggedResourceId(null);
      return;
    }

    const { slots, overflow } = partitionResources(localResources);
    const nextSlots = [...slots];
    const nextOverflow = [...overflow];

    const fromSlotIndex = nextSlots.findIndex((resource) => resource?.id === draggedResourceId);
    let fromOverflowIndex = -1;
    let draggedResource: ResourceData | null = null;

    if (fromSlotIndex !== -1) {
      draggedResource = nextSlots[fromSlotIndex];
      nextSlots[fromSlotIndex] = null;
    } else {
      fromOverflowIndex = nextOverflow.findIndex((resource) => resource.id === draggedResourceId);
      if (fromOverflowIndex !== -1) {
        draggedResource = nextOverflow.splice(fromOverflowIndex, 1)[0] ?? null;
      }
    }

    if (!draggedResource) {
      setDragOverTarget(null);
      setDraggedResourceId(null);
      return;
    }

    switch (nextTarget.type) {
      case "slot": {
        const displaced = nextSlots[nextTarget.index] ?? null;
        nextSlots[nextTarget.index] = draggedResource;

        if (displaced) {
          if (fromSlotIndex !== -1) {
            nextSlots[fromSlotIndex] = displaced;
          } else {
            nextOverflow.splice(nextTarget.index, 0, displaced);
          }
        }
        break;
      }
      case "overflow": {
        let insertIndex = nextTarget.index;
        if (fromOverflowIndex !== -1 && fromOverflowIndex < nextTarget.index) {
          insertIndex = Math.max(0, insertIndex - 1);
        }
        nextOverflow.splice(insertIndex, 0, draggedResource);
        break;
      }
      case "overflowTail": {
        nextOverflow.push(draggedResource);
        break;
      }
    }

    const layoutUnchanged =
      slots.every((resource, index) => resource?.id === nextSlots[index]?.id) &&
      overflow.length === nextOverflow.length &&
      overflow.every((resource, index) => resource.id === nextOverflow[index]?.id);

    setDragOverTarget(null);
    setDraggedResourceId(null);

    if (layoutUnchanged) {
      return;
    }

    const normalized = rebuildResourcesFromLayout(nextSlots, nextOverflow);
    setLocalResources(normalized);
    setSelectedResourceId(draggedResource.id);
    setIsReordering(true);

    try {
      const updates = normalized.map((resource) => ({
        resourceId: resource.id,
        orderIndex: resource.orderIndex,
      }));

      const result = await reorderResources(topic.id, updates);

      if (result.error) {
        showToast(result.error, "error");
        router.refresh();
      } else {
        showToast("Orden actualizado", "success");
      }
    } catch (error) {
      showToast("Error al actualizar el orden", "error");
      router.refresh();
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragOverSlot = (event: ReactDragEvent<HTMLDivElement>, slotIndex: number) => {
    if (!canMutateResources) return;
    event.preventDefault();
    setDragOverTarget({ type: "slot", index: slotIndex });
  };

  const handleDropOnSlot = (event: ReactDragEvent<HTMLDivElement>, slotIndex: number) => {
    if (!canMutateResources) return;
    event.preventDefault();
    void performDrop({ type: "slot", index: slotIndex });
  };

  const handleDragOverOverflow = (
    event: ReactDragEvent<HTMLDivElement>,
    overflowIndex: number
  ) => {
    if (!canMutateResources) return;
    event.preventDefault();
    setDragOverTarget({ type: "overflow", index: overflowIndex });
  };

  const handleDropOnOverflow = (
    event: ReactDragEvent<HTMLDivElement>,
    overflowIndex: number
  ) => {
    if (!canMutateResources) return;
    event.preventDefault();
    void performDrop({ type: "overflow", index: overflowIndex });
  };

  const handleDragOverOverflowTail = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!canMutateResources) return;
    event.preventDefault();
    setDragOverTarget({ type: "overflowTail" });
  };

  const handleDropOnOverflowTail = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!canMutateResources) return;
    event.preventDefault();
    void performDrop({ type: "overflowTail" });
  };

  const canvasItems = CANVAS_LAYOUT.map((slotMeta, index) => {
    const resource = slotResources[index] ?? null;

    return (
      <CanvasSlot
        key={`${slotMeta.title}-${index}`}
        slotIndex={index}
        slotMeta={slotMeta}
        resource={resource}
        canMutate={canMutateResources}
        isSelected={Boolean(resource && resource.id === selectedResourceId)}
        isDragOver={dragOverTarget?.type === "slot" && dragOverTarget.index === index}
        onSelect={setSelectedResourceId}
        onInspect={setInspectingResource}
        onEdit={setEditingResource}
        onDelete={setDeletingResource}
        onDragStart={handleDragStart}
        onDragOver={handleDragOverSlot}
        onDrop={handleDropOnSlot}
        onDragEnd={handleDragEnd}
      />
    );
  });

  const overflowItems = overflowResources.map((resource, overflowIndex) => {
    return (
      <OverflowResourceRow
        key={resource.id}
        resource={resource}
        resourceIndex={overflowIndex}
        canMutate={canMutateResources}
        isSelected={resource.id === selectedResourceId}
        isDragOver={dragOverTarget?.type === "overflow" && dragOverTarget.index === overflowIndex}
        onSelect={setSelectedResourceId}
        onInspect={setInspectingResource}
        onEdit={setEditingResource}
        onDelete={setDeletingResource}
        onDragStart={handleDragStart}
        onDragOver={handleDragOverOverflow}
        onDrop={handleDropOnOverflow}
        onDragEnd={handleDragEnd}
      />
    );
  });

  const showOverflowSection = overflowResources.length > 0 || canMutateResources;

  return (
    <>
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">{topic.title}</span>
            <span
              title={stateMessage}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
                stateBadge.tone
              )}
            >
              {stateBadge.label}
            </span>
            <span className="text-xs text-slate-400">{courseTitle}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {sortedResources.length} recursos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={!previousTopic}
              onClick={() => navigateToTopic(previousTopic)}
              className="h-9 w-9 rounded-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!nextTopic}
              onClick={() => navigateToTopic(nextTopic)}
              className="h-9 w-9 rounded-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => canMutateContent && setIsCreateDialogOpen(true)}
              disabled={!canMutateContent}
              className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo recurso</span>
            </Button>
          </div>
        </header>

        <section className="relative rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          {!canMutateContent && (
            <span className="absolute right-4 top-4 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white">
              Solo lectura
            </span>
          )}

          <div className="grid auto-rows-[minmax(180px,_1fr)] gap-4 lg:grid-cols-6">
            {canvasItems}
          </div>

          {showOverflowSection && (
            <div className="mt-6 space-y-3 rounded-2xl border border-slate-100 bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Material adicional
                </span>
                {overflowResources.length > 0 && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    {overflowResources.length} recursos
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {overflowResources.length > 0 ? (
                  <>
                    {overflowItems}
                    <OverflowDropZone
                      label="Soltar al final"
                      canMutate={canMutateResources}
                      isActive={dragOverTarget?.type === "overflowTail"}
                      onDragOver={handleDragOverOverflowTail}
                      onDrop={handleDropOnOverflowTail}
                    />
                  </>
                ) : canMutateResources ? (
                  <OverflowDropZone
                    label="Arrastra otros recursos aquí"
                    canMutate={canMutateResources}
                    isActive={dragOverTarget?.type === "overflowTail"}
                    onDragOver={handleDragOverOverflowTail}
                    onDrop={handleDropOnOverflowTail}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Sin recursos adicionales
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

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
        resource={editingResource ?? undefined}
        defaultOrderIndex={nextOrderIndex}
        canMutateContent={canMutateContent}
      />

      <DeleteResourceDialog
        isOpen={Boolean(deletingResource)}
        onClose={() => setDeletingResource(null)}
        resource={deletingResource ?? undefined}
      />

      <ResourceInfoDialog
        resource={inspectingResource}
        onClose={() => setInspectingResource(null)}
      />
    </>
  );
}
