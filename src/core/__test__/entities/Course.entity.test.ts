/// <reference types="jest" />
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";

declare const describe: any;
declare const it: any;
declare const expect: any;

describe("CourseEntity", () => {
  const baseCourseData = {
    id: "course-123",
    name: "Test Course",
    description: "Descripción del curso",
    createdBy: "admin-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01"),
    activeVersionId: "version-123",
  };

  const baseActiveVersion = new CourseVersionEntity(
    "version-123",
    baseCourseData.id,
    1,
    "Version 1.0",
    "Descripción de la versión",
    null,
    "active",
    new Date("2024-01-15"),
    new Date("2024-12-31"),
    new Date("2024-01-15"),
    "admin-123",
    new Date("2024-01-01"),
    new Date("2024-01-01")
  );

  const baseDraftVersion = new CourseVersionEntity(
    "version-draft",
    baseCourseData.id,
    2,
    "Version 2.0 Draft",
    "Borrador de la versión 2.0",
    null,
    "draft",
    null,
    null,
    null,
    null,
    new Date("2024-02-01"),
    new Date("2024-02-01")
  );

  const createCourse = (options?: {
    activeVersionId?: string | null;
    versions?: CourseVersionEntity[];
  }) =>
    new CourseEntity(
      baseCourseData.id,
      baseCourseData.name,
      baseCourseData.description,
      baseCourseData.createdBy,
      baseCourseData.createdAt,
      baseCourseData.updatedAt,
      options?.activeVersionId === undefined
        ? baseCourseData.activeVersionId
        : options.activeVersionId,
      options?.versions ?? [baseActiveVersion]
    );

  describe("constructor", () => {
    it("should map all properties", () => {
      const course = createCourse();

      expect(course.id).toBe(baseCourseData.id);
      expect(course.name).toBe(baseCourseData.name);
      expect(course.description).toBe(baseCourseData.description);
      expect(course.createdBy).toBe(baseCourseData.createdBy);
      expect(course.createdAt).toEqual(baseCourseData.createdAt);
      expect(course.updatedAt).toEqual(baseCourseData.updatedAt);
      expect(course.activeVersionId).toBe(baseCourseData.activeVersionId);
      expect(course.versions).toHaveLength(1);
    });

    it("should use getters for legacy properties", () => {
      const course = createCourse();

      expect(course.title).toBe(baseCourseData.name);
      expect(course.summary).toBe(baseCourseData.description);
      expect(course.slug).toBeNull();
      expect(course.visibilityOverride).toBe(false);
    });
  });

  describe("activeVersion", () => {
    it("should return the active version when available", () => {
      const course = createCourse();

      expect(course.activeVersion).toBeInstanceOf(CourseVersionEntity);
      expect(course.activeVersion?.id).toBe("version-123");
      expect(course.activeVersion?.isActive()).toBe(true);
    });

    it("should return null when no active version exists", () => {
      const course = createCourse({
        activeVersionId: null,
        versions: [baseDraftVersion],
      });

      expect(course.activeVersion).toBeNull();
    });

    it("should find active version by status if activeVersionId is null", () => {
      const course = createCourse({
        activeVersionId: null,
        versions: [baseActiveVersion, baseDraftVersion],
      });

      expect(course.activeVersion).toBeInstanceOf(CourseVersionEntity);
      expect(course.activeVersion?.status).toBe("active");
    });
  });

  describe("draftVersion", () => {
    it("should return the draft version when available", () => {
      const course = createCourse({
        versions: [baseActiveVersion, baseDraftVersion],
      });

      expect(course.draftVersion).toBeInstanceOf(CourseVersionEntity);
      expect(course.draftVersion?.id).toBe("version-draft");
      expect(course.draftVersion?.isDraft()).toBe(true);
    });

    it("should return null when no draft version exists", () => {
      const course = createCourse();

      expect(course.draftVersion).toBeNull();
    });
  });

  describe("archivedVersions", () => {
    it("should return archived versions sorted by version number descending", () => {
      const archivedV1 = new CourseVersionEntity(
        "version-archived-1",
        baseCourseData.id,
        1,
        "Archived v1",
        null,
        null,
        "archived",
        null,
        null,
        null,
        null,
        new Date("2023-01-01"),
        new Date("2023-01-01")
      );

      const archivedV3 = new CourseVersionEntity(
        "version-archived-3",
        baseCourseData.id,
        3,
        "Archived v3",
        null,
        null,
        "archived",
        null,
        null,
        null,
        null,
        new Date("2023-03-01"),
        new Date("2023-03-01")
      );

      const course = createCourse({
        versions: [archivedV1, baseActiveVersion, archivedV3],
      });

      const archived = course.archivedVersions;
      expect(archived).toHaveLength(2);
      expect(archived[0].versionNumber).toBe(3);
      expect(archived[1].versionNumber).toBe(1);
    });
  });

  describe("hasDraft", () => {
    it("should return true when there is a draft version", () => {
      const course = createCourse({
        versions: [baseActiveVersion, baseDraftVersion],
      });

      expect(course.hasDraft()).toBe(true);
    });

    it("should return false when there is no draft version", () => {
      const course = createCourse();

      expect(course.hasDraft()).toBe(false);
    });
  });

  describe("hasActiveVersion", () => {
    it("should return true when there is an active version", () => {
      const course = createCourse();

      expect(course.hasActiveVersion()).toBe(true);
    });

    it("should return false when active version is null", () => {
      const course = createCourse({
        activeVersionId: null,
        versions: [],
      });

      expect(course.hasActiveVersion()).toBe(false);
    });
  });

  describe("getVersionById", () => {
    it("should return version by id when it exists", () => {
      const course = createCourse({
        versions: [baseActiveVersion, baseDraftVersion],
      });

      const version = course.getVersionById("version-draft");
      expect(version).toBeInstanceOf(CourseVersionEntity);
      expect(version?.id).toBe("version-draft");
    });

    it("should return null when version does not exist", () => {
      const course = createCourse();

      const version = course.getVersionById("non-existent");
      expect(version).toBeNull();
    });
  });
});
