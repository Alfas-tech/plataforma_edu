import { GetCurrentProfileUseCase } from "@/src/application/use-cases/profile/GetCurrentProfileUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("GetCurrentProfileUseCase", () => {
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let getCurrentProfileUseCase: GetCurrentProfileUseCase;

  beforeEach(() => {
    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    } as jest.Mocked<any>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      updateUserRole: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
    } as jest.Mocked<IProfileRepository>;

    getCurrentProfileUseCase = new GetCurrentProfileUseCase(
      mockProfileRepository,
      mockAuthRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const mockUser = new UserEntity(
      "user-123",
      "test@example.com",
      "Test User"
    );
    const mockProfile = new ProfileEntity(
      "profile-123",
      "user-123",
      "Test",
      "User",
      "student",
      new Date(),
      new Date()
    );

    it("should return current profile successfully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockProfile);

      const result = await getCurrentProfileUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.profile).toEqual(mockProfile);
      expect(result.error).toBeUndefined();
      expect(mockAuthRepository.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockProfileRepository.getProfileByUserId).toHaveBeenCalledWith(
        "user-123"
      );
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await getCurrentProfileUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(result.profile).toBeUndefined();
      expect(mockProfileRepository.getProfileByUserId).not.toHaveBeenCalled();
    });

    it("should return error when profile not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await getCurrentProfileUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil no encontrado");
      expect(result.profile).toBeUndefined();
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await getCurrentProfileUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
      expect(result.profile).toBeUndefined();
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockRejectedValue(
        "Unknown error"
      );

      const result = await getCurrentProfileUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al obtener el perfil");
    });
  });
});
