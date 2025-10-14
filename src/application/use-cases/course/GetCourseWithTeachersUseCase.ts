import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

export interface CourseWithTeachers {
  course: CourseEntity;
  teachers: ProfileEntity[];
}

export interface GetCourseWithTeachersResult {
  success: boolean;
  data?: CourseWithTeachers;
  error?: string;
}

export class GetCourseWithTeachersUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(courseId: string): Promise<GetCourseWithTeachersResult> {
    try {
      // Get course
      const course = await this.courseRepository.getCourseById(courseId);
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
        };
      }

      // Get assigned teacher IDs
      const teacherIds =
        await this.courseRepository.getCourseTeachers(courseId);

      // Get teacher profiles
      const teachers: ProfileEntity[] = [];
      for (const teacherId of teacherIds) {
        const teacher =
          await this.profileRepository.getProfileByUserId(teacherId);
        if (teacher) {
          teachers.push(teacher);
        }
      }

      return {
        success: true,
        data: {
          course,
          teachers,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener curso",
      };
    }
  }
}
