import { CourseModuleEntity } from '@/src/core/entities/CourseModule.entity';

describe('CourseModuleEntity', () => {
  const mockModuleData = {
    id: 'module-123',
    courseId: 'course-123',
    title: 'Test Module',
    description: 'Test Description',
    orderIndex: 1,
    content: 'Test Content',
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('constructor', () => {
    it('should create a module entity with all properties', () => {
      const courseModule = new CourseModuleEntity(
        mockModuleData.id,
        mockModuleData.courseId,
        mockModuleData.title,
        mockModuleData.description,
        mockModuleData.orderIndex,
        mockModuleData.content,
        mockModuleData.isPublished,
        mockModuleData.createdAt,
        mockModuleData.updatedAt
      );

      expect(courseModule.id).toBe(mockModuleData.id);
      expect(courseModule.courseId).toBe(mockModuleData.courseId);
      expect(courseModule.title).toBe(mockModuleData.title);
      expect(courseModule.description).toBe(mockModuleData.description);
      expect(courseModule.orderIndex).toBe(mockModuleData.orderIndex);
      expect(courseModule.content).toBe(mockModuleData.content);
      expect(courseModule.isPublished).toBe(mockModuleData.isPublished);
      expect(courseModule.createdAt).toBe(mockModuleData.createdAt);
      expect(courseModule.updatedAt).toBe(mockModuleData.updatedAt);
    });

    it('should create a module with null description', () => {
      const courseModule = new CourseModuleEntity(
        'module-1',
        'course-1',
        'Module Title',
        null,
        1,
        'Content',
        false,
        new Date(),
        new Date()
      );

      expect(courseModule.description).toBeNull();
    });

    it('should create a module with null content', () => {
      const courseModule = new CourseModuleEntity(
        'module-1',
        'course-1',
        'Module Title',
        'Description',
        1,
        null,
        false,
        new Date(),
        new Date()
      );

      expect(courseModule.content).toBeNull();
    });
  });

  describe('isPublished property', () => {
    it('should correctly set isPublished to true', () => {
      const courseModule = new CourseModuleEntity(
        'module-1',
        'course-1',
        'Published Module',
        'Description',
        1,
        'Content',
        true,
        new Date(),
        new Date()
      );

      expect(courseModule.isPublished).toBe(true);
    });

    it('should correctly set isPublished to false', () => {
      const courseModule = new CourseModuleEntity(
        'module-1',
        'course-1',
        'Unpublished Module',
        'Description',
        1,
        'Content',
        false,
        new Date(),
        new Date()
      );

      expect(courseModule.isPublished).toBe(false);
    });
  });

  describe('orderIndex property', () => {
    it('should handle different order indices', () => {
      const module1 = new CourseModuleEntity(
        'module-1',
        'course-1',
        'Module 1',
        'Description',
        1,
        'Content',
        true,
        new Date(),
        new Date()
      );

      const module2 = new CourseModuleEntity(
        'module-2',
        'course-1',
        'Module 2',
        'Description',
        5,
        'Content',
        true,
        new Date(),
        new Date()
      );

      expect(module1.orderIndex).toBe(1);
      expect(module2.orderIndex).toBe(5);
      expect(module1.orderIndex).toBeLessThan(module2.orderIndex);
    });
  });
});
