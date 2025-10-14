import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

import { createClient } from "@/src/infrastructure/supabase/server";

describe("SupabaseProfileRepository", () => {
  let repository: SupabaseProfileRepository;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    repository = new SupabaseProfileRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfileByUserId", () => {
    it("should return profile when found", async () => {
      const mockProfile = {
        id: "123",
        email: "test@example.com",
        full_name: "John Doe",
        avatar_url: "https://avatar.com/avatar.jpg",
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await repository.getProfileByUserId("123");

      expect(result).toBeInstanceOf(ProfileEntity);
      expect(result?.id).toBe("123");
      expect(result?.email).toBe("test@example.com");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("profiles");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("*");
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
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      const mockProfile = {
        id: "123",
        email: "test@example.com",
        full_name: "Jane Doe",
        avatar_url: "https://avatar.com/new.jpg",
      };

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
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      await expect(
        repository.promoteToTeacher("user-123")
      ).resolves.not.toThrow();
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        "promote_to_teacher",
        {
          user_id: "user-123",
        }
      );
    });

    it("should throw error when promotion fails", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Promotion failed" },
      });

      await expect(repository.promoteToTeacher("user-123")).rejects.toThrow(
        "Error al promover a docente"
      );
    });
  });

  describe("demoteToStudent", () => {
    it("should demote user to student successfully", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      await expect(
        repository.demoteToStudent("user-123")
      ).resolves.not.toThrow();
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("demote_to_student", {
        user_id: "user-123",
      });
    });

    it("should throw error when demotion fails", async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: "Demotion failed" },
      });

      await expect(repository.demoteToStudent("user-123")).rejects.toThrow(
        "Error al degradar a estudiante"
      );
    });
  });

  describe("updateRole", () => {
    it("should update user role successfully", async () => {
      const mockProfile = {
        id: "123",
        email: "test@example.com",
        full_name: "John Doe",
        avatar_url: null,
        role: "teacher",
      };

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
        {
          id: "1",
          email: "teacher1@example.com",
          full_name: "Teacher One",
          role: "teacher",
        },
        {
          id: "2",
          email: "teacher2@example.com",
          full_name: "Teacher Two",
          role: "teacher",
        },
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
        {
          id: "1",
          email: "student1@example.com",
          full_name: "Student One",
          role: "student",
        },
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
