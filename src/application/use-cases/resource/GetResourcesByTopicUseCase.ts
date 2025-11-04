import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseResourceEntity } from "@/src/core/entities/CourseResource.entity";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";

export interface GetResourcesByTopicResult {
  success: boolean;
  topic?: CourseTopicEntity;
  resources?: CourseResourceEntity[];
  error?: string;
}

export class GetResourcesByTopicUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(topicId: string): Promise<GetResourcesByTopicResult> {
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

      const resources = await this.courseRepository.listResources(topicId);

      return {
        success: true,
        topic,
        resources,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener recursos",
      };
    }
  }
}
