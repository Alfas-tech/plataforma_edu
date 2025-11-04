import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { UpdateCourseDraftInput } from "@/src/core/types/course.types";

export interface UpdateCourseDraftResult {
  success: boolean;
  draft?: CourseVersionEntity;
  error?: string;
}

export class UpdateCourseDraftUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    versionId: string,
    updates: UpdateCourseDraftInput
  ): Promise<UpdateCourseDraftResult> {
    try {
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "No hay usuario autenticado" };
      }

      const profile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );

      if (
        !profile ||
        (!profile.isAdmin() && !profile.isEditor() && !profile.isTeacher())
      ) {
        return {
          success: false,
          error: "No tienes permisos para editar borradores",
        };
      }

      const existing =
        await this.courseRepository.getCourseVersionById(versionId);

      if (!existing) {
        return { success: false, error: "Versión no encontrada" };
      }

      if (!existing.isDraft()) {
        return {
          success: false,
          error: "Solo se pueden editar versiones en borrador",
        };
      }

      const draft = await this.courseRepository.updateDraftVersion(
        versionId,
        updates
      );

      return {
        success: true,
        draft,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al actualizar el borrador del curso",
      };
    }
  }
}
