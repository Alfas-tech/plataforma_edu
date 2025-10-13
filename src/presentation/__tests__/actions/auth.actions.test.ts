import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { LoginUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { SignUpUseCase } from "@/src/application/use-cases/auth/SignUpUseCase";
import { SignOutUseCase } from "@/src/application/use-cases/auth/SignOutUseCase";
import { ResetPasswordUseCase } from "@/src/application/use-cases/auth/ResetPasswordUseCase";
import { UpdatePasswordUseCase } from "@/src/application/use-cases/auth/UpdatePasswordUseCase";

// Mock Supabase
jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@/src/infrastructure/supabase/server";

describe("Auth Actions Logic", () => {
  let mockSupabaseClient: any;
  let authRepository: SupabaseAuthRepository;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
        signInWithOAuth: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    authRepository = new SupabaseAuthRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Login Action Logic", () => {
    it("should successfully login with valid credentials", async () => {
      const loginUseCase = new LoginUseCase(authRepository);

      const mockUser = {
        id: "123",
        email: "test@example.com",
        user_metadata: { full_name: "John Doe" },
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await loginUseCase.execute({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe("test@example.com");
    });

    it("should return error for invalid credentials", async () => {
      const loginUseCase = new LoginUseCase(authRepository);

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid credentials" },
      });

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

      const mockUser = {
        id: "123",
        email: "test@example.com",
        user_metadata: { full_name: "John Doe" },
        confirmed_at: null,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
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
    });

    it("should return error if email already exists", async () => {
      const signUpUseCase = new SignUpUseCase(authRepository);

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "User already exists" },
      });

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

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await signOutUseCase.execute();

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it("should handle sign out errors", async () => {
      const signOutUseCase = new SignOutUseCase(authRepository);

      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: "Sign out failed" },
      });

      const result = await signOutUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("ResetPassword Action Logic", () => {
    it("should send reset password email successfully", async () => {
      const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      const result = await resetPasswordUseCase.execute("test@example.com");

      expect(result.success).toBe(true);
      expect(
        mockSupabaseClient.auth.resetPasswordForEmail
      ).toHaveBeenCalledWith("test@example.com", expect.any(Object));
    });

    it("should handle email sending errors", async () => {
      const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: "Email service error" },
      });

      const result = await resetPasswordUseCase.execute("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("UpdatePassword Action Logic", () => {
    it("should update password successfully", async () => {
      const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        error: null,
      });

      const result = await updatePasswordUseCase.execute("newPassword123");

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: "newPassword123",
      });
    });

    it("should validate password length", async () => {
      const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

      const result = await updatePasswordUseCase.execute("12345"); // Too short

      expect(result.success).toBe(false);
      expect(result.error).toContain("6 caracteres");
      expect(mockSupabaseClient.auth.updateUser).not.toHaveBeenCalled();
    });

    it("should handle update errors", async () => {
      const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        error: { message: "Update failed" },
      });

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
