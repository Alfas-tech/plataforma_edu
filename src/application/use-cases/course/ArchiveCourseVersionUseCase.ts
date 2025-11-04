import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ArchiveCourseVersionInput } from "@/src/core/types/course.types";

export interface ArchiveCourseVersionRequest
  extends Omit<ArchiveCourseVersionInput, "archivedBy"> {}

export interface ArchiveCourseVersionResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class ArchiveCourseVersionUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    input: ArchiveCourseVersionRequest
  ): Promise<ArchiveCourseVersionResult> {
    try {
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "No hay usuario autenticado" };
      }

      const profile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );

      if (!profile || !profile.isAdmin()) {
        return {
          success: false,
          error: "No tienes permisos para archivar versiones",
        };
      }

      const version = await this.courseRepository.getCourseVersionById(
        input.versionId
      );

      if (!version) {
        return { success: false, error: "Versión no encontrada" };
      }

      if (version.isArchived()) {
        return {
          success: false,
          error: "La versión ya está archivada",
        };
      }

      const payload: ArchiveCourseVersionInput = {
        ...input,
        archivedBy: currentUser.id,
      };

      const course = await this.courseRepository.archiveCourseVersion(payload);

      return {
        success: true,
        course,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al archivar la versión del curso",
      };
    }
  }
}
