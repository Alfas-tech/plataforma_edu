import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { deleteResourceFile } from "@/src/presentation/actions/storage.actions";

export interface DeleteResourceResult {
  success: boolean;
  error?: string;
}

export class DeleteResourceUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(resourceId: string): Promise<DeleteResourceResult> {
    try {
      const resource = await this.courseRepository.getResourceById(resourceId);
      if (!resource) {
        return {
          success: false,
          error: "Recurso no encontrado",
        };
      }

      const topic = await this.courseRepository.getTopicById(resource.topicId);
      if (!topic) {
        return {
          success: false,
          error: "Tópico no encontrado",
        };
      }

      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "No hay usuario autenticado",
        };
      }

      const profile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );
      if (!profile) {
        return {
          success: false,
          error: "Perfil no encontrado",
        };
      }

      if (!profile.isAdmin() && !profile.isTeacher() && !profile.isEditor()) {
        return {
          success: false,
          error: "No tienes permisos para eliminar recursos",
        };
      }

      if (profile.isTeacher()) {
        const isAssigned =
          await this.courseRepository.isTeacherAssignedToVersion(
            topic.courseVersionId,
            currentUser.id
          );

        if (!isAssigned) {
          return {
            success: false,
            error: "No estás asignado a esta versión del curso",
          };
        }
      }

      // Si el recurso tiene un archivo asociado, eliminarlo del storage primero
      if (resource.fileUrl) {
        const courseVersion = await this.courseRepository.getCourseVersionById(
          topic.courseVersionId
        );

        if (courseVersion) {
          const deleteFileResult = await deleteResourceFile(
            resource.fileUrl,
            courseVersion.courseId
          );

          if (!deleteFileResult.success) {
            console.warn(
              `No se pudo eliminar el archivo del storage: ${deleteFileResult.error}. Se continuará con la eliminación del recurso.`
            );
            // No retornamos error aquí, continuamos eliminando el recurso de la BD
            // porque es mejor tener huérfanos en storage que registros sin archivos
          }
        }
      }

      await this.courseRepository.deleteResource(resourceId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar recurso",
      };
    }
  }
}
