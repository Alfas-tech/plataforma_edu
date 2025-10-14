import { ILessonRepository } from "@/src/core/interfaces/repositories/ILessonRepository";
import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { LessonEntity } from "@/src/core/entities/Lesson.entity";

export interface GetLessonsByModuleResult {
  success: boolean;
  lessons?: LessonEntity[];
  error?: string;
}

export class GetLessonsByModuleUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(moduleId: string): Promise<GetLessonsByModuleResult> {
    try {
      // Verify module exists
      const moduleData = await this.moduleRepository.getModuleById(moduleId);
      if (!moduleData) {
        return {
          success: false,
          error: "Módulo no encontrado",
        };
      }

      // Get current user
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

      // Get all lessons
      const lessons =
        await this.lessonRepository.getLessonsByModuleId(moduleId);

      // Filter based on user role
      if (profile.isStudent()) {
        // Students only see published lessons
        return {
          success: true,
          lessons: lessons.filter((l) => l.isPublished),
        };
      } else {
        // Admins and teachers see all lessons
        return {
          success: true,
          lessons,
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener lecciones",
      };
    }
  }
}
