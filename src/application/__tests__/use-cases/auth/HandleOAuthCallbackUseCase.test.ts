import { HandleOAuthCallbackUseCase } from "@/src/application/use-cases/auth/HandleOAuthCallbackUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { OAuthCallbackData } from "@/src/core/types/auth.types";

describe("HandleOAuthCallbackUseCase", () => {
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let handleOAuthCallbackUseCase: HandleOAuthCallbackUseCase;

  beforeEach(() => {
    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      handleOAuthCallback: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    };
    handleOAuthCallbackUseCase = new HandleOAuthCallbackUseCase(
      mockAuthRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const validCallbackData: OAuthCallbackData = {
      code: "auth_code_from_google",
      next: "/dashboard",
    };

    it("should handle OAuth callback successfully", async () => {
      const mockUser = new UserEntity("123", "test@example.com");
      mockAuthRepository.handleOAuthCallback.mockResolvedValue(mockUser);

      const result =
        await handleOAuthCallbackUseCase.execute(validCallbackData);

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/dashboard");
      expect(result.error).toBeUndefined();
      expect(mockAuthRepository.handleOAuthCallback).toHaveBeenCalledWith(
        validCallbackData
      );
    });

    it("should use default redirect when next is not provided", async () => {
      const callbackDataWithoutNext: OAuthCallbackData = {
        code: "auth_code_from_google",
      };
      const mockUser = new UserEntity("123", "test@example.com");
      mockAuthRepository.handleOAuthCallback.mockResolvedValue(mockUser);

      const result = await handleOAuthCallbackUseCase.execute(
        callbackDataWithoutNext
      );

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/dashboard");
    });

    it("should return error when OAuth callback fails", async () => {
      const errorMessage = "Error al procesar el callback de autenticación";
      mockAuthRepository.handleOAuthCallback.mockRejectedValue(
        new Error(errorMessage)
      );

      const result =
        await handleOAuthCallbackUseCase.execute(validCallbackData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.redirectTo).toBeUndefined();
    });

    it("should handle unknown errors gracefully", async () => {
      mockAuthRepository.handleOAuthCallback.mockRejectedValue("Unknown error");

      const result =
        await handleOAuthCallbackUseCase.execute(validCallbackData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error desconocido");
      expect(result.redirectTo).toBeUndefined();
    });
  });
});
