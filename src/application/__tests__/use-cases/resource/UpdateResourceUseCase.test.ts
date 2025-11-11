import { UpdateResourceUseCase } from "@/src/application/use-cases/resource/UpdateResourceUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseResourceEntity } from "@/src/core/entities/CourseResource.entity";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { ResourceData, TopicData } from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("UpdateResourceUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let useCase: UpdateResourceUseCase;

  const nowIso = new Date().toISOString();

  const makeResource = (
    overrides: Partial<ResourceData> = {}
  ): CourseResourceEntity =>
    CourseResourceEntity.fromDatabase({
      id: "resource-1",
      topic_id: "topic-1",
      title: "Original",
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
      getResourceById: jest.fn(),
      getTopicById: jest.fn(),
      updateResource: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new UpdateResourceUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  it("updates a resource when the user has permissions", async () => {
    const resource = makeResource();
    const topic = makeTopic();
    const updated = makeResource({ title: "Updated" });

    mockCourseRepository.getResourceById.mockResolvedValue(resource);
    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({ id: "user-1" } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(makeProfile("editor") as any);
    mockCourseRepository.updateResource.mockResolvedValue(updated);

    const result = await useCase.execute("resource-1", { title: "Updated" });

    expect(result.success).toBe(true);
    expect(result.resource).toEqual(updated);
    expect(mockCourseRepository.updateResource).toHaveBeenCalledWith(
      "resource-1",
      expect.objectContaining({ title: "Updated" })
    );
  });

  it("returns an error when the resource does not exist", async () => {
    mockCourseRepository.getResourceById.mockResolvedValue(null);

    const result = await useCase.execute("resource-unknown", { title: "Updated" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Recurso no encontrado");
    expect(mockCourseRepository.updateResource).not.toHaveBeenCalled();
  });

  it("denies update when the teacher is not assigned to the version", async () => {
    const resource = makeResource();
    const topic = makeTopic();

    mockCourseRepository.getResourceById.mockResolvedValue(resource);
    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({ id: "teacher-1" } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(makeProfile("teacher") as any);
    mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

    const result = await useCase.execute("resource-1", { title: "Updated" });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No estás asignado a esta versión del curso");
    expect(mockCourseRepository.updateResource).not.toHaveBeenCalled();
    expect(mockCourseRepository.isTeacherAssignedToVersion).toHaveBeenCalledWith(
      topic.courseVersionId,
      "teacher-1"
    );
  });
});
