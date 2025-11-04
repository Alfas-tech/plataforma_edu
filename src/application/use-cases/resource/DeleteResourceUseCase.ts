import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

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

      await this.courseRepository.deleteResource(resourceId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al eliminar recurso",
      };
    }
  }
}
