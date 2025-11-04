import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";

export interface GetTopicsByCourseResult {
  success: boolean;
  topics?: CourseTopicEntity[];
  courseVersionId?: string;
  error?: string;
}

export class GetTopicsByCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    courseId: string,
    options?: { courseVersionId?: string }
  ): Promise<GetTopicsByCourseResult> {
    try {
      const course = await this.courseRepository.getCourseById(courseId);
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
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

      let targetVersionId: string | null = null;

      if (options?.courseVersionId) {
        const version = await this.courseRepository.getCourseVersionById(
          options.courseVersionId
        );

        if (!version || version.courseId !== course.id) {
          return {
            success: false,
            error: "La versión seleccionada no pertenece al curso",
          };
        }

        targetVersionId = version.id;
      } else {
        targetVersionId = course.activeVersion?.id ?? null;
      }

      if (!targetVersionId) {
        return {
          success: false,
          error: "El curso no tiene una versión activa",
        };
      }

      if (profile.isTeacher()) {
        const isAssigned =
          await this.courseRepository.isTeacherAssignedToVersion(
            targetVersionId,
            currentUser.id
          );

        if (!isAssigned) {
          return {
            success: false,
            error: "No estás asignado a esta versión del curso",
          };
        }
      }

      const topics = await this.courseRepository.listTopics(targetVersionId);

      return {
        success: true,
        topics,
        courseVersionId: targetVersionId,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener tópicos",
      };
    }
  }
}
