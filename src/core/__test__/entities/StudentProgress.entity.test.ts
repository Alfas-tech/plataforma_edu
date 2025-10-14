import { StudentProgressEntity } from '@/src/core/entities/StudentProgress.entity';
import { StudentProgressData } from '@/src/core/types/course.types';

describe('StudentProgressEntity', () => {
  describe('constructor', () => {
    it('should create a StudentProgressEntity with all properties', () => {
      const completedAt = new Date('2024-01-15');
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        true,
        completedAt,
        45
      );

      expect(progress.id).toBe('progress-1');
      expect(progress.studentId).toBe('student-1');
      expect(progress.lessonId).toBe('lesson-1');
      expect(progress.completed).toBe(true);
      expect(progress.completedAt).toBe(completedAt);
      expect(progress.timeSpentMinutes).toBe(45);
    });

    it('should create a StudentProgressEntity with null completedAt', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        false,
        null,
        0
      );

      expect(progress.completed).toBe(false);
      expect(progress.completedAt).toBeNull();
      expect(progress.timeSpentMinutes).toBe(0);
    });
  });

  describe('fromDatabase', () => {
    it('should create StudentProgressEntity from database data with completed_at', () => {
      const data: StudentProgressData = {
        id: 'progress-1',
        student_id: 'student-1',
        lesson_id: 'lesson-1',
        completed: true,
        completed_at: '2024-01-15T10:30:00Z',
        time_spent_minutes: 60,
      };

      const progress = StudentProgressEntity.fromDatabase(data);

      expect(progress.id).toBe('progress-1');
      expect(progress.studentId).toBe('student-1');
      expect(progress.lessonId).toBe('lesson-1');
      expect(progress.completed).toBe(true);
      expect(progress.completedAt).toBeInstanceOf(Date);
      expect(progress.completedAt?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
      expect(progress.timeSpentMinutes).toBe(60);
    });

    it('should create StudentProgressEntity from database data with null completed_at', () => {
      const data: StudentProgressData = {
        id: 'progress-2',
        student_id: 'student-2',
        lesson_id: 'lesson-2',
        completed: false,
        completed_at: null,
        time_spent_minutes: 15,
      };

      const progress = StudentProgressEntity.fromDatabase(data);

      expect(progress.id).toBe('progress-2');
      expect(progress.completed).toBe(false);
      expect(progress.completedAt).toBeNull();
      expect(progress.timeSpentMinutes).toBe(15);
    });
  });

  describe('isCompleted', () => {
    it('should return true when progress is completed', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        true,
        new Date(),
        30
      );

      expect(progress.isCompleted()).toBe(true);
    });

    it('should return false when progress is not completed', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        false,
        null,
        10
      );

      expect(progress.isCompleted()).toBe(false);
    });
  });

  describe('getTimeSpentFormatted', () => {
    it('should return "Sin tiempo registrado" when time is 0', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        false,
        null,
        0
      );

      expect(progress.getTimeSpentFormatted()).toBe('Sin tiempo registrado');
    });

    it('should return formatted time with hours and minutes', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        true,
        new Date(),
        90 // 1h 30min
      );

      expect(progress.getTimeSpentFormatted()).toBe('1h 30min');
    });

    it('should return formatted time with only hours when minutes is 0', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        true,
        new Date(),
        120 // 2h
      );

      expect(progress.getTimeSpentFormatted()).toBe('2h');
    });

    it('should return formatted time with only minutes when less than 60', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        true,
        new Date(),
        45 // 45min
      );

      expect(progress.getTimeSpentFormatted()).toBe('45min');
    });

    it('should handle large time values correctly', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        true,
        new Date(),
        185 // 3h 5min
      );

      expect(progress.getTimeSpentFormatted()).toBe('3h 5min');
    });

    it('should handle exactly 1 minute', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        false,
        null,
        1
      );

      expect(progress.getTimeSpentFormatted()).toBe('1min');
    });

    it('should handle exactly 1 hour', () => {
      const progress = new StudentProgressEntity(
        'progress-1',
        'student-1',
        'lesson-1',
        true,
        new Date(),
        60
      );

      expect(progress.getTimeSpentFormatted()).toBe('1h');
    });
  });
});

