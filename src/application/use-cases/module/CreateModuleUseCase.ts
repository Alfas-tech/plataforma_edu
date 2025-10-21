import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseModuleEntity } from "@/src/core/entities/CourseModule.entity";

export interface CreateModuleInput {
  courseId: string;
  courseVersionId?: string;
  title: string;
  description: string | null;
  orderIndex: number;
  content: string | null;
  isPublished: boolean;
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

  const course = await this.courseRepository.getCourseById(input.courseId);
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
        };
      }

      // If teacher, check if assigned to the course
      if (profile.isTeacher()) {
        const assignedTeachers = await this.courseRepository.getCourseTeachers(
          input.courseId
        );
        if (!assignedTeachers.includes(currentUser.id)) {
          return {
            success: false,
            error: "No estás asignado a este curso",
          };
        }
      }

      const targetVersionId =
        input.courseVersionId ?? course.activeVersion?.id ?? null;

      if (!targetVersionId) {
        return {
          success: false,
          error: "El curso no tiene una versión activa",
        };
      }

      // Create module
      const moduleData = await this.moduleRepository.createModule({
        course_id: input.courseId,
        course_version_id: targetVersionId,
        title: input.title,
        description: input.description,
        order_index: input.orderIndex,
        content: input.content,
        is_published: input.isPublished,
      });

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
