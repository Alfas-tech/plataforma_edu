import { AssignTeacherToCourseUseCase } from "@/src/application/use-cases/course/AssignTeacherToCourseUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { CourseEntity } from "@/src/core/entities/Course.entity";

describe("AssignTeacherToCourseUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let assignTeacherToCourseUseCase: AssignTeacherToCourseUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      getCourseById: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacher: jest.fn(),
      removeTeacher: jest.fn(),
      getCourseTeachers: jest.fn(),
      getTeacherCourses: jest.fn(),
      getActiveCourse: jest.fn(),
    } as any;

    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    } as any;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getProfileByEmail: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      getAllProfiles: jest.fn(),
      updateProfile: jest.fn(),
      updateRole: jest.fn(),
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
    } as any;

    assignTeacherToCourseUseCase = new AssignTeacherToCourseUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const mockUser = new UserEntity(
      "admin-123",
      "admin@example.com",
      "Admin User"
    );
    const mockAdminProfile = new ProfileEntity(
      "admin-123",
      "admin@example.com",
      "Admin User",
      null,
      "admin",
      new Date(),
      new Date()
    );
    const mockTeacherProfile = new ProfileEntity(
      "teacher-123",
      "teacher@example.com",
      "Teacher User",
      null,
      "teacher",
      new Date(),
      new Date()
    );
    const mockCourse = new CourseEntity(
      "course-123",
      "Test Course",
      "Description",
      new Date(),
      new Date(),
      true,
      "admin-123",
      new Date(),
      new Date()
    );

    it("should assign teacher to course when user is admin", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([]);
      mockCourseRepository.assignTeacher.mockResolvedValue(undefined);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(true);
      expect(mockCourseRepository.assignTeacher).toHaveBeenCalledWith(
        "course-123",
        "teacher-123"
      );
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
    });

    it("should return error when user is not admin", async () => {
      const teacherProfile = new ProfileEntity(
        "user-123",
        "user@example.com",
        "User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los administradores pueden asignar docentes"
      );
    });

    it("should return error when teacher profile not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(null);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil de docente no encontrado");
    });

    it("should return error when user is not a teacher", async () => {
      const studentProfile = new ProfileEntity(
        "student-123",
        "student@example.com",
        "Student User",
        null,
        "student",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(studentProfile);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "student-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("El usuario no es un docente");
    });

    it("should return error when course not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(null);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Curso no encontrado");
    });

    it("should return error when teacher is already assigned", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue(["teacher-123"]);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("El docente ya está asignado a este curso");
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([]);
      mockCourseRepository.assignTeacher.mockRejectedValue(
        new Error("Database error")
      );

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([]);
      mockCourseRepository.assignTeacher.mockRejectedValue("Unknown error");

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al asignar docente");
    });
  });
});
