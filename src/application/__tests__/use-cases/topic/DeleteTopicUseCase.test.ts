import { DeleteTopicUseCase } from "@/src/application/use-cases/topic/DeleteTopicUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { TopicData } from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("DeleteTopicUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let useCase: DeleteTopicUseCase;

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
      deleteTopic: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new DeleteTopicUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  it("deletes the topic when the user is admin", async () => {
    const topic = makeTopic();

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "user-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("admin") as any
    );

    const result = await useCase.execute(topic.id);

    expect(result.success).toBe(true);
    expect(mockCourseRepository.deleteTopic).toHaveBeenCalledWith(topic.id);
  });

  it("returns an error when the user lacks permissions", async () => {
    const topic = makeTopic();

    mockCourseRepository.getTopicById.mockResolvedValue(topic);
    mockAuthRepository.getCurrentUser.mockResolvedValue({
      id: "user-1",
    } as any);
    mockProfileRepository.getProfileByUserId.mockResolvedValue(
      makeProfile("student") as any
    );

    const result = await useCase.execute(topic.id);

    expect(result.success).toBe(false);
    expect(result.error).toBe("No tienes permisos para eliminar tópicos");
    expect(mockCourseRepository.deleteTopic).not.toHaveBeenCalled();
  });

  it("denies deletion when the teacher is not assigned", async () => {
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
    expect(mockCourseRepository.deleteTopic).not.toHaveBeenCalled();
    expect(
      mockCourseRepository.isTeacherAssignedToVersion
    ).toHaveBeenCalledWith(topic.courseVersionId, "teacher-1");
  });
});
