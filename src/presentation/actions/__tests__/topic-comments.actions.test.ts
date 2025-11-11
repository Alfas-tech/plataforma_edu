import { jest } from "@jest/globals";
import {
  getTopicComment,
  upsertTopicComment,
  createCommentResponse,
} from "../topic-comments.actions";

// Mock next/cache revalidation helpers
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}));

// Mock the supabase server client
const mockFrom: any = jest.fn();
const mockCreateClient: any = jest.fn(() => ({ from: mockFrom }));

// Replace module with our mock (match runtime import used in actions)
jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: mockCreateClient,
}));

// Mock getCurrentProfile
const mockGetCurrentProfile: any = jest.fn();
jest.mock("../profile.actions", () => ({
  getCurrentProfile: mockGetCurrentProfile,
}));

describe("topic-comments.actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getTopicComment returns comment and responses when present", async () => {
    const fakeComment = {
      id: "c1",
      topic_id: "t1",
      content: "hola",
      created_at: "now",
      updated_at: "now",
    };
    const fakeResponses = [
      { id: "r1", comment_id: "c1", content: "resp", created_at: "now" },
    ];

    // Setup chain for topic_comments
    const topicSelect: any = jest.fn().mockReturnThis();
    const topicEq: any = jest.fn().mockReturnThis();
    const topicSingle: any = jest.fn();
    (topicSingle as any).mockResolvedValue({ data: fakeComment, error: null });

    // Setup chain for comment_responses
    const respSelect: any = jest.fn().mockReturnThis();
    const respEq: any = jest.fn().mockReturnThis();
    const respOrder: any = jest.fn().mockReturnThis();

    mockFrom.mockImplementation((table: any) => {
      if (table === "topic_comments") {
        return { select: topicSelect, eq: topicEq, single: topicSingle } as any;
      }
      if (table === "comment_responses") {
        return { select: respSelect, eq: respEq, order: respOrder } as any;
      }
      return {} as any;
    });

    const result = await getTopicComment("t1");
    expect(result).toHaveProperty("data");
    if ("data" in result) {
      expect(result.data.comment).toEqual(fakeComment);
    }
  });

  test("getTopicComment returns empty when no comment found", async () => {
    // Simulate PostgREST "no rows" as error code PGRST116
    const topicSelect: any = jest.fn().mockReturnThis();
    const topicEq: any = jest.fn().mockReturnThis();
    const topicSingle: any = jest.fn();
    (topicSingle as any).mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows" },
    });

    mockFrom.mockImplementation((table: any) => {
      if (table === "topic_comments") {
        return { select: topicSelect, eq: topicEq, single: topicSingle } as any;
      }
      return {} as any;
    });

    const result = await getTopicComment("t-no");
    expect(result).toHaveProperty("data");
    if ("data" in result) {
      expect(result.data.comment).toBeNull();
      expect(Array.isArray(result.data.responses)).toBe(true);
    }
  });

  test("upsertTopicComment rejects when not authenticated or not editor", async () => {
    mockGetCurrentProfile.mockResolvedValueOnce({ error: "not auth" });
    const r1 = await upsertTopicComment({ topic_id: "t1", content: "c" });
    expect("error" in r1).toBe(true);

    mockGetCurrentProfile.mockResolvedValueOnce({
      profile: { id: "u1", role: "student" },
    });
    const r2 = await upsertTopicComment({ topic_id: "t1", content: "c" });
    expect("error" in r2).toBe(true);
  });

  test("upsertTopicComment updates existing comment when present", async () => {
    mockGetCurrentProfile.mockResolvedValueOnce({
      profile: { id: "ed1", role: "editor" },
    });

    const topicSelect: any = jest.fn().mockReturnThis();
    const topicEq: any = jest.fn().mockReturnThis();
    const topicSingle: any = jest.fn();
    (topicSingle as any).mockResolvedValue({
      data: { id: "existing-id" },
      error: null,
    });
    const topicUpdate: any = jest.fn();
    // Make update chainable: update(...).eq('id', existing.id) -> resolves to { error: null }
    const eqMock = jest.fn().mockResolvedValue({ error: null });
    topicUpdate.mockReturnValue({ eq: eqMock });

    mockFrom.mockImplementation((table: any) => {
      if (table === "topic_comments") {
        return {
          select: topicSelect,
          eq: topicEq,
          single: topicSingle,
          update: topicUpdate,
        } as any;
      }
      return {} as any;
    });

    const res = await upsertTopicComment({
      topic_id: "t1",
      content: "updated",
    });
    expect(res).toHaveProperty("success");
    expect((res as any).success).toBe(true);
  });

  test("createCommentResponse inserts and returns success", async () => {
    mockGetCurrentProfile.mockResolvedValueOnce({ profile: { id: "u2" } });

    const respInsert: any = jest.fn();
    (respInsert as any).mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: any) => {
      if (table === "comment_responses") {
        return { insert: respInsert } as any;
      }
      return {} as any;
    });

    const res = await createCommentResponse({
      comment_id: "c1",
      content: "ok",
    });
    expect(res).toHaveProperty("success");
    expect((res as any).success).toBe(true);
  });

  test("createCommentResponse returns error when insert fails", async () => {
    mockGetCurrentProfile.mockResolvedValueOnce({ profile: { id: "u2" } });
    const respInsert: any = jest.fn();
    (respInsert as any).mockResolvedValue({ error: { message: "db error" } });
    mockFrom.mockImplementation((table: any) => {
      if (table === "comment_responses") {
        return { insert: respInsert } as any;
      }
      return {} as any;
    });

    const res = await createCommentResponse({
      comment_id: "c1",
      content: "ok",
    });
    expect("error" in res).toBe(true);
  });
});
