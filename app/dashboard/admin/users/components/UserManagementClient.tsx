"use client";

import { useState, useMemo } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Users,
  GraduationCap,
  Calendar,
  Trash2,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  Edit3,
  Search,
  Filter,
} from "lucide-react";
import Image from "next/image";
import {
  changeUserRole,
} from "@/src/presentation/actions/profile.actions";
import {
  deleteUser,
  sendPasswordResetEmail,
} from "@/src/presentation/actions/user-management.actions";
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
  editors: UserData[];
  admins: UserData[];
  currentUserId: string;
}

const ROLE_COLORS = {
  student: {
    bg: "from-blue-500 to-purple-600",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    label: "Estudiante",
    icon: <Users className="h-5 w-5 text-blue-600" />,
  },
  teacher: {
    bg: "from-emerald-500 to-teal-600",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "Docente",
    icon: <GraduationCap className="h-5 w-5 text-emerald-600" />,
  },
  editor: {
    bg: "from-purple-500 to-indigo-600",
    badge: "border-purple-200 bg-purple-50 text-purple-700",
    label: "Editor",
    icon: <Edit3 className="h-5 w-5 text-purple-600" />,
  },
  admin: {
    bg: "from-red-500 to-pink-600",
    badge: "border-red-200 bg-red-50 text-red-700",
    label: "Administrador",
    icon: <Shield className="h-5 w-5 text-red-600" />,
  },
};

export function UserManagementClient({
  students,
  teachers,
  editors,
  admins,
  currentUserId,
}: UserManagementClientProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [action, setAction] = useState<
    "change-role" | "delete" | "reset-password" | null
  >(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // New states for filtering and search
  const [selectedFilter, setSelectedFilter] = useState<"all" | "student" | "teacher" | "editor" | "admin">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Combine all users
  const allUsers = useMemo(() => {
    return [...students, ...teachers, ...editors, ...admins];
  }, [students, teachers, editors, admins]);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let users = allUsers;

    // Filter by role
    if (selectedFilter !== "all") {
      users = users.filter(user => user.role === selectedFilter);
    }

    // Search by name or email
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        user =>
          user.displayName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    return users;
  }, [allUsers, selectedFilter, searchQuery]);

  // Count users by role
  const roleCounts = useMemo(() => ({
    all: allUsers.length,
    student: students.length,
    teacher: teachers.length,
    editor: editors.length,
    admin: admins.length,
  }), [allUsers.length, students.length, teachers.length, editors.length, admins.length]);

  const handleChangeRoleClick = (user: UserData) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setAction("change-role");
    setError(null);
    setSuccess(null);
  };

  const handleDeleteClick = (user: UserData) => {
    setSelectedUser(user);
    setAction("delete");
    setError(null);
    setSuccess(null);
  };

  const handleResetPasswordClick = (user: UserData) => {
    setSelectedUser(user);
    setAction("reset-password");
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

      if (action === "change-role") {
        if (!selectedRole) {
          setError("Por favor selecciona un rol");
          setIsLoading(false);
          return;
        }
        result = await changeUserRole(selectedUser.id, selectedRole as "admin" | "teacher" | "editor" | "student");
      } else if (action === "delete") {
        result = await deleteUser(selectedUser.id);
      } else if (action === "reset-password") {
        result = await sendPasswordResetEmail(selectedUser.id);
      }

      if (result && "error" in result) {
        setError(result.error || "Error en la operación");
      } else {
        let successMessage: string;

        if (
          result &&
          "message" in result &&
          typeof result.message === "string"
        ) {
          successMessage = result.message;
        } else {
          successMessage =
            action === "change-role"
              ? "Rol actualizado exitosamente"
              : action === "delete"
                ? "Usuario eliminado exitosamente"
                : "Acción completada";
        }

        setSuccess(successMessage);
      }
    } catch (err) {
      setError("Error inesperado al realizar la acción");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedUser(null);
    setAction(null);
    setSelectedRole("");
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  };

  const handleCloseAfterSuccess = () => {
    router.refresh();
    handleCancel();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Search Header and Create User Button */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Create User Button */}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Users className="mr-2 h-4 w-4" />
          Crear Usuario
        </Button>
      </div>

      {/* Role Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("all")}
          className={selectedFilter === "all" ? "bg-slate-800" : ""}
        >
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Todos ({roleCounts.all})
        </Button>
        
        <Button
          variant={selectedFilter === "student" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("student")}
          className={selectedFilter === "student" ? "bg-blue-600 hover:bg-blue-700" : "border-blue-200 text-blue-700 hover:bg-blue-50"}
        >
          <Users className="mr-1.5 h-3.5 w-3.5" />
          Estudiantes ({roleCounts.student})
        </Button>

        <Button
          variant={selectedFilter === "teacher" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("teacher")}
          className={selectedFilter === "teacher" ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}
        >
          <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
          Docentes ({roleCounts.teacher})
        </Button>

        <Button
          variant={selectedFilter === "editor" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("editor")}
          className={selectedFilter === "editor" ? "bg-purple-600 hover:bg-purple-700" : "border-purple-200 text-purple-700 hover:bg-purple-50"}
        >
          <Edit3 className="mr-1.5 h-3.5 w-3.5" />
          Editores ({roleCounts.editor})
        </Button>

        <Button
          variant={selectedFilter === "admin" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("admin")}
          className={selectedFilter === "admin" ? "bg-red-600 hover:bg-red-700" : "border-red-200 text-red-700 hover:bg-red-50"}
        >
          <Shield className="mr-1.5 h-3.5 w-3.5" />
          Administradores ({roleCounts.admin})
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {selectedFilter === "all" 
              ? `Todos los Usuarios (${filteredUsers.length})`
              : `${ROLE_COLORS[selectedFilter].label}s (${filteredUsers.length})`
            }
            {searchQuery && (
              <span className="text-sm font-normal text-slate-500">
                - Resultados de búsqueda
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-500">
                {searchQuery ? "No se encontraron usuarios" : "No hay usuarios registrados"}
              </p>
              {searchQuery && (
                <p className="mt-1 text-xs text-slate-400">
                  Intenta con otro término de búsqueda
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-lg border bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* User Information */}
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-slate-200">
                        <Image
                          src={user.avatarUrl}
                          alt={user.displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS].bg} text-base font-bold text-white ring-2 ring-slate-200`}>
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-900">
                          {user.displayName}
                        </p>
                        <Badge
                          variant="outline"
                          className={`${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS].badge} text-xs font-medium`}
                        >
                          {ROLE_COLORS[user.role as keyof typeof ROLE_COLORS].icon}
                          <span className="ml-1">{ROLE_COLORS[user.role as keyof typeof ROLE_COLORS].label}</span>
                        </Badge>
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                            Tú
                          </Badge>
                        )}
                      </div>
                      {user.email ? (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      ) : (
                        <p className="mt-1 text-xs italic text-slate-400">
                          Correo no disponible
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        Registrado el {formatDate(user.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleChangeRoleClick(user)}
                      disabled={user.id === currentUserId}
                      title={user.id === currentUserId ? "No puedes cambiar tu propio rol" : "Cambiar el rol del usuario"}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Cambiar Rol
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPasswordClick(user)}
                      className="flex-1 sm:flex-none"
                    >
                      <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      disabled={user.id === currentUserId}
                      title={user.id === currentUserId ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:flex-none"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Change Role Dialog */}
      <Dialog open={action === "change-role"} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Selecciona el nuevo rol para{" "}
                  <strong>{selectedUser.displayName}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nuevo Rol
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Estudiante
                  </div>
                </SelectItem>
                <SelectItem value="teacher">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                    Docente
                  </div>
                </SelectItem>
                <SelectItem value="editor">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-purple-600" />
                    Editor
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    Administrador
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {success ? (
              <Button
                onClick={handleCloseAfterSuccess}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading || !selectedRole}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Cambiar Rol
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={action === "delete"} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  ¿Estás seguro de que quieres eliminar a{" "}
                  <strong>{selectedUser.displayName}</strong>? Esta acción no se
                  puede deshacer.
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

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {success ? (
              <Button
                onClick={handleCloseAfterSuccess}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
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
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={action === "reset-password"} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Restablecimiento</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Se enviará un email a <strong>{selectedUser.email}</strong>{" "}
                  para restablecer su contraseña.
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

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            {success ? (
              <Button
                onClick={handleCloseAfterSuccess}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
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
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
