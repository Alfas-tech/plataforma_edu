"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2, Loader2, GripVertical, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import {
  createCourseDraft,
  updateCourseDraft,
  getDraftById,
} from "@/src/presentation/actions/course.actions";
import {
  getTopicsByVersion,
  createTopic,
  updateTopic,
  deleteTopic,
} from "@/src/presentation/actions/topic.actions";
import { reorderTopics } from "@/src/presentation/actions/content.actions";

interface DraftEditorClientProps {
  courseId: string;
  draftId?: string;
  mode: "create" | "edit";
}

interface TopicForm {
  tempId: string;
  dbId?: string;
  title: string;
  description: string;
  orderIndex: number;
  isNew: boolean;
  isModified: boolean;
}

export function DraftEditorClient({
  courseId,
  draftId,
  mode,
}: DraftEditorClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(draftId);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState<TopicForm[]>([]);

  useEffect(() => {
    if (mode === "edit" && draftId) {
      loadDraftData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, draftId]);

  const loadDraftData = async (explicitId?: string) => {
    const idToLoad = explicitId || draftId || savedDraftId;
    if (!idToLoad) return;

    setIsLoading(true);
    
    // Load draft data
    const draftResult = await getDraftById(idToLoad);
    if ("error" in draftResult) {
      showToast(draftResult.error || "Error al cargar borrador", "error");
      setIsLoading(false);
      return;
    }

    if (draftResult.draft) {
      setTitle(draftResult.draft.title || "");
      setDescription(draftResult.draft.description || "");
    }

    // Load topics
    const topicsResult = await getTopicsByVersion(idToLoad);
    if ("error" in topicsResult) {
      showToast(topicsResult.error || "Error al cargar tópicos", "error");
    } else if (topicsResult.topics) {
      setTopics(
        topicsResult.topics.map((topic, index) => ({
          tempId: `existing-${topic.id}`,
          dbId: topic.id,
          title: topic.title,
          description: topic.description || "",
          orderIndex: topic.orderIndex || index + 1,
          isNew: false,
          isModified: false,
        }))
      );
    }

    setIsLoading(false);
  };

  const handleSave = async () => {
    // Validate title
    if (!title.trim()) {
      showToast("El título del curso es obligatorio", "error");
      return;
    }

    // Validate no empty topics
    const emptyTopics = topics.filter((t) => !t.title.trim());
    if (emptyTopics.length > 0) {
      showToast("Todos los tópicos deben tener un título", "error");
      return;
    }

    // Validate that if there are topics, at least one has content
    if (topics.length > 0) {
      const topicsWithoutTitle = topics.filter((t) => !t.title.trim());
      if (topicsWithoutTitle.length > 0) {
        showToast("Completa el título de todos los tópicos o elimínalos", "error");
        return;
      }
    }

    startTransition(async () => {

      try {
        let currentDraftId = savedDraftId;

        if (mode === "create" && !savedDraftId) {
          const result = await createCourseDraft({
            courseId,
            title: title.trim(),
            description: description.trim() || null,
          });

          if (result && "error" in result) {
            showToast(result.error || "Error desconocido", "error");
            return;
          }

          if (result && "draft" in result && result.draft) {
            currentDraftId = result.draft.id;
            setSavedDraftId(currentDraftId);
            
            // Guardar tópicos si hay alguno
            if (topics.length > 0) {
              await saveTopics(currentDraftId);
            }
            
            showToast("Borrador creado correctamente", "success");
            
            // Redirigir a la página de edición
            router.push(`/dashboard/admin/courses/${courseId}/draft/${currentDraftId}/edit`);
            return;
          }
        } else if (currentDraftId) {
          const result = await updateCourseDraft(currentDraftId, {
            title: title.trim(),
            description: description.trim() || null,
          });

          if (result && "error" in result) {
            showToast(result.error || "Error desconocido", "error");
            return;
          }
          
          await saveTopics(currentDraftId);
          showToast("Cambios guardados correctamente", "success");
        }

        router.refresh();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Error al guardar", "error");
      }
    });
  };

  const saveTopics = async (versionId: string) => {
    for (const topic of topics.filter((t) => t.isNew)) {
      const result = await createTopic({
        courseVersionId: versionId,
        title: topic.title,
        description: topic.description || null,
        orderIndex: topic.orderIndex,
      });

      if ("error" in result) {
        throw new Error(result.error || "Error al crear tópico");
      }
    }

    for (const topic of topics.filter((t) => !t.isNew && t.isModified && t.dbId)) {
      if (!topic.dbId) continue;
      
      const result = await updateTopic(topic.dbId, {
        title: topic.title,
        description: topic.description || null,
      });

      if ("error" in result) {
        throw new Error(result.error || "Error al actualizar tópico");
      }
    }
  };

  const addTopic = () => {
    // Validate no topics without title before adding new one
    const hasEmptyTopics = topics.some((t) => !t.title.trim());
    if (hasEmptyTopics) {
      showToast("Completa el tópico actual antes de agregar uno nuevo", "error");
      return;
    }

    const newTopic: TopicForm = {
      tempId: `new-${Date.now()}`,
      title: "",
      description: "",
      orderIndex: topics.length + 1,
      isNew: true,
      isModified: false,
    };
    setTopics([...topics, newTopic]);
  };

  const updateTopicField = (
    tempId: string,
    field: "title" | "description",
    value: string
  ) => {
    setTopics(
      topics.map((topic) =>
        topic.tempId === tempId
          ? { ...topic, [field]: value, isModified: !topic.isNew }
          : topic
      )
    );
  };

  const removeTopic = async (tempId: string) => {
    const topic = topics.find((t: TopicForm) => t.tempId === tempId);

    if (topic?.dbId) {
      const result = await deleteTopic(topic.dbId);
      if ("error" in result) {
        showToast(result.error || "Error al eliminar tópico", "error");
        return;
      }
    }

    setTopics(topics.filter((t: TopicForm) => t.tempId !== tempId));
    showToast("Tópico eliminado", "success");
  };

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

    const versionId = savedDraftId || draftId;
    if (!versionId) {
      showToast("Guarda el borrador antes de reordenar tópicos", "error");
      setDraggedIndex(null);
      return;
    }

    try {
      // Create new list with moved element
      const newTopics = [...topics];
      const [draggedTopic] = newTopics.splice(draggedIndex, 1);
      newTopics.splice(dropIndex, 0, draggedTopic);

      // Update orderIndex and mark as modified
      const updatedTopics = newTopics.map((topic, idx) => ({
        ...topic,
        orderIndex: idx + 1,
        isModified: !topic.isNew || topic.isModified,
      }));

      // Update local state first
      setTopics(updatedTopics);

      // Save to database only if there are saved topics (with dbId)
      const savedTopics = updatedTopics.filter(t => t.dbId);
      if (savedTopics.length > 0) {
        const updates = savedTopics.map((topic) => ({
          topicId: topic.dbId!,
          orderIndex: topic.orderIndex,
        }));

        const result = await reorderTopics(versionId, updates);
        
        if (result.error) {
          showToast(result.error, "error");
          // Revertir cambios locales si falla
          router.refresh();
        } else {
          showToast("✨ Orden actualizado", "success");
        }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <CardTitle className="text-lg">Información del curso</CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Define el título y descripción general
          </p>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-slate-700">
              Título del curso *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Introducción a Python"
              disabled={isPending}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-slate-700">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe de qué trata el curso, qué aprenderán los estudiantes..."
              rows={4}
              disabled={isPending}
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tópicos del curso</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                Arrastra para reordenar · {topics.length} tópico{topics.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              size="sm"
              onClick={addTopic}
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo tópico
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {topics.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Plus className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Sin tópicos</p>
              <p className="mt-1 text-xs text-slate-500">
                Agrega el primer tópico para organizar el contenido
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topics.map((topic, index) => (
                <div
                  key={topic.tempId}
                  draggable={!isPending}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative bg-white p-4 transition-all hover:bg-slate-50 ${
                    draggedIndex === index ? "opacity-50" : ""
                  } ${!isPending ? "cursor-move" : ""}`}
                >
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <GripVertical className="h-5 w-5 text-slate-400 transition-colors group-hover:text-slate-600" />
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-slate-700">
                          Título del tópico <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          value={topic.title}
                          onChange={(e) =>
                            updateTopicField(topic.tempId, "title", e.target.value)
                          }
                          placeholder="Ej: Introducción a variables"
                          disabled={isPending}
                          className={`mt-1 ${
                            !topic.title.trim() && topics.length > 1
                              ? "border-rose-300 focus-visible:ring-rose-500"
                              : ""
                          }`}
                        />
                        {!topic.title.trim() && topics.length > 1 && (
                          <p className="mt-1 text-xs text-rose-600">
                            El título es obligatorio
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600">
                          Descripción (opcional)
                        </Label>
                        <Textarea
                          value={topic.description}
                          onChange={(e) =>
                            updateTopicField(topic.tempId, "description", e.target.value)
                          }
                          placeholder="Describe lo que aprenderán en este tópico..."
                          rows={2}
                          disabled={isPending}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTopic(topic.tempId)}
                        disabled={isPending}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
        {/* Mensaje de validación */}
        {(!title.trim() || topics.some((t) => !t.title.trim())) && !isPending && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>
              {!title.trim() 
                ? "Completa el título del curso para guardar" 
                : "Completa el título de todos los tópicos para guardar"}
            </p>
          </div>
        )}
        
        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isPending || 
              !title.trim() || 
              topics.some((t) => !t.title.trim())
            }
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
