import { UpdateTopicUseCase } from "@/src/application/use-cases/topic/UpdateTopicUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { TopicData, CourseVersionData } from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("UpdateTopicUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let useCase: UpdateTopicUseCase;

  const nowIso = new Date().toISOString();

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

  const makeVersion = (
    overrides: Partial<CourseVersionData> = {}
  ): CourseVersionEntity =>
    CourseVersionEntity.fromDatabase({
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
      getTopicById: jest.fn(),
      getCourseVersionById: jest.fn(),
      updateTopic: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new UpdateTopicUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  it("updates a topic when the user has permissions", async () => {
    const topic = makeTopic();
    const version = makeVersion({ id: topic.courseVersionId });
    const updated = makeTopic({ title: "Updated" });

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockCourseRepository.getCourseVersionById.mockResolvedValue(version);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "user-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("editor") as any
    );
    mockCourseRepository.updateTopic.mockResolvedValue(updated);

    const result = await useCase.execute("topic-1", { title: "Updated" });

    expect(result.success).toBe(true);
    expect(result.topic).toEqual(updated);
    expect(mockCourseRepository.updateTopic).toHaveBeenCalledWith(
      "topic-1",
      expect.objectContaining({ title: "Updated" })
    );
  });

  it("returns an error when the topic cannot be found", async () => {
    mockCourseRepository.getTopicById.mockResolvedValue(null);

    const result = await useCase.execute("topic-unknown", { title: "Updated" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Tópico no encontrado");
    expect(mockCourseRepository.updateTopic).not.toHaveBeenCalled();
  });

  it("denies update when the teacher is not assigned", async () => {
    const topic = makeTopic();
    const version = makeVersion({ id: topic.courseVersionId });

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockCourseRepository.getCourseVersionById.mockResolvedValue(version);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "teacher-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("teacher") as any
    );
    mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

    const result = await useCase.execute("topic-1", { title: "Updated" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No estás asignado a esta versión del curso");
    expect(mockCourseRepository.updateTopic).not.toHaveBeenCalled();
    expect(
      mockCourseRepository.isTeacherAssignedToVersion
    ).toHaveBeenCalledWith(topic.courseVersionId, "teacher-1");
  });
});
