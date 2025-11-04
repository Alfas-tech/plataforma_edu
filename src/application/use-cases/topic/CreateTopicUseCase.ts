import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { CreateTopicInput as RepositoryCreateTopicInput } from "@/src/core/types/course.types";

export interface CreateTopicParams {
  courseId: string;
  courseVersionId?: string;
  title: string;
  description?: string | null;
  orderIndex?: number;
}

export interface CreateTopicResult {
  success: boolean;
  topic?: CourseTopicEntity;
  error?: string;
}

export class CreateTopicUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(input: CreateTopicParams): Promise<CreateTopicResult> {
    try {
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
          error: "No tienes permisos para crear tópicos",
        };
      }

      const course = await this.courseRepository.getCourseById(input.courseId);
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
        };
      }

      let targetVersionId: string | null = null;

      if (input.courseVersionId) {
        const version = await this.courseRepository.getCourseVersionById(
          input.courseVersionId
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

      const payload: RepositoryCreateTopicInput = {
        courseVersionId: targetVersionId,
        title: input.title,
        description: input.description ?? null,
        orderIndex: input.orderIndex,
        createdBy: currentUser.id,
      };

      const topic = await this.courseRepository.createTopic(payload);

      return {
        success: true,
        topic,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear tópico",
      };
    }
  }
}
