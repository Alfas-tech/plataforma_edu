"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, UserPlus, UserMinus, Calendar, Trash2, KeyRound, Loader2, Mail } from "lucide-react";
import Image from "next/image";
import { promoteToTeacher, demoteToStudent } from "@/src/presentation/actions/profile.actions";
import { deleteUser, sendPasswordResetEmail } from "@/src/presentation/actions/user-management.actions";
import { useRouter } from "next/navigation";
import { CreateUserDialog } from "./CreateUserDialog";

interface UserData {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  displayName: string;
  createdAt: string;
}

interface UserManagementClientProps {
  students: UserData[];
  teachers: UserData[];
}

export function UserManagementClient({ students, teachers }: UserManagementClientProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [action, setAction] = useState<'promote' | 'demote' | 'delete' | 'reset-password' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handlePromoteClick = (user: UserData) => {
    setSelectedUser(user);
    setAction('promote');
    setError(null);
    setSuccess(null);
  };

  const handleDemoteClick = (user: UserData) => {
    setSelectedUser(user);
    setAction('demote');
    setError(null);
    setSuccess(null);
  };

  const handleDeleteClick = (user: UserData) => {
    setSelectedUser(user);
    setAction('delete');
    setError(null);
    setSuccess(null);
  };

  const handleResetPasswordClick = (user: UserData) => {
    setSelectedUser(user);
    setAction('reset-password');
    setError(null);
    setSuccess(null);
  };

  const handleConfirm = async () => {
    if (!action || !selectedUser) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let result;

      if (action === 'promote') {
        result = await promoteToTeacher(selectedUser.id);
      } else if (action === 'demote') {
        result = await demoteToStudent(selectedUser.id);
      } else if (action === 'delete') {
        result = await deleteUser(selectedUser.id);
      } else if (action === 'reset-password') {
        result = await sendPasswordResetEmail(selectedUser.id);
      }

      if (result && 'error' in result) {
        setError(result.error || 'Error en la operación');
      } else {
        // Success
        if (result && 'message' in result && typeof result.message === 'string') {
          setSuccess(result.message);
        } else {
          setSuccess(
            action === 'promote' ? 'Usuario promovido a docente' :
            action === 'demote' ? 'Usuario degradado a estudiante' :
            action === 'delete' ? 'Usuario eliminado exitosamente' :
            'Acción completada'
          );
        }

        // Wait a bit to show success message, then close and refresh
        setTimeout(() => {
          setSelectedUser(null);
          setAction(null);
          setSuccess(null);
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError('Error inesperado al realizar la acción');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setAction(null);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      {/* Create User Button */}
      <div className="mb-6">
        <Button 
          onClick={() => setIsCreateDialogOpen(true)} 
          className="bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Crear Nuevo Usuario
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Estudiantes ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No hay estudiantes registrados
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border bg-white p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      {student.avatarUrl ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full">
                          <Image
                            src={student.avatarUrl}
                            alt={student.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                          {student.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800">
                          {student.displayName}
                        </p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(student.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePromoteClick(student)}
                        className="whitespace-nowrap"
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Promover
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPasswordClick(student)}
                      >
                        <KeyRound className="mr-1 h-3 w-3" />
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(student)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teachers Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              Docentes ({teachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No hay docentes registrados
              </div>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between rounded-lg border bg-white p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      {teacher.avatarUrl ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full">
                          <Image
                            src={teacher.avatarUrl}
                            alt={teacher.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
                          {teacher.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-800">
                          {teacher.displayName}
                        </p>
                        <p className="text-xs text-slate-500">{teacher.email}</p>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(teacher.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoteClick(teacher)}
                        className="whitespace-nowrap"
                      >
                        <UserMinus className="mr-1 h-3 w-3" />
                        Degradar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPasswordClick(teacher)}
                      >
                        <KeyRound className="mr-1 h-3 w-3" />
                        Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(teacher)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Promote/Demote Confirmation Dialog */}
      <Dialog open={action === 'promote' || action === 'demote'} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'promote' ? 'Promover a Docente' : 'Degradar a Estudiante'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  ¿Estás seguro de que quieres{' '}
                  {action === 'promote' ? 'promover' : 'degradar'} a{' '}
                  <strong>{selectedUser.displayName}</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={action === 'delete'} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  ¿Estás seguro de que quieres eliminar a{' '}
                  <strong>{selectedUser.displayName}</strong>? Esta acción no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={action === 'reset-password'} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Restablecimiento</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Se enviará un email a <strong>{selectedUser.email}</strong> para
                  restablecer su contraseña.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {success}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
