import {
  CreateUserUseCase,
  CreateUserInput,
} from "@/src/application/use-cases/profile/CreateUserUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("CreateUserUseCase", () => {
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let createUserUseCase: CreateUserUseCase;

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

    createUserUseCase = new CreateUserUseCase(
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

    const validInput: CreateUserInput = {
      email: "newuser@example.com",
      password: "password123",
      fullName: "New User",
      role: "student",
    };

    it("should validate admin permissions", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockProfileRepository.getProfileByEmail.mockResolvedValue(null);

      const result = await createUserUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.error).toBe(
        "Esta funcionalidad requiere configuración adicional en Supabase"
      );
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await createUserUseCase.execute(validInput);

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

      const result = await createUserUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los administradores pueden crear usuarios"
      );
    });

    it("should return error when email is missing", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );

      const invalidInput: CreateUserInput = {
        email: "",
        password: "password123",
        fullName: "New User",
        role: "student",
      };

      const result = await createUserUseCase.execute(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Email, contraseña y nombre completo son requeridos"
      );
    });

    it("should return error when password is too short", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );

      const invalidInput: CreateUserInput = {
        email: "newuser@example.com",
        password: "12345",
        fullName: "New User",
        role: "student",
      };

      const result = await createUserUseCase.execute(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "La contraseña debe tener al menos 6 caracteres"
      );
    });

    it("should return error when user already exists", async () => {
      const existingProfile = new ProfileEntity(
        "existing-123",
        "newuser@example.com",
        "Existing User",
        null,
        "student",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockProfileRepository.getProfileByEmail.mockResolvedValue(
        existingProfile
      );

      const result = await createUserUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Ya existe un usuario con este email");
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockRejectedValue(
        new Error("Database error")
      );

      const result = await createUserUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockRejectedValue("Unknown error");

      const result = await createUserUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al crear usuario");
    });
  });
});
