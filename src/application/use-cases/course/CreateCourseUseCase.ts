import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CreateCourseInput } from "@/src/core/types/course.types";

export interface CreateCourseResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class CreateCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(input: CreateCourseInput): Promise<CreateCourseResult> {
    try {
      // Verify current user is admin
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "No hay usuario autenticado",
        };
      }

      const currentProfile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );
      if (!currentProfile || !currentProfile.isAdmin()) {
        return {
          success: false,
          error: "No tienes permisos para crear cursos",
        };
      }

      // Validate dates
      const startDate = new Date(input.start_date);
      const endDate = new Date(input.end_date);

      if (endDate <= startDate) {
        return {
          success: false,
          error: "La fecha de fin debe ser posterior a la fecha de inicio",
        };
      }

      // Create course
      const course = await this.courseRepository.createCourse(input);

      return {
        success: true,
        course,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear curso",
      };
    }
  }
}
