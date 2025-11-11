import { CreateResourceUseCase } from "@/src/application/use-cases/resource/CreateResourceUseCase";
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

describe("CreateResourceUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let useCase: CreateResourceUseCase;

  const nowIso = new Date().toISOString();

  const makeTopic = (overrides: Partial<TopicData> = {}): CourseTopicEntity => {
    const data: TopicData = {
      id: "topic-1",
      course_version_id: "version-1",
      title: "Topic",
      description: null,
      order_index: 1,
      created_at: nowIso,
      updated_at: nowIso,
      ...overrides,
    };
    return CourseTopicEntity.fromDatabase(data);
  };

  const makeResource = (
    overrides: Partial<ResourceData> = {}
  ): CourseResourceEntity => {
    const data: ResourceData = {
      id: "resource-1",
      topic_id: "topic-1",
      title: "Resource",
      description: null,
      resource_type: "pdf",
      file_url: "courses/course-1/resources/doc.pdf",
      file_name: "doc.pdf",
      file_size: 100,
      mime_type: "application/pdf",
      external_url: null,
      order_index: 1,
      created_at: nowIso,
      updated_at: nowIso,
      ...overrides,
    };
    return CourseResourceEntity.fromDatabase(data);
  };

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
      addResource: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new CreateResourceUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  it("creates a resource when the user has permissions", async () => {
    const topic = makeTopic();
    const createdResource = makeResource();

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({ id: "user-1" } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(makeProfile("admin") as any);
    mockCourseRepository.addResource.mockResolvedValue(createdResource);

    const result = await useCase.execute({
      topicId: topic.id,
      title: "New Resource",
      description: "Description",
      resourceType: "pdf",
      fileUrl: "courses/course-1/resources/doc.pdf",
      orderIndex: 2,
    });

    expect(result.success).toBe(true);
    expect(result.resource).toEqual(createdResource);
    expect(mockCourseRepository.addResource).toHaveBeenCalledWith(
      expect.objectContaining({
        topicId: topic.id,
        title: "New Resource",
        resourceType: "pdf",
        createdBy: "user-1",
        orderIndex: 2,
      })
    );
  });

  it("returns an error when the topic does not exist", async () => {
    mockCourseRepository.getTopicById.mockResolvedValue(null);

    const result = await useCase.execute({
      topicId: "topic-unknown",
      title: "Resource",
      resourceType: "pdf",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Tópico no encontrado");
    expect(mockCourseRepository.addResource).not.toHaveBeenCalled();
  });

  it("denies creation when the teacher is not assigned to the version", async () => {
    const topic = makeTopic();

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({ id: "teacher-1" } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(makeProfile("teacher") as any);
    mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

    const result = await useCase.execute({
      topicId: topic.id,
      title: "Resource",
      resourceType: "pdf",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No estás asignado a esta versión del curso");
    expect(mockCourseRepository.addResource).not.toHaveBeenCalled();
    expect(mockCourseRepository.isTeacherAssignedToVersion).toHaveBeenCalledWith(
      topic.courseVersionId,
      "teacher-1"
    );
  });
});
