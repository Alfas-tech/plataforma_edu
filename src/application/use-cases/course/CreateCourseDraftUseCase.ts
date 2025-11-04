import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { CreateCourseDraftInput } from "@/src/core/types/course.types";

export interface CreateCourseDraftRequest
  extends Omit<CreateCourseDraftInput, "createdBy"> {}

export interface CreateCourseDraftResult {
  success: boolean;
  draft?: CourseVersionEntity;
  error?: string;
}

export class CreateCourseDraftUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    input: CreateCourseDraftRequest
  ): Promise<CreateCourseDraftResult> {
    try {
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: "No hay usuario autenticado" };
      }

      const profile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );

      if (!profile || (!profile.isAdmin() && !profile.isEditor() && !profile.isTeacher())) {
        return {
          success: false,
          error: "No tienes permisos para crear borradores",
        };
      }

    const payload: CreateCourseDraftInput = {
        ...input,
        createdBy: currentUser.id,
      };

      const draft = await this.courseRepository.createDraftVersion(payload);

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
            : "Error al crear el borrador del curso",
      };
    }
  }
}
