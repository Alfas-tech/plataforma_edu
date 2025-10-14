import { SignUpUseCase } from "@/src/application/use-cases/auth/SignUpUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { SignUpData } from "@/src/core/types/auth.types";

describe("SignUpUseCase", () => {
  let mockAuthRepository: jest.Mocked<any>;
  let signUpUseCase: SignUpUseCase;

  beforeEach(() => {
    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    };
    signUpUseCase = new SignUpUseCase(mockAuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const validSignUpData: SignUpData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    it("should sign up successfully and require confirmation", async () => {
      const mockUser = new UserEntity("123", "test@example.com", "John Doe");
      mockAuthRepository.signUp.mockResolvedValue({
        user: mockUser,
        needsConfirmation: true,
      });

      const result = await signUpUseCase.execute(validSignUpData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.needsConfirmation).toBe(true);
      expect(mockAuthRepository.signUp).toHaveBeenCalledWith(validSignUpData);
    });

    it("should sign up successfully without confirmation", async () => {
      const mockUser = new UserEntity("123", "test@example.com", "John Doe");
      mockAuthRepository.signUp.mockResolvedValue({
        user: mockUser,
        needsConfirmation: false,
      });

      const result = await signUpUseCase.execute(validSignUpData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.needsConfirmation).toBe(false);
    });

    it("should return error when email already exists", async () => {
      const errorMessage = "El email ya está registrado";
      mockAuthRepository.signUp.mockRejectedValue(new Error(errorMessage));

      const result = await signUpUseCase.execute(validSignUpData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.user).toBeUndefined();
    });

    it("should handle unknown errors gracefully", async () => {
      mockAuthRepository.signUp.mockRejectedValue("Unknown error");

      const result = await signUpUseCase.execute(validSignUpData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al registrarse");
    });
  });
});
