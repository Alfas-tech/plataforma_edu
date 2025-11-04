import { GetAllUsersUseCase } from "@/src/application/use-cases/profile/GetAllUsersUseCase";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("GetAllUsersUseCase", () => {
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let getAllUsersUseCase: GetAllUsersUseCase;

  beforeEach(() => {
    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      getAllEditors: jest.fn(),
      getAllAdmins: jest.fn(),
      updateUserRole: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
    } as any;

    getAllUsersUseCase = new GetAllUsersUseCase(mockProfileRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should return all users successfully", async () => {
      const mockStudents = [
        new ProfileEntity(
          "p1",
          "u1",
          "Student",
          "One",
          "student",
          new Date(),
          new Date()
        ),
        new ProfileEntity(
          "p2",
          "u2",
          "Student",
          "Two",
          "student",
          new Date(),
          new Date()
        ),
      ];

      const mockTeachers = [
        new ProfileEntity(
          "p3",
          "u3",
          "Teacher",
          "One",
          "teacher",
          new Date(),
          new Date()
        ),
      ];

      const mockEditors = [
        new ProfileEntity(
          "p4",
          "u4",
          "Editor",
          "One",
          "editor",
          new Date(),
          new Date()
        ),
      ];

      const mockAdmins = [
        new ProfileEntity(
          "p5",
          "u5",
          "Admin",
          "One",
          "admin",
          new Date(),
          new Date()
        ),
      ];

      mockProfileRepository.getAllStudents.mockResolvedValue(mockStudents);
      mockProfileRepository.getAllTeachers.mockResolvedValue(mockTeachers);
      mockProfileRepository.getAllEditors.mockResolvedValue(mockEditors);
      mockProfileRepository.getAllAdmins.mockResolvedValue(mockAdmins);

      const result = await getAllUsersUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.students).toHaveLength(2);
      expect(result.teachers).toHaveLength(1);
      expect(result.editors).toHaveLength(1);
      expect(result.admins).toHaveLength(1);
    });

    it("should return empty arrays when no users exist", async () => {
      mockProfileRepository.getAllStudents.mockResolvedValue([]);
      mockProfileRepository.getAllTeachers.mockResolvedValue([]);
      mockProfileRepository.getAllEditors.mockResolvedValue([]);
      mockProfileRepository.getAllAdmins.mockResolvedValue([]);

      const result = await getAllUsersUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.students).toEqual([]);
      expect(result.teachers).toEqual([]);
      expect(result.editors).toEqual([]);
      expect(result.admins).toEqual([]);
    });

    it("should handle repository errors gracefully", async () => {
      mockProfileRepository.getAllStudents.mockRejectedValue(
        new Error("Database error")
      );

      const result = await getAllUsersUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockProfileRepository.getAllStudents.mockRejectedValue("Unknown error");

      const result = await getAllUsersUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al obtener usuarios");
    });
  });
});
