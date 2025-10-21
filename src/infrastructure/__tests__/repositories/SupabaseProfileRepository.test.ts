import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { UserRole } from "@/src/core/types/roles.types";

jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/src/infrastructure/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

import { createClient } from "@/src/infrastructure/supabase/server";
import { createAdminClient } from "@/src/infrastructure/supabase/admin";

describe("SupabaseProfileRepository", () => {
  let repository: SupabaseProfileRepository;
  let mockSupabaseClient: any;
  let mockAdminClient: any;
  let mockAdminGetUserById: jest.Mock;

  const PROFILE_SELECT =
    "id, email, full_name, avatar_url, role, created_at, updated_at";

  const buildProfile = (
    overrides: Partial<{
      id: string;
      email: string | null;
      full_name: string | null;
      avatar_url: string | null;
      role: UserRole;
      created_at: string;
      updated_at: string;
    }> = {}
  ) => ({
    id: "123",
    email: "test@example.com",
    full_name: "John Doe",
    avatar_url: "https://avatar.com/avatar.jpg",
    role: "student" as UserRole,
    created_at: new Date("2024-01-01T00:00:00Z").toISOString(),
    updated_at: new Date("2024-01-02T00:00:00Z").toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn(),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockAdminGetUserById = jest.fn().mockResolvedValue({
      data: { user: { email: "fallback@example.com" } },
      error: null,
    });
    mockAdminClient = {
      auth: {
        admin: {
          getUserById: mockAdminGetUserById,
        },
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    (createAdminClient as jest.Mock).mockReturnValue(mockAdminClient);
    repository = new SupabaseProfileRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfileByUserId", () => {
    it("should return profile when found", async () => {
      const mockProfile = buildProfile();

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.getProfileByUserId("123");

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(result?.id).toBe("123");
      expect(result?.email).toBe("test@example.com");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith(PROFILE_SELECT);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", "123");
    });

    it("should return null when profile not found", async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const result = await repository.getProfileByUserId("123");

      expect(result).toBeNull();
    });

    it("should fallback to auth_users email when profile email is null", async () => {
      const mockProfile = buildProfile({
        email: null,
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.getProfileByUserId("123");

      expect(result?.email).toBe("fallback@example.com");
      expect(mockAdminGetUserById).toHaveBeenCalledWith("123");
    });
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      const mockProfile = buildProfile({
        full_name: "Jane Doe",
        avatar_url: "https://avatar.com/new.jpg",
      });

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.updateProfile("123", {
        fullName: "Jane Doe",
        avatarUrl: "https://avatar.com/new.jpg",
      });

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(result.fullName).toBe("Jane Doe");
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: "Jane Doe",
          avatar_url: "https://avatar.com/new.jpg",
          updated_at: expect.any(String),
        })
      );
    });

    it("should throw error when update fails", async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        repository.updateProfile("123", { fullName: "Jane Doe" })
      ).rejects.toThrow("Error al actualizar el perfil");
    });
  });

  describe("promoteToTeacher", () => {
    it("should promote user to teacher successfully", async () => {
      mockAdminClient.eq
        .mockImplementationOnce(() => mockAdminClient)
        .mockImplementationOnce(() =>
          Promise.resolve({ data: null, error: null })
        );
      mockAdminClient.limit.mockResolvedValueOnce({
        data: [{ role: "student" }],
        error: null,
      });

      await expect(
        repository.promoteToTeacher("user-123")
      ).resolves.not.toThrow();
      expect(mockAdminClient.from).toHaveBeenCalledWith("profiles");
      expect(mockAdminClient.limit).toHaveBeenCalledWith(1);
      expect(mockAdminClient.update).toHaveBeenCalledWith(
        expect.objectContaining({ role: "teacher" })
      );
    });

    it("should throw error when promotion fails", async () => {
      mockAdminClient.eq.mockImplementationOnce(() => mockAdminClient);
      mockAdminClient.limit.mockResolvedValueOnce({
        data: [{ role: "student" }],
        error: null,
      });
      mockAdminClient.update.mockReturnValueOnce({
        eq: () =>
          Promise.resolve({
            data: null,
            error: { message: "Promotion failed" },
          }),
      });

      await expect(repository.promoteToTeacher("user-123")).rejects.toThrow(
        "Error al promover a docente: Promotion failed"
      );
    });
  });

  describe("demoteToStudent", () => {
    it("should demote user to student successfully", async () => {
      mockAdminClient.eq
        .mockImplementationOnce(() => mockAdminClient)
        .mockImplementationOnce(() =>
          Promise.resolve({ data: null, error: null })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({ data: null, error: null })
        );
      mockAdminClient.limit.mockResolvedValueOnce({
        data: [{ role: "teacher" }],
        error: null,
      });

      await expect(
        repository.demoteToStudent("user-123")
      ).resolves.not.toThrow();
      expect(mockAdminClient.delete).toHaveBeenCalled();
      expect(mockAdminClient.update).toHaveBeenCalledWith(
        expect.objectContaining({ role: "student" })
      );
    });

    it("should throw error when demotion fails", async () => {
      mockAdminClient.eq.mockImplementationOnce(() => mockAdminClient);
      mockAdminClient.limit.mockResolvedValueOnce({
        data: [{ role: "teacher" }],
        error: null,
      });
      mockAdminClient.delete.mockReturnValueOnce({
        eq: () =>
          Promise.resolve({
            data: null,
            error: { message: "Demotion failed" },
          }),
      });

      await expect(repository.demoteToStudent("user-123")).rejects.toThrow(
        "Error al degradar a estudiante: Demotion failed"
      );
    });
  });

  describe("updateRole", () => {
    it("should update user role successfully", async () => {
      const mockProfile = buildProfile({ role: "teacher" });

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.updateRole("123", "teacher");

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "teacher",
          updated_at: expect.any(String),
        })
      );
    });

    it("should throw error when role update fails", async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(repository.updateRole("123", "teacher")).rejects.toThrow(
        "Error al actualizar el rol"
      );
    });
  });

  describe("getAllTeachers", () => {
    it("should return all teachers", async () => {
      const mockTeachers = [
        buildProfile({
          id: "1",
          email: "teacher1@example.com",
          full_name: "Teacher One",
          role: "teacher",
        }),
        buildProfile({
          id: "2",
          email: "teacher2@example.com",
          full_name: "Teacher Two",
          role: "teacher",
        }),
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockTeachers,
        error: null,
      });

      const result = await repository.getAllTeachers();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ProfileEntity);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("role", "teacher");
    });

    it("should return empty array when no teachers found", async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.getAllTeachers();

      expect(result).toEqual([]);
    });

    it("should return empty array when query fails", async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await repository.getAllTeachers();

      expect(result).toEqual([]);
    });
  });

  describe("getAllStudents", () => {
    it("should return all students", async () => {
      const mockStudents = [
        buildProfile({
          id: "1",
          email: "student1@example.com",
          full_name: "Student One",
          role: "student",
        }),
      ];

      mockSupabaseClient.eq.mockResolvedValue({
        data: mockStudents,
        error: null,
      });

      const result = await repository.getAllStudents();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(ProfileEntity);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("role", "student");
    });

    it("should return empty array when no students found", async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.getAllStudents();

      expect(result).toEqual([]);
    });
  });

  describe("getProfileByEmail", () => {
    it("should return profile when found by email", async () => {
      const mockProfile = {
        id: "123",
        email: "test@example.com",
        full_name: "John Doe",
        avatar_url: null,
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.getProfileByEmail("test@example.com");

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(result?.email).toBe("test@example.com");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        "email",
        "test@example.com"
      );
    });

    it("should return null when profile not found by email", async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const result = await repository.getProfileByEmail("notfound@example.com");

      expect(result).toBeNull();
    });
  });

  describe("getAllProfiles", () => {
    it("should return all profiles", async () => {
      const mockProfiles = [
        {
          id: "1",
          email: "user1@example.com",
          full_name: "User One",
          role: "student",
        },
        {
          id: "2",
          email: "user2@example.com",
          full_name: "User Two",
          role: "teacher",
        },
      ];

      mockSupabaseClient.select.mockResolvedValue({
        data: mockProfiles,
        error: null,
      });

      const result = await repository.getAllProfiles();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ProfileEntity);
      expect(result[1]).toBeInstanceOf(ProfileEntity);
    });

    it("should return empty array when no profiles found", async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.getAllProfiles();

      expect(result).toEqual([]);
    });

    it("should return empty array when query fails", async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await repository.getAllProfiles();

      expect(result).toEqual([]);
    });
  });
});
