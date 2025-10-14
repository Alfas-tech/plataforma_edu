import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseModuleEntity } from "@/src/core/entities/CourseModule.entity";

export interface CreateModuleInput {
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  content: string | null;
  is_published: boolean;
}

export interface CreateModuleResult {
  success: boolean;
  module?: CourseModuleEntity;
  error?: string;
}

export class CreateModuleUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(input: CreateModuleInput): Promise<CreateModuleResult> {
    try {
      // Verify current user is admin or assigned teacher
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

      // Admins and assigned teachers can create modules
      if (!profile.isAdmin() && !profile.isTeacher()) {
        return {
          success: false,
          error: "No tienes permisos para crear módulos",
        };
      }

      // If teacher, check if assigned to the course
      if (profile.isTeacher()) {
        const assignedTeachers = await this.courseRepository.getCourseTeachers(
          input.course_id
        );
        if (!assignedTeachers.includes(currentUser.id)) {
          return {
            success: false,
            error: "No estás asignado a este curso",
          };
        }
      }

      // Create module
      const moduleData = await this.moduleRepository.createModule(input);

      return {
        success: true,
        module: moduleData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear módulo",
      };
    }
  }
}
