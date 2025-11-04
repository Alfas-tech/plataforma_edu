import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { UpdateTopicInput as RepositoryUpdateTopicInput } from "@/src/core/types/course.types";

export interface UpdateTopicParams extends RepositoryUpdateTopicInput {}

export interface UpdateTopicResult {
  success: boolean;
  topic?: CourseTopicEntity;
  error?: string;
}

export class UpdateTopicUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    topicId: string,
    input: UpdateTopicParams
  ): Promise<UpdateTopicResult> {
    try {
      const topic = await this.courseRepository.getTopicById(topicId);
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
          error: "No tienes permisos para actualizar tópicos",
        };
      }

      const version = await this.courseRepository.getCourseVersionById(
        topic.courseVersionId
      );

      if (!version) {
        return {
          success: false,
          error: "Versión del curso no encontrada",
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

      const updatedTopic = await this.courseRepository.updateTopic(
        topicId,
        input
      );

      return {
        success: true,
        topic: updatedTopic,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al actualizar tópico",
      };
    }
  }
}
