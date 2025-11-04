import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseResourceEntity } from "@/src/core/entities/CourseResource.entity";
import { AddResourceInput as RepositoryAddResourceInput } from "@/src/core/types/course.types";

export interface CreateResourceParams {
  topicId: string;
  title: string;
  description?: string | null;
  resourceType: RepositoryAddResourceInput["resourceType"];
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  externalUrl?: string | null;
  orderIndex?: number;
}

export interface CreateResourceResult {
  success: boolean;
  resource?: CourseResourceEntity;
  error?: string;
}

export class CreateResourceUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(input: CreateResourceParams): Promise<CreateResourceResult> {
    try {
      const topic = await this.courseRepository.getTopicById(input.topicId);
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
          error: "No tienes permisos para crear recursos",
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

      const payload: RepositoryAddResourceInput = {
        topicId: input.topicId,
        title: input.title,
        description: input.description ?? null,
        resourceType: input.resourceType,
        fileUrl: input.fileUrl ?? null,
        fileName: input.fileName ?? null,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType ?? null,
        externalUrl: input.externalUrl ?? null,
        orderIndex: input.orderIndex,
        createdBy: currentUser.id,
      };

      const resource = await this.courseRepository.addResource(payload);

      return {
        success: true,
        resource,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al crear recurso",
      };
    }
  }
}
