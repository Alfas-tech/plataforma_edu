import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { CourseModuleEntity } from '@/src/core/entities/CourseModule.entity';
import { CourseModuleData } from '@/src/core/types/course.types';

export interface UpdateModuleResult {
  success: boolean;
  module?: CourseModuleEntity;
  error?: string;
}

export class UpdateModuleUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(moduleId: string, data: Partial<CourseModuleData>): Promise<UpdateModuleResult> {
    try {
      // Verify module exists
      const moduleData = await this.moduleRepository.getModuleById(moduleId);
      if (!moduleData) {
        return {
          success: false,
          error: 'Módulo no encontrado',
        };
      }

      // Verify current user is admin or assigned teacher
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'No hay usuario autenticado',
        };
      }

      const profile = await this.profileRepository.getProfileByUserId(currentUser.id);
      if (!profile) {
        return {
          success: false,
          error: 'Perfil no encontrado',
        };
      }

      // Admins and assigned teachers can update modules
      if (!profile.isAdmin() && !profile.isTeacher()) {
        return {
          success: false,
          error: 'No tienes permisos para editar módulos',
        };
      }

      // If teacher, check if assigned to the course
      if (profile.isTeacher()) {
        const assignedTeachers = await this.courseRepository.getCourseTeachers(moduleData.courseId);
        if (!assignedTeachers.includes(currentUser.id)) {
          return {
            success: false,
            error: 'No estás asignado a este curso',
          };
        }
      }

      // Handle order_index change with automatic reordering
      if (data.order_index !== undefined && data.order_index !== moduleData.orderIndex) {
        const allModules = await this.moduleRepository.getModulesByCourseId(moduleData.courseId);
        const newOrder = data.order_index;
        const oldOrder = moduleData.orderIndex;

        // Validate new order is within bounds
        if (newOrder < 1 || newOrder > allModules.length) {
          return {
            success: false,
            error: `El orden debe estar entre 1 y ${allModules.length}`,
          };
        }

        // Reorder logic
        if (newOrder < oldOrder) {
          // Moving up (e.g., from 4 to 2): shift modules 2,3 down
          for (const m of allModules) {
            if (m.id === moduleId) continue;
            if (m.orderIndex >= newOrder && m.orderIndex < oldOrder) {
              await this.moduleRepository.updateModule(m.id, {
                order_index: m.orderIndex + 1,
              });
            }
          }
        } else {
          // Moving down (e.g., from 2 to 4): shift modules 3,4 up
          for (const m of allModules) {
            if (m.id === moduleId) continue;
            if (m.orderIndex > oldOrder && m.orderIndex <= newOrder) {
              await this.moduleRepository.updateModule(m.id, {
                order_index: m.orderIndex - 1,
              });
            }
          }
        }
      }

      // Update the module with all data
      const updatedModule = await this.moduleRepository.updateModule(moduleId, data);

      return {
        success: true,
        module: updatedModule,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar módulo',
      };
    }
  }
}
