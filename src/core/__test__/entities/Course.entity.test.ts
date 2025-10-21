/// <reference types="jest" />
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";

declare const describe: any;
declare const it: any;
declare const expect: any;

describe("CourseEntity", () => {
  const baseCourseData = {
    id: "course-123",
    title: "Test Course",
    summary: "Resumen",
    description: "Descripción del curso",
    slug: "test-course",
    visibilityOverride: false,
    createdBy: "admin-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-02-01"),
    defaultBranchId: "branch-main",
  };

  const baseVersion = new CourseVersionEntity(
    "version-123",
    baseCourseData.id,
    "branch-main",
    "v1.0.0",
    "Resumen de la versión",
    "published",
    true,
    true,
    true,
    null,
    null,
    null,
    null,
    "admin-123",
    null,
    null,
    new Date("2024-01-01"),
    new Date("2024-02-01")
  );

  const createCourse = (options?: {
    visibilityOverride?: boolean;
    activeVersion?: CourseVersionEntity | null;
  }) =>
    new CourseEntity(
      baseCourseData.id,
      baseCourseData.title,
      baseCourseData.summary,
      baseCourseData.description,
      baseCourseData.slug,
      options?.visibilityOverride ?? baseCourseData.visibilityOverride,
      options?.activeVersion === undefined ? baseVersion : options.activeVersion,
      baseCourseData.createdBy,
      baseCourseData.createdAt,
      baseCourseData.updatedAt,
      "branch-main",
      null,
      [],
      []
    );

  describe("constructor", () => {
    it("should map all properties", () => {
      const course = createCourse();

      expect(course.id).toBe(baseCourseData.id);
      expect(course.title).toBe(baseCourseData.title);
      expect(course.summary).toBe(baseCourseData.summary);
      expect(course.description).toBe(baseCourseData.description);
      expect(course.slug).toBe(baseCourseData.slug);
      expect(course.visibilityOverride).toBe(false);
      expect(course.activeVersion).toBeInstanceOf(CourseVersionEntity);
      expect(course.createdBy).toBe(baseCourseData.createdBy);
      expect(course.createdAt).toEqual(baseCourseData.createdAt);
      expect(course.updatedAt).toEqual(baseCourseData.updatedAt);
      expect(course.defaultBranchId).toBe(baseCourseData.defaultBranchId);
    });
  });

  describe("getActiveVersion helpers", () => {
    it("should expose label, summary and status from active version", () => {
      const course = createCourse();

      expect(course.getActiveVersionLabel()).toBe("v1.0.0");
      expect(course.getActiveVersionSummary()).toBe("Resumen de la versión");
      expect(course.getActiveVersionStatus()).toBe("published");
    });

    it("should return nulls when no active version is present", () => {
      const course = createCourse({ activeVersion: null });

      expect(course.getActiveVersionLabel()).toBeNull();
      expect(course.getActiveVersionSummary()).toBeNull();
      expect(course.getActiveVersionStatus()).toBeNull();
    });
  });

  describe("isVisibleForStudents", () => {
    it("should return true when visibility override is enabled", () => {
      const course = createCourse({
        visibilityOverride: true,
        activeVersion: null,
      });

      expect(course.isVisibleForStudents()).toBe(true);
    });

    it("should return true when active version is published and active", () => {
      const course = createCourse();

      expect(course.isVisibleForStudents()).toBe(true);
    });

    it("should return false when no active version is available", () => {
      const course = createCourse({
        activeVersion: null,
        visibilityOverride: false,
      });

      expect(course.isVisibleForStudents()).toBe(false);
    });

    it("should return false when active version is not published", () => {
      const unpublishedVersion = new CourseVersionEntity(
        baseVersion.id,
        baseVersion.courseId,
        baseVersion.branchId,
        baseVersion.versionLabel,
        baseVersion.summary,
        "pending_review",
        false,
        false,
        false,
        baseVersion.parentVersionId,
        baseVersion.mergedIntoVersionId,
        baseVersion.mergeRequestId,
        null,
        baseVersion.createdBy,
        null,
        null,
        baseVersion.createdAt,
        baseVersion.updatedAt
      );

      const course = createCourse({ activeVersion: unpublishedVersion });

      expect(course.isVisibleForStudents()).toBe(false);
    });
  });

  describe("hasActiveVersion", () => {
    it("should return true when there is an active version", () => {
      const course = createCourse();

      expect(course.hasActiveVersion()).toBe(true);
    });

    it("should return false when active version is null", () => {
      const course = createCourse({ activeVersion: null });

      expect(course.hasActiveVersion()).toBe(false);
    });
  });
});
