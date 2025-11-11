import { GetResourcesByTopicUseCase } from "@/src/application/use-cases/resource/GetResourcesByTopicUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { CourseResourceEntity } from "@/src/core/entities/CourseResource.entity";
import { TopicData, ResourceData } from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("GetResourcesByTopicUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let useCase: GetResourcesByTopicUseCase;

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

  const makeResource = (
    overrides: Partial<ResourceData> = {}
  ): CourseResourceEntity =>
    CourseResourceEntity.fromDatabase({
      id: "resource-1",
      topic_id: "topic-1",
      title: "Resource",
      description: null,
      resource_type: "pdf",
      file_url: null,
      file_name: null,
      file_size: null,
      mime_type: null,
      external_url: null,
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
      getTopicById: jest.fn(),
      listResources: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new GetResourcesByTopicUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  it("returns the topic resources when the user has access", async () => {
    const topic = makeTopic();
    const resources = [
      makeResource(),
      makeResource({ id: "resource-2", order_index: 2 }),
    ];

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "user-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("admin") as any
    );
    mockCourseRepository.listResources.mockResolvedValue(resources);

    const result = await useCase.execute(topic.id);

    expect(result.success).toBe(true);
    expect(result.topic).toEqual(topic);
    expect(result.resources).toEqual(resources);
    expect(mockCourseRepository.listResources).toHaveBeenCalledWith(topic.id);
  });

  it("returns an error when the topic does not exist", async () => {
    mockCourseRepository.getTopicById.mockResolvedValue(null);

    const result = await useCase.execute("topic-unknown");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Tópico no encontrado");
    expect(mockCourseRepository.listResources).not.toHaveBeenCalled();
  });

  it("denies access when the teacher is not assigned to the version", async () => {
    const topic = makeTopic();

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "teacher-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("teacher") as any
    );
    mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

    const result = await useCase.execute(topic.id);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No estás asignado a esta versión del curso");
    expect(mockCourseRepository.listResources).not.toHaveBeenCalled();
    expect(
      mockCourseRepository.isTeacherAssignedToVersion
    ).toHaveBeenCalledWith(topic.courseVersionId, "teacher-1");
  });
});
