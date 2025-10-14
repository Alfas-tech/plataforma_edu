import { LessonEntity } from '@/src/core/entities/Lesson.entity';

describe('LessonEntity', () => {
  const mockLessonData = {
    id: 'lesson-123',
    moduleId: 'module-123',
    title: 'Test Lesson',
    content: 'Test Content',
    orderIndex: 1,
    durationMinutes: 30,
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  describe('constructor', () => {
    it('should create a lesson entity with all properties', () => {
      const lesson = new LessonEntity(
        mockLessonData.id,
        mockLessonData.moduleId,
        mockLessonData.title,
        mockLessonData.content,
        mockLessonData.orderIndex,
        mockLessonData.durationMinutes,
        mockLessonData.isPublished,
        mockLessonData.createdAt,
        mockLessonData.updatedAt
      );

      expect(lesson.id).toBe(mockLessonData.id);
      expect(lesson.moduleId).toBe(mockLessonData.moduleId);
      expect(lesson.title).toBe(mockLessonData.title);
      expect(lesson.content).toBe(mockLessonData.content);
      expect(lesson.orderIndex).toBe(mockLessonData.orderIndex);
      expect(lesson.durationMinutes).toBe(mockLessonData.durationMinutes);
      expect(lesson.isPublished).toBe(mockLessonData.isPublished);
      expect(lesson.createdAt).toBe(mockLessonData.createdAt);
      expect(lesson.updatedAt).toBe(mockLessonData.updatedAt);
    });

    it('should create a lesson with null content', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Lesson Title',
        null,
        1,
        30,
        false,
        new Date(),
        new Date()
      );

      expect(lesson.content).toBeNull();
    });

    it('should create a lesson with null durationMinutes', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Lesson Title',
        'Content',
        1,
        null,
        false,
        new Date(),
        new Date()
      );

      expect(lesson.durationMinutes).toBeNull();
    });
  });

  describe('getDurationFormatted', () => {
    it('should format duration in hours and minutes when duration is more than 60 minutes', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Long Lesson',
        'Content',
        1,
        90,
        true,
        new Date(),
        new Date()
      );

      expect(lesson.getDurationFormatted()).toBe('1h 30min');
    });

    it('should format duration in minutes only when less than 60 minutes', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Short Lesson',
        'Content',
        1,
        45,
        true,
        new Date(),
        new Date()
      );

      expect(lesson.getDurationFormatted()).toBe('45min');
    });

    it('should format duration in hours only when duration is exactly divisible by 60', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Hour Lesson',
        'Content',
        1,
        120,
        true,
        new Date(),
        new Date()
      );

      expect(lesson.getDurationFormatted()).toBe('2h');
    });

    it('should return "Duración no especificada" when duration is null', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'No Duration Lesson',
        'Content',
        1,
        null,
        true,
        new Date(),
        new Date()
      );

      expect(lesson.getDurationFormatted()).toBe('Duración no especificada');
    });

    it('should return "Duración no especificada" when duration is 0', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Zero Duration Lesson',
        'Content',
        1,
        0,
        true,
        new Date(),
        new Date()
      );

      expect(lesson.getDurationFormatted()).toBe('Duración no especificada');
    });
  });

  describe('isAccessible', () => {
    it('should return true when lesson is published', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Published Lesson',
        'Content',
        1,
        30,
        true,
        new Date(),
        new Date()
      );

      expect(lesson.isAccessible()).toBe(true);
    });

    it('should return false when lesson is not published', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Unpublished Lesson',
        'Content',
        1,
        30,
        false,
        new Date(),
        new Date()
      );

      expect(lesson.isAccessible()).toBe(false);
    });
  });

  describe('fromDatabase', () => {
    it('should create lesson entity from database data', () => {
      const dbData = {
        id: 'lesson-1',
        module_id: 'module-1',
        title: 'DB Lesson',
        content: 'DB Content',
        order_index: 1,
        duration_minutes: 30,
        is_published: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const lesson = LessonEntity.fromDatabase(dbData);

      expect(lesson.id).toBe(dbData.id);
      expect(lesson.moduleId).toBe(dbData.module_id);
      expect(lesson.title).toBe(dbData.title);
      expect(lesson.content).toBe(dbData.content);
      expect(lesson.orderIndex).toBe(dbData.order_index);
      expect(lesson.durationMinutes).toBe(dbData.duration_minutes);
      expect(lesson.isPublished).toBe(dbData.is_published);
    });
  });

  describe('isPublished property', () => {
    it('should correctly set isPublished to true', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Published Lesson',
        'Content',
        1,
        30,
        true,
        new Date(),
        new Date()
      );

      expect(lesson.isPublished).toBe(true);
    });

    it('should correctly set isPublished to false', () => {
      const lesson = new LessonEntity(
        'lesson-1',
        'module-1',
        'Unpublished Lesson',
        'Content',
        1,
        30,
        false,
        new Date(),
        new Date()
      );

      expect(lesson.isPublished).toBe(false);
    });
  });

  describe('orderIndex property', () => {
    it('should handle different order indices', () => {
      const lesson1 = new LessonEntity(
        'lesson-1',
        'module-1',
        'Lesson 1',
        'Content',
        1,
        30,
        true,
        new Date(),
        new Date()
      );

      const lesson2 = new LessonEntity(
        'lesson-2',
        'module-1',
        'Lesson 2',
        'Content',
        5,
        45,
        true,
        new Date(),
        new Date()
      );

      expect(lesson1.orderIndex).toBe(1);
      expect(lesson2.orderIndex).toBe(5);
      expect(lesson1.orderIndex).toBeLessThan(lesson2.orderIndex);
    });
  });
});

