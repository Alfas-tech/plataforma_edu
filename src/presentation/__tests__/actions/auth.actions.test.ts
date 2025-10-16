import { LoginUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { SignUpUseCase } from "@/src/application/use-cases/auth/SignUpUseCase";
import { SignOutUseCase } from "@/src/application/use-cases/auth/SignOutUseCase";
import { ResetPasswordUseCase } from "@/src/application/use-cases/auth/ResetPasswordUseCase";
import { UpdatePasswordUseCase } from "@/src/application/use-cases/auth/UpdatePasswordUseCase";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { UserEntity } from "@/src/core/entities/User.entity";

describe("Auth Actions Logic", () => {
  let authRepository: jest.Mocked<IAuthRepository>;

  beforeEach(() => {
    authRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      handleOAuthCallback: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Login Action Logic", () => {
    it("should successfully login with valid credentials", async () => {
      const loginUseCase = new LoginUseCase(authRepository);

      const mockUser = new UserEntity(
        "123",
        "test@example.com",
        "John Doe",
        undefined
      );

      authRepository.login.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe("test@example.com");
      expect(authRepository.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should return error for invalid credentials", async () => {
      const loginUseCase = new LoginUseCase(authRepository);

      authRepository.login.mockRejectedValue(new Error("Email o contraseña incorrectos"));

      const result = await loginUseCase.execute({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("SignUp Action Logic", () => {
    it("should successfully sign up a new user", async () => {
      const signUpUseCase = new SignUpUseCase(authRepository);

      const mockUser = new UserEntity(
        "123",
        "test@example.com",
        "John Doe",
        undefined
      );

      authRepository.signUp.mockResolvedValue({
        user: mockUser,
        needsConfirmation: true,
      });

      const result = await signUpUseCase.execute({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.needsConfirmation).toBe(true);
      expect(authRepository.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should return error if email already exists", async () => {
      const signUpUseCase = new SignUpUseCase(authRepository);

      authRepository.signUp.mockRejectedValue(new Error("Error al crear la cuenta"));

      const result = await signUpUseCase.execute({
        email: "existing@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("SignOut Action Logic", () => {
    it("should successfully sign out user", async () => {
      const signOutUseCase = new SignOutUseCase(authRepository);

      authRepository.signOut.mockResolvedValue();

      const result = await signOutUseCase.execute();

      expect(result.success).toBe(true);
      expect(authRepository.signOut).toHaveBeenCalled();
    });

    it("should handle sign out errors", async () => {
      const signOutUseCase = new SignOutUseCase(authRepository);

      authRepository.signOut.mockRejectedValue(new Error("Error al cerrar sesión"));

      const result = await signOutUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("ResetPassword Action Logic", () => {
    it("should send reset password email successfully", async () => {
      const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

      authRepository.resetPassword.mockResolvedValue();

      const result = await resetPasswordUseCase.execute("test@example.com");

      expect(result.success).toBe(true);
      expect(authRepository.resetPassword).toHaveBeenCalledWith("test@example.com");
    });

    it("should handle email sending errors", async () => {
      const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

      authRepository.resetPassword.mockRejectedValue(new Error("Error al enviar el correo de recuperación"));

      const result = await resetPasswordUseCase.execute("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("UpdatePassword Action Logic", () => {
    it("should update password successfully", async () => {
      const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

      authRepository.updatePassword.mockResolvedValue();

      const result = await updatePasswordUseCase.execute("newPassword123");

      expect(result.success).toBe(true);
      expect(authRepository.updatePassword).toHaveBeenCalledWith("newPassword123");
    });

    it("should validate password length", async () => {
      const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

      const result = await updatePasswordUseCase.execute("12345"); // Too short

      expect(result.success).toBe(false);
      expect(result.error).toContain("6 caracteres");
      expect(authRepository.updatePassword).not.toHaveBeenCalled();
    });

    it("should handle update errors", async () => {
      const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

      authRepository.updatePassword.mockRejectedValue(new Error("No se pudo actualizar la contraseña"));

      const result = await updatePasswordUseCase.execute("newPassword123");

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("FormData Processing", () => {
    it("should correctly extract login credentials from FormData", () => {
      const formData = new FormData();
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      expect(email).toBe("test@example.com");
      expect(password).toBe("password123");
    });

    it("should correctly extract signup data from FormData", () => {
      const formData = new FormData();
      formData.append("first-name", "John");
      formData.append("last-name", "Doe");
      formData.append("email", "test@example.com");
      formData.append("password", "password123");

      const firstName = formData.get("first-name") as string;
      const lastName = formData.get("last-name") as string;
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      expect(firstName).toBe("John");
      expect(lastName).toBe("Doe");
      expect(email).toBe("test@example.com");
      expect(password).toBe("password123");
    });
  });
});
