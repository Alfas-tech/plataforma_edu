import { CourseEntity } from "@/src/core/entities/Course.entity";

describe("CourseEntity", () => {
  const mockCourseData = {
    id: "course-123",
    title: "Test Course",
    description: "Test Description",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
    createdBy: "admin-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  describe("constructor", () => {
    it("should create a course entity with all properties", () => {
      const course = new CourseEntity(
        mockCourseData.id,
        mockCourseData.title,
        mockCourseData.description,
        mockCourseData.startDate,
        mockCourseData.endDate,
        mockCourseData.isActive,
        mockCourseData.createdBy,
        mockCourseData.createdAt,
        mockCourseData.updatedAt
      );

      expect(course.id).toBe(mockCourseData.id);
      expect(course.title).toBe(mockCourseData.title);
      expect(course.description).toBe(mockCourseData.description);
      expect(course.startDate).toBe(mockCourseData.startDate);
      expect(course.endDate).toBe(mockCourseData.endDate);
      expect(course.isActive).toBe(mockCourseData.isActive);
      expect(course.createdBy).toBe(mockCourseData.createdBy);
      expect(course.createdAt).toBe(mockCourseData.createdAt);
      expect(course.updatedAt).toBe(mockCourseData.updatedAt);
    });
  });

  describe("getStatus", () => {
    it('should return "upcoming" when start date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const endDate = new Date(futureDate);
      endDate.setDate(endDate.getDate() + 30);

      const course = new CourseEntity(
        "course-1",
        "Future Course",
        "Description",
        futureDate,
        endDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      expect(course.getStatus()).toBe("upcoming");
    });

    it('should return "active" when current date is between start and end dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const course = new CourseEntity(
        "course-1",
        "Active Course",
        "Description",
        pastDate,
        futureDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      expect(course.getStatus()).toBe("active");
    });

    it('should return "ended" when end date is in the past', () => {
      const pastStartDate = new Date();
      pastStartDate.setDate(pastStartDate.getDate() - 30);
      const pastEndDate = new Date();
      pastEndDate.setDate(pastEndDate.getDate() - 10);

      const course = new CourseEntity(
        "course-1",
        "Ended Course",
        "Description",
        pastStartDate,
        pastEndDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      expect(course.getStatus()).toBe("ended");
    });
  });

  describe("getDaysRemaining", () => {
    it("should return positive number of days until end date", () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);

      const course = new CourseEntity(
        "course-1",
        "Course",
        "Description",
        startDate,
        endDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      const daysRemaining = course.getDaysRemaining();
      expect(daysRemaining).toBeGreaterThanOrEqual(9);
      expect(daysRemaining).toBeLessThanOrEqual(11);
    });

    it("should return 0 when end date is today", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date();

      const course = new CourseEntity(
        "course-1",
        "Course",
        "Description",
        startDate,
        endDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      const daysRemaining = course.getDaysRemaining();
      expect(daysRemaining).toBeLessThanOrEqual(1);
    });

    it("should return negative number when end date is in the past", () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 20);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 10);

      const course = new CourseEntity(
        "course-1",
        "Course",
        "Description",
        startDate,
        endDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      const daysRemaining = course.getDaysRemaining();
      expect(daysRemaining).toBeLessThan(0);
    });
  });

  describe("isCurrentlyActive", () => {
    it("should return true when course is active and within date range", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const course = new CourseEntity(
        "course-1",
        "Course",
        "Description",
        pastDate,
        futureDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      expect(course.isCurrentlyActive()).toBe(true);
    });

    it("should return false when course is not active", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const course = new CourseEntity(
        "course-1",
        "Course",
        "Description",
        pastDate,
        futureDate,
        false,
        "admin-123",
        new Date(),
        new Date()
      );

      expect(course.isCurrentlyActive()).toBe(false);
    });

    it("should return false when current date is before start date", () => {
      const futureStartDate = new Date();
      futureStartDate.setDate(futureStartDate.getDate() + 5);
      const futureEndDate = new Date();
      futureEndDate.setDate(futureEndDate.getDate() + 15);

      const course = new CourseEntity(
        "course-1",
        "Course",
        "Description",
        futureStartDate,
        futureEndDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      expect(course.isCurrentlyActive()).toBe(false);
    });

    it("should return false when current date is after end date", () => {
      const pastStartDate = new Date();
      pastStartDate.setDate(pastStartDate.getDate() - 20);
      const pastEndDate = new Date();
      pastEndDate.setDate(pastEndDate.getDate() - 10);

      const course = new CourseEntity(
        "course-1",
        "Course",
        "Description",
        pastStartDate,
        pastEndDate,
        true,
        "admin-123",
        new Date(),
        new Date()
      );

      expect(course.isCurrentlyActive()).toBe(false);
    });
  });
});
