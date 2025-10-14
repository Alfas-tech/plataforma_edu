import { DeleteUserUseCase } from "@/src/application/use-cases/profile/DeleteUserUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("DeleteUserUseCase", () => {
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let deleteUserUseCase: DeleteUserUseCase;

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

    deleteUserUseCase = new DeleteUserUseCase(
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
      mockProfileRepository.getAllProfiles.mockResolvedValue([
        mockAdminProfile,
        mockUserProfile,
      ]);

      const result = await deleteUserUseCase.execute(userId);

      expect(result.success).toBe(true);
      expect(result.error).toBe(
        "Esta funcionalidad requiere configuración adicional en Supabase"
      );
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await deleteUserUseCase.execute(userId);

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

      const result = await deleteUserUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los administradores pueden eliminar usuarios"
      );
    });

    it("should return error when trying to delete self", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );

      const result = await deleteUserUseCase.execute("admin-123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("No puedes eliminar tu propia cuenta");
    });

    it("should return error when user not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(null);

      const result = await deleteUserUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Usuario no encontrado");
    });

    it("should return error when trying to delete last admin", async () => {
      const adminToDelete = new ProfileEntity(
        userId,
        "admin2@example.com",
        "Admin 2",
        null,
        "admin",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(adminToDelete);
      mockProfileRepository.getAllProfiles.mockResolvedValue([adminToDelete]);

      const result = await deleteUserUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No se puede eliminar al último administrador");
    });

    it("should allow deleting admin when multiple admins exist", async () => {
      const adminToDelete = new ProfileEntity(
        userId,
        "admin2@example.com",
        "Admin 2",
        null,
        "admin",
        new Date(),
        new Date()
      );

      const anotherAdmin = new ProfileEntity(
        "admin-456",
        "admin3@example.com",
        "Admin 3",
        null,
        "admin",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(adminToDelete);
      mockProfileRepository.getAllProfiles.mockResolvedValue([
        mockAdminProfile,
        adminToDelete,
        anotherAdmin,
      ]);

      const result = await deleteUserUseCase.execute(userId);

      expect(result.success).toBe(true);
      expect(result.error).toBe(
        "Esta funcionalidad requiere configuración adicional en Supabase"
      );
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockRejectedValue(
        new Error("Database error")
      );

      const result = await deleteUserUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockRejectedValue("Unknown error");

      const result = await deleteUserUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al eliminar usuario");
    });
  });
});
