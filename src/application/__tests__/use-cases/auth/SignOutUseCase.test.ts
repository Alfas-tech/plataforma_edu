import { SignOutUseCase } from "@/src/application/use-cases/auth/SignOutUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";

describe("SignOutUseCase", () => {
  let mockAuthRepository: jest.Mocked<any>;
  let signOutUseCase: SignOutUseCase;

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
    signOutUseCase = new SignOutUseCase(mockAuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should sign out successfully", async () => {
      mockAuthRepository.signOut.mockResolvedValue();

      const result = await signOutUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockAuthRepository.signOut).toHaveBeenCalledTimes(1);
    });

    it("should return error when sign out fails", async () => {
      const errorMessage = "Error al cerrar sesión";
      mockAuthRepository.signOut.mockRejectedValue(new Error(errorMessage));

      const result = await signOutUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it("should handle unknown errors gracefully", async () => {
      mockAuthRepository.signOut.mockRejectedValue("Unknown error");

      const result = await signOutUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al cerrar sesión");
    });
  });
});
