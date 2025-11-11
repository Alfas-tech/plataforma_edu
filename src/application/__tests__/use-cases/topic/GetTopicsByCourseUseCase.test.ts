import { GetTopicsByCourseUseCase } from "@/src/application/use-cases/topic/GetTopicsByCourseUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import {
  CourseData,
  CourseVersionData,
  TopicData,
} from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("GetTopicsByCourseUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let useCase: GetTopicsByCourseUseCase;

  const nowIso = new Date().toISOString();

  const makeVersionData = (
    overrides: Partial<CourseVersionData> = {}
  ): CourseVersionData => ({
    id: "version-1",
    course_id: "course-1",
    version_number: 1,
    title: "v1",
    description: "Version",
    content: null,
    status: "active",
    start_date: null,
    end_date: null,
    published_at: nowIso,
    published_by: "user-1",
    created_at: nowIso,
    updated_at: nowIso,
    ...overrides,
  });

  const makeCourse = (
    overrides: Partial<CourseData> = {},
    versions: CourseVersionData[] = [makeVersionData()]
  ): CourseEntity =>
    CourseEntity.fromDatabase(
      {
        id: "course-1",
        name: "Course",
        description: "Description",
        created_by: "user-1",
        active_version_id: versions[0]?.id ?? null,
        created_at: nowIso,
        updated_at: nowIso,
        ...overrides,
      },
      { versions }
    );

  const makeVersion = (
    overrides: Partial<CourseVersionData> = {}
  ): CourseVersionEntity =>
    CourseVersionEntity.fromDatabase(makeVersionData(overrides));

  const makeTopic = (overrides: Partial<TopicData> = {}): CourseTopicEntity =>
    CourseTopicEntity.fromDatabase({
      id: "topic-1",
      course_version_id: "version-1",
      title: "Topic",
      description: null,
      order_index: 1,
      created_at: nowIso,
      updated_at: nowIso,
      ...overrides,
    });

  const makeProfile = (role: "admin" | "editor" | "teacher" | "student") => ({
    id: "profile-1",
    role,
    isAdmin: () => role === "admin",
    isEditor: () => role === "editor",
    isTeacher: () => role === "teacher",
    isStudent: () => role === "student",
  });

  beforeEach(() => {
    mockCourseRepository = {
      getCourseById: jest.fn(),
      getCourseVersionById: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
      listTopics: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new GetTopicsByCourseUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  it("returns topics for the active version when the user is admin", async () => {
    const course = makeCourse();
    const topics = [makeTopic(), makeTopic({ id: "topic-2", order_index: 2 })];

    mockCourseRepository.getCourseById.mockResolvedValue(course);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "user-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("admin") as any
    );
    mockCourseRepository.listTopics.mockResolvedValue(topics);

    const result = await useCase.execute(course.id);

    expect(result.success).toBe(true);
    expect(result.topics).toEqual(topics);
    expect(result.courseVersionId).toBe("version-1");
    expect(mockCourseRepository.listTopics).toHaveBeenCalledWith("version-1");
  });

  it("returns an error when the provided version does not belong to the course", async () => {
    const course = makeCourse();
    const foreignVersion = makeVersion({
      id: "version-99",
      course_id: "another-course",
    });

    mockCourseRepository.getCourseById.mockResolvedValue(course);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "user-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("admin") as any
    );
    mockCourseRepository.getCourseVersionById.mockResolvedValue(foreignVersion);

    const result = await useCase.execute(course.id, {
      courseVersionId: "version-99",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("La versión seleccionada no pertenece al curso");
    expect(mockCourseRepository.listTopics).not.toHaveBeenCalled();
  });

  it("returns an error when the course has no active version", async () => {
    const course = makeCourse({ active_version_id: null }, [
      makeVersionData({ status: "draft" }),
    ]);

    mockCourseRepository.getCourseById.mockResolvedValue(course);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "user-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("admin") as any
    );

    const result = await useCase.execute(course.id);

    expect(result.success).toBe(false);
    expect(result.error).toBe("El curso no tiene una versión activa");
    expect(mockCourseRepository.listTopics).not.toHaveBeenCalled();
  });

  it("denies access when the teacher is not assigned to the version", async () => {
    const course = makeCourse();
    const version = makeVersion({ id: "version-1" });

    mockCourseRepository.getCourseById.mockResolvedValue(course);
    mockCourseRepository.getCourseVersionById.mockResolvedValue(version);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "teacher-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("teacher") as any
    );
    mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

    const result = await useCase.execute(course.id, {
      courseVersionId: version.id,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No estás asignado a esta versión del curso");
    expect(mockCourseRepository.listTopics).not.toHaveBeenCalled();
    expect(
      mockCourseRepository.isTeacherAssignedToVersion
    ).toHaveBeenCalledWith(version.id, "teacher-1");
  });
});
