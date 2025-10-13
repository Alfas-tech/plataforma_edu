import { UserEntity } from "@/src/core/entities/User.entity";

describe("UserEntity", () => {
  describe("constructor", () => {
    it("should create a user entity with all properties", () => {
      const user = new UserEntity(
        "123",
        "test@example.com",
        "John Doe",
        "https://avatar.com/avatar.jpg",
        { role: "user" },
        new Date("2024-01-01")
      );

      expect(user.id).toBe("123");
      expect(user.email).toBe("test@example.com");
      expect(user.fullName).toBe("John Doe");
      expect(user.avatarUrl).toBe("https://avatar.com/avatar.jpg");
      expect(user.metadata).toEqual({ role: "user" });
      expect(user.createdAt).toEqual(new Date("2024-01-01"));
    });

    it("should create a user entity with minimal properties", () => {
      const user = new UserEntity("123", "test@example.com");

      expect(user.id).toBe("123");
      expect(user.email).toBe("test@example.com");
      expect(user.fullName).toBeUndefined();
      expect(user.avatarUrl).toBeUndefined();
      expect(user.metadata).toBeUndefined();
      expect(user.createdAt).toBeUndefined();
    });
  });

  describe("fromSupabase", () => {
    it("should create user entity from Supabase data", () => {
      const supabaseData = {
        id: "123",
        email: "test@example.com",
        user_metadata: {
          full_name: "John Doe",
          avatar_url: "https://avatar.com/avatar.jpg",
        },
        created_at: "2024-01-01T00:00:00Z",
      };

      const user = UserEntity.fromSupabase(supabaseData);

      expect(user.id).toBe("123");
      expect(user.email).toBe("test@example.com");
      expect(user.fullName).toBe("John Doe");
    });

    it("should handle missing metadata", () => {
      const supabaseData = {
        id: "123",
        email: "test@example.com",
      };

      const user = UserEntity.fromSupabase(supabaseData);

      expect(user.id).toBe("123");
      expect(user.email).toBe("test@example.com");
      expect(user.fullName).toBeUndefined();
    });
  });

  describe("getDisplayName", () => {
    it("should return fullName if available", () => {
      const user = new UserEntity("123", "test@example.com", "John Doe");
      expect(user.getDisplayName()).toBe("John Doe");
    });

    it("should return name from metadata if fullName is not available", () => {
      const user = new UserEntity(
        "123",
        "test@example.com",
        undefined,
        undefined,
        { full_name: "Jane Doe" }
      );
      expect(user.getDisplayName()).toBe("Jane Doe");
    });

    it("should return email username if no name available", () => {
      const user = new UserEntity("123", "john.doe@example.com");
      expect(user.getDisplayName()).toBe("john.doe");
    });

    it('should return "Usuario" as fallback', () => {
      const user = new UserEntity("123", "");
      expect(user.getDisplayName()).toBe("Usuario");
    });
  });
});
