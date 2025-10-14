"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, BookOpen, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModuleFormDialog } from "./ModuleFormDialog";
import { DeleteModuleDialog } from "./DeleteModuleDialog";

interface ModuleData {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  content: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModuleManagementClientProps {
  courseId: string;
  modules: ModuleData[];
  isAdmin: boolean;
}

function formatContent(content: string | null): string {
  if (!content) return "Sin descripción";
  const maxLength = 100;
  return content.length > maxLength
    ? content.substring(0, maxLength) + "..."
    : content;
}

export function ModuleManagementClient({
  courseId,
  modules,
  isAdmin,
}: ModuleManagementClientProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleData | null>(null);
  const [deletingModule, setDeletingModule] = useState<ModuleData | null>(null);

  const sortedModules = [...modules].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <>
      {/* Create Button */}
      <div className="mb-6">
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Módulo
        </Button>
      </div>

      {/* Modules List */}
      {sortedModules.length === 0 ? (
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                No hay módulos creados
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Comienza creando el primer módulo del curso
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear primer módulo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedModules.map((module) => (
            <Card
              key={module.id}
              className="border-2 transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-sm font-bold text-purple-600">
                        {module.orderIndex}
                      </span>
                      <CardTitle className="text-xl">{module.title}</CardTitle>
                      {module.isPublished ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Eye className="mr-1 h-3 w-3" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-orange-300 text-orange-600"
                        >
                          <EyeOff className="mr-1 h-3 w-3" />
                          Borrador
                        </Badge>
                      )}
                    </div>
                    {module.description && (
                      <p className="text-sm text-slate-600">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <Link
                      href={`/dashboard/admin/courses/${courseId}/modules/${module.id}/lessons`}
                    >
                      <Button size="sm" variant="outline">
                        <BookOpen className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Lecciones</span>
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingModule(module)}
                    >
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingModule(module)}
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
      <ModuleFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
        courseId={courseId}
        maxOrderIndex={modules.length}
      />

      <ModuleFormDialog
        isOpen={!!editingModule}
        onClose={() => setEditingModule(null)}
        mode="edit"
        courseId={courseId}
        module={editingModule}
        maxOrderIndex={modules.length}
      />

      <DeleteModuleDialog
        isOpen={!!deletingModule}
        onClose={() => setDeletingModule(null)}
        module={deletingModule}
      />
    </>
  );
}
