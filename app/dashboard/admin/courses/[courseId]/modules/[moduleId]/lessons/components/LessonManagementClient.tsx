"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, BookOpen, Eye, EyeOff, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { LessonFormDialog } from "./LessonFormDialog";
import { DeleteLessonDialog } from "./DeleteLessonDialog";

interface LessonData {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  orderIndex: number;
  durationMinutes: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  durationFormatted: string;
}

interface LessonManagementClientProps {
  moduleId: string;
  lessons: LessonData[];
  isAdmin: boolean;
}

export function LessonManagementClient({ moduleId, lessons, isAdmin }: LessonManagementClientProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonData | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<LessonData | null>(null);

  const sortedLessons = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <>
      {/* Create Button */}
      <div className="mb-6">
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nueva Lección
        </Button>
      </div>

      {/* Lessons List */}
      {sortedLessons.length === 0 ? (
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                No hay lecciones creadas
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Comienza creando la primera lección del módulo
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear primera lección
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedLessons.map((lesson) => (
            <Card key={lesson.id} className="border-2 transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600">
                        {lesson.orderIndex}
                      </span>
                      <CardTitle className="text-xl">{lesson.title}</CardTitle>
                      {lesson.isPublished ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Eye className="mr-1 h-3 w-3" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 text-orange-600">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Borrador
                        </Badge>
                      )}
                      {lesson.durationMinutes && (
                        <Badge variant="outline" className="border-slate-300">
                          <Clock className="mr-1 h-3 w-3" />
                          {lesson.durationFormatted}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingLesson(lesson)}
                    >
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingLesson(lesson)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <LessonFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
        moduleId={moduleId}
        maxOrderIndex={lessons.length}
      />

      <LessonFormDialog
        isOpen={!!editingLesson}
        onClose={() => setEditingLesson(null)}
        mode="edit"
        moduleId={moduleId}
        lesson={editingLesson}
        maxOrderIndex={lessons.length}
      />

      <DeleteLessonDialog
        isOpen={!!deletingLesson}
        onClose={() => setDeletingLesson(null)}
        lesson={deletingLesson}
      />
    </>
  );
}

