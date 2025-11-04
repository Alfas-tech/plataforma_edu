"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Edit, PlusCircle, Trash2, GripVertical, ChevronDown, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { TopicFormDialog } from "./TopicFormDialog";
import { DeleteTopicDialog } from "./DeleteTopicDialog";
import { RESOURCE_MANAGEMENT_ENABLED } from "../../../featureFlags";
import { updateTopic, reorderTopics } from "@/src/presentation/actions/content.actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

interface ResourceData {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  resourceType: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  externalUrl: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface TopicData {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  resources?: ResourceData[];
}

interface TopicManagementClientProps {
  courseId: string;
  branchId: string | null;
  courseVersionId: string | null;
  branchName: string;
  isDefaultBranch: boolean;
  isViewingDraftVersion: boolean;
  isViewingPublishedVersion: boolean;
  isViewingArchivedVersion: boolean;
  canEditPublishedVersion: boolean;
  isAdmin: boolean;
  topics: TopicData[];
}

export function TopicManagementClient({
  courseId,
  branchId,
  courseVersionId,
  branchName,
  isDefaultBranch,
  isViewingDraftVersion,
  isViewingPublishedVersion,
  isViewingArchivedVersion,
  canEditPublishedVersion,
  isAdmin,
  topics,
}: TopicManagementClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicData | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<TopicData | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  
  // Estado local para el orden de tópicos (permite reordenamiento visual inmediato)
  const [localTopics, setLocalTopics] = useState<TopicData[]>([]);

  // Inicializar y sincronizar localTopics con topics del servidor
  useEffect(() => {
    const sorted = [...topics].sort((a, b) => a.orderIndex - b.orderIndex);
    setLocalTopics(sorted);
  }, [topics]);

  // Función para toggle de expansión
  const toggleTopicExpansion = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

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

  // Funciones de drag & drop (igual que en DraftEditorClient)
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

    if (!courseVersionId) {
      showToast("No se puede reordenar: versión no especificada", "error");
      setDraggedIndex(null);
      return;
    }

    try {
      // Create new list with moved element
      const newTopics = [...localTopics];
      const [draggedTopic] = newTopics.splice(draggedIndex, 1);
      newTopics.splice(dropIndex, 0, draggedTopic);

      // Update local state first
      setLocalTopics(newTopics);

      // Create updates array with new indices
      const updates = newTopics.map((topic, idx) => ({
        topicId: topic.id,
        orderIndex: idx + 1,
      }));

      const result = await reorderTopics(courseVersionId, updates);
      
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

  // Si estamos viendo una versión publicada Y NO eres admin, mostrar mensaje
  if (isViewingPublishedVersion && !canEditPublishedVersion) {
    return (
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto max-w-2xl">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-blue-500" />
            <h3 className="mb-3 text-xl font-bold text-blue-900">
              Visualización de curso publicado
            </h3>
            <p className="mb-4 text-base text-blue-800">
              Estás viendo la versión activa del curso que los estudiantes están experimentando.
            </p>
            <div className="rounded-lg border border-blue-300 bg-white p-4">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">ℹ️ Información:</span> Los docentes solo pueden 
                editar borradores. Para realizar cambios al contenido publicado, contacta a un administrador 
                o crea un nuevo borrador desde el panel de administración.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {isViewingArchivedVersion ? (
          <>
            <p className="font-semibold text-slate-800">
              📦 Versión archivada - Solo lectura
            </p>
            <p>
              Estás visualizando una versión archivada del curso. Esta versión ya no está activa 
              y su contenido no puede ser editado. Los tópicos se muestran tal como estaban cuando 
              la versión fue archivada.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-slate-800">
              Estás gestionando el contenido de la {branchLabel} del curso.
            </p>
            {isViewingDraftVersion ? (
              <p>
                📝 <strong>Versión borrador</strong> - Los cambios no afectarán a los estudiantes 
                hasta que esta versión sea publicada.
              </p>
            ) : isDefaultBranch ? (
              <p>
                Los cambios impactan a los estudiantes una vez publicados. Utiliza
                ediciones de trabajo para preparar modificaciones sin afectar la
                experiencia vigente.
              </p>
            ) : (
              <p>
                Todo lo que crees o edites aquí solo afectará a esta edición hasta
                que apruebes una fusión hacia la edición principal.
              </p>
            )}
            {!canMutateContent && !isViewingArchivedVersion && (
              <div className="mt-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 mb-2">
                      No puedes editar este contenido
                    </p>
                    {!courseVersionId ? (
                      <>
                        <p className="text-sm text-amber-800 mb-3">
                          Este curso no tiene una versión de borrador activa. Como editor o docente, 
                          necesitas trabajar con una versión borrador para poder agregar o modificar contenido.
                        </p>
                        {!isAdmin && (
                          <Link href={`/dashboard/admin/courses/${courseId}/draft/new`}>
                            <Button size="sm" variant="outline" className="bg-white border-amber-400 hover:bg-amber-100">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Crear borrador
                            </Button>
                          </Link>
                        )}
                      </>
                    ) : isViewingPublishedVersion && !canEditPublishedVersion ? (
                      <>
                        <p className="text-sm text-amber-800 mb-3">
                          Estás viendo la versión publicada del curso. Los editores y docentes 
                          solo pueden modificar borradores. Solicita a un administrador que cree 
                          un nuevo borrador si necesitas hacer cambios.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-amber-800">
                        Esta edición del curso no permite cambios en este momento.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isViewingArchivedVersion && (
        <div className="mb-6">
          <Button
            onClick={() => canMutateContent && setIsCreateDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!canMutateContent}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear nuevo tópico
          </Button>
        </div>
      )}

      {/* Encabezado de tópicos */}
      {localTopics.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">
              Tópicos del curso
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {canMutateContent 
                ? `Arrastra para reordenar · ${localTopics.length} tópico${localTopics.length !== 1 ? "s" : ""}`
                : `${localTopics.length} tópico${localTopics.length !== 1 ? "s" : ""}`
              }
            </p>
          </div>
        </div>
      )}

      {localTopics.length === 0 ? (
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                No hay tópicos creados
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Comienza creando el primer tópico del curso
              </p>
              <Button
                onClick={() => canMutateContent && setIsCreateDialogOpen(true)}
                variant="outline"
                disabled={!canMutateContent}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear primer tópico
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localTopics.map((topic, index) => {
            const isExpanded = expandedTopics.has(topic.id);
            const topicResources = topic.resources || [];
            
            return (
              <Card
                key={topic.id}
                className={`border-2 transition-all ${
                  draggedIndex === index 
                    ? "opacity-50" 
                    : "hover:shadow-lg"
                }`}
              >
                {/* Header del tópico */}
                <CardHeader
                  className={canMutateContent ? "cursor-move" : ""}
                  draggable={canMutateContent}
                  onDragStart={() => canMutateContent && handleDragStart(index)}
                  onDragOver={(e) => canMutateContent && handleDragOver(e, index)}
                  onDrop={(e) => canMutateContent && handleDrop(e, index)}
                  onDragEnd={() => canMutateContent && handleDragEnd()}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {canMutateContent && (
                        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-1">
                          <GripVertical className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-600" />
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleTopicExpansion(topic.id)}
                        className="flex items-start gap-2 flex-1 text-left hover:opacity-70 transition-opacity"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400 mt-1" />
                        ) : (
                          <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 mt-1" />
                        )}
                        
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-600">
                              {index + 1}
                            </span>
                            <CardTitle className="text-xl">{topic.title}</CardTitle>
                            <Badge variant="outline" className="border-slate-300 bg-blue-50 text-blue-700">
                              {topicResources.length} recurso{topicResources.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          {topic.description && (
                            <p className="text-sm text-slate-600">
                              {topic.description}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                    
                    <div className="flex flex-shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => canMutateContent && setEditingTopic(topic)}
                        disabled={!canMutateContent}
                      >
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => canMutateContent && setDeletingTopic(topic)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        disabled={!canMutateContent}
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Contenido expandible: Recursos */}
                {isExpanded && (
                  <CardContent className="border-t border-slate-200 bg-slate-50/50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Recursos del tópico
                      </h4>
                      {canMutateContent && (
                        <Link
                          href={{
                            pathname: `/dashboard/admin/courses/${courseId}/topics/${topic.id}/resources`,
                            query: {
                              branchId: branchId ?? undefined,
                              versionId: courseVersionId ?? undefined,
                            },
                          }}
                        >
                          <Button size="sm" variant="outline" className="bg-white">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Gestionar recursos
                          </Button>
                        </Link>
                      )}
                    </div>

                    {topicResources.length === 0 ? (
                      <div className="py-8 text-center rounded-lg border border-dashed border-slate-300 bg-white">
                        <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                        <p className="text-sm text-slate-600">
                          No hay recursos en este tópico
                        </p>
                        {canMutateContent && (
                          <Link
                            href={{
                              pathname: `/dashboard/admin/courses/${courseId}/topics/${topic.id}/resources`,
                              query: {
                                branchId: branchId ?? undefined,
                                versionId: courseVersionId ?? undefined,
                              },
                            }}
                          >
                            <Button size="sm" variant="ghost" className="mt-3">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Agregar primer recurso
                            </Button>
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topicResources.map((resource, resourceIndex) => {
                          const hasFile = Boolean(resource.fileUrl);
                          const hasExternal = Boolean(resource.externalUrl);
                          const resourceUrl = hasFile ? resource.fileUrl : resource.externalUrl;
                          const isClickable = Boolean(resourceUrl);
                          
                          return (
                            <div
                              key={resource.id}
                              className={`flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-all ${
                                isClickable ? "hover:border-blue-300 hover:shadow-md cursor-pointer" : "hover:border-purple-300 hover:shadow-sm"
                              }`}
                              onClick={() => {
                                if (resourceUrl) {
                                  window.open(resourceUrl, "_blank", "noopener,noreferrer");
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-600 flex-shrink-0">
                                  {resourceIndex + 1}
                                </span>
                                <FileText className={`h-5 w-5 flex-shrink-0 ${isClickable ? "text-blue-600" : "text-slate-400"}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isClickable ? "text-blue-700" : "text-slate-900"}`}>
                                    {resource.title}
                                    {isClickable && (
                                      <span className="ml-2 text-xs text-blue-500">→ Clic para abrir</span>
                                    )}
                                  </p>
                                  {resource.description && (
                                    <p className="text-xs text-slate-500 truncate">
                                      {resource.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {resource.resourceType}
                                    </Badge>
                                    {hasFile && resource.fileName && (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        📎 {resource.fileName}
                                      </Badge>
                                    )}
                                    {hasExternal && (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        🔗 Enlace externo
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <TopicFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
        courseId={courseId}
        courseVersionId={courseVersionId}
      />

      <TopicFormDialog
        isOpen={!!editingTopic}
        onClose={() => setEditingTopic(null)}
        mode="edit"
        courseId={courseId}
        courseVersionId={courseVersionId}
        topic={editingTopic}
      />

      <DeleteTopicDialog
        isOpen={!!deletingTopic}
        onClose={() => setDeletingTopic(null)}
        topic={deletingTopic}
      />
    </>
  );
}
