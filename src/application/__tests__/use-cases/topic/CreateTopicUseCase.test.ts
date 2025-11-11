import { CreateTopicUseCase } from "@/src/application/use-cases/topic/CreateTopicUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { CourseData, CourseVersionData, TopicData } from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("CreateTopicUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let useCase: CreateTopicUseCase;

  const nowIso = new Date().toISOString();

  const makeCourse = (
    overrides: Partial<CourseData> = {},
    versions: CourseVersionData[] = []
  ): CourseEntity =>
    CourseEntity.fromDatabase(
      {
        id: "course-1",
        name: "Course",
        description: "Description",
        created_by: "user-1",
        active_version_id: versions[0]?.id ?? "version-1",
        created_at: nowIso,
        updated_at: nowIso,
        ...overrides,
      },
      { versions: versions.length ? versions : [makeVersionData()] }
    );

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
      createTopic: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new CreateTopicUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  it("creates a topic using the course active version when the user is admin", async () => {
    const course = makeCourse();
    const createdTopic = makeTopic();

    mockCourseRepository.getCourseById.mockResolvedValue(course);
    mockAuthRepository.getCurrentUser.mockResolvedValue({ id: "user-99" } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(makeProfile("admin") as any);
    mockCourseRepository.createTopic.mockResolvedValue(createdTopic);

    const result = await useCase.execute({
      courseId: course.id,
      title: "New Topic",
      description: "Description",
      orderIndex: 3,
    });

    expect(result.success).toBe(true);
    expect(result.topic).toEqual(createdTopic);
    expect(mockCourseRepository.createTopic).toHaveBeenCalledWith(
      expect.objectContaining({
        courseVersionId: "version-1",
        title: "New Topic",
        description: "Description",
        createdBy: "user-99",
        orderIndex: 3,
      })
    );
  });

  it("returns an error when the course does not have an active version", async () => {
    const courseWithoutVersion = makeCourse(
      { active_version_id: null },
      [makeVersionData({ status: "draft" })]
    );

    mockCourseRepository.getCourseById.mockResolvedValue(courseWithoutVersion);
    mockAuthRepository.getCurrentUser.mockResolvedValue({ id: "user-1" } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(makeProfile("admin") as any);

    const result = await useCase.execute({
      courseId: courseWithoutVersion.id,
      title: "Topic",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("El curso no tiene una versión activa");
    expect(mockCourseRepository.createTopic).not.toHaveBeenCalled();
  });

  it("denies creation when the teacher is not assigned to the target version", async () => {
    const course = makeCourse();

    mockCourseRepository.getCourseById.mockResolvedValue(course);
    mockAuthRepository.getCurrentUser.mockResolvedValue({ id: "teacher-1" } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(makeProfile("teacher") as any);
    mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

    const result = await useCase.execute({
      courseId: course.id,
      title: "Topic",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No estás asignado a esta versión del curso");
    expect(mockCourseRepository.createTopic).not.toHaveBeenCalled();
    expect(mockCourseRepository.isTeacherAssignedToVersion).toHaveBeenCalledWith(
      "version-1",
      "teacher-1"
    );
  });
});
