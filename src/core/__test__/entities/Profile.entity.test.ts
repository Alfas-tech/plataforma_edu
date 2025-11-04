import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("ProfileEntity", () => {
  describe("constructor", () => {
    it("should create a profile entity", () => {
      const profile = new ProfileEntity(
        "123",
        "test@example.com",
        "John Doe",
        "https://avatar.com/avatar.jpg"
      );

      expect(profile.id).toBe("123");
      expect(profile.email).toBe("test@example.com");
      expect(profile.fullName).toBe("John Doe");
      expect(profile.avatarUrl).toBe("https://avatar.com/avatar.jpg");
    });

    it("should allow null values", () => {
      const profile = new ProfileEntity("123", "test@example.com", null, null);

      expect(profile.fullName).toBeNull();
      expect(profile.avatarUrl).toBeNull();
    });
  });

  describe("fromDatabase", () => {
    it("should create profile from database data", () => {
      const dbData = {
        id: "123",
        email: "test@example.com",
        full_name: "John Doe",
        avatar_url: "https://avatar.com/avatar.jpg",
      };

      const profile = ProfileEntity.fromDatabase(dbData);

      expect(profile.id).toBe("123");
      expect(profile.email).toBe("test@example.com");
      expect(profile.fullName).toBe("John Doe");
      expect(profile.avatarUrl).toBe("https://avatar.com/avatar.jpg");
    });
  });

  describe("getDisplayName", () => {
    it("should return fullName if available", () => {
      const profile = new ProfileEntity(
        "123",
        "test@example.com",
        "John Doe",
        null
      );
      expect(profile.getDisplayName()).toBe("John Doe");
    });

    it("should return email username if fullName is null", () => {
      const profile = new ProfileEntity(
        "123",
        "john.doe@example.com",
        null,
        null
      );
      expect(profile.getDisplayName()).toBe("john.doe");
    });

    it('should return "Usuario" as fallback', () => {
      const profile = new ProfileEntity("123", "", null, null);
      expect(profile.getDisplayName()).toBe("Usuario");
    });
  });

  describe("hasAvatar", () => {
    it("should return true if avatar URL exists", () => {
      const profile = new ProfileEntity(
        "123",
        "test@example.com",
        "John Doe",
        "https://avatar.com/avatar.jpg"
      );
      expect(profile.hasAvatar()).toBe(true);
    });

    it("should return false if avatar URL is null", () => {
      const profile = new ProfileEntity(
        "123",
        "test@example.com",
        "John Doe",
        null
      );
      expect(profile.hasAvatar()).toBe(false);
    });

    it("should return false if avatar URL is empty string", () => {
      const profile = new ProfileEntity(
        "123",
        "test@example.com",
        "John Doe",
        ""
      );
      expect(profile.hasAvatar()).toBe(false);
    });
  });
});
