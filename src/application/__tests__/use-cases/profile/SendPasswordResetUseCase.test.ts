import { SendPasswordResetUseCase } from "@/src/application/use-cases/profile/SendPasswordResetUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("SendPasswordResetUseCase", () => {
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let sendPasswordResetUseCase: SendPasswordResetUseCase;

  beforeEach(() => {
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

    sendPasswordResetUseCase = new SendPasswordResetUseCase(
      mockAuthRepository,
      mockProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const userId = "user-123";
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

    const mockUserProfile = new ProfileEntity(
      userId,
      "user@example.com",
      "User",
      null,
      "student",
      new Date(),
      new Date()
    );

    it("should validate admin permissions and user existence", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockUserProfile);

      const result = await sendPasswordResetUseCase.execute(userId);

      expect(result.success).toBe(true);
      expect(result.error).toBe(
        "Esta funcionalidad requiere configuración adicional en Supabase"
      );
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await sendPasswordResetUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
    });

    it("should return error when user is not admin", async () => {
      const teacherProfile = new ProfileEntity(
        "user-123",
        "teacher@example.com",
        "Teacher User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );

      const result = await sendPasswordResetUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los administradores pueden enviar emails de restablecimiento"
      );
    });

    it("should return error when user not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(null);

      const result = await sendPasswordResetUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Usuario no encontrado");
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockRejectedValue(
        new Error("Database error")
      );

      const result = await sendPasswordResetUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockRejectedValue("Unknown error");

      const result = await sendPasswordResetUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al enviar email");
    });
  });
});
