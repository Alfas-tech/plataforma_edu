import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { PublishCourseVersionInput } from "@/src/core/types/course.types";

export interface PublishCourseVersionRequest
  extends Omit<PublishCourseVersionInput, "publishedBy"> {}

export interface PublishCourseVersionResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class PublishCourseVersionUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    input: PublishCourseVersionRequest
  ): Promise<PublishCourseVersionResult> {
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
          error: "No tienes permisos para publicar versiones",
        };
      }

      const version = await this.courseRepository.getCourseVersionById(
        input.versionId
      );

      if (!version) {
        return { success: false, error: "Versión no encontrada" };
      }

      if (!version.isDraft()) {
        return {
          success: false,
          error: "Solo se pueden publicar versiones en borrador",
        };
      }

      const payload: PublishCourseVersionInput = {
        ...input,
        publishedBy: currentUser.id,
      };

      const course = await this.courseRepository.publishCourseVersion(payload);

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
            : "Error al publicar la versión del curso",
      };
    }
  }
}
