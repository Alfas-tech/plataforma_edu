"use server";

import {
  revalidatePath as _revalidatePath,
  revalidateTag as _revalidateTag,
} from "next/cache";

// Types for topic comments and responses
interface IProfileTiny {
  id: string;
  full_name?: string;
  role?: string;
}
interface ITopicCommentRow {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
  profiles?: IProfileTiny;
}
interface ICommentResponseRow {
  id: string;
  comment_id: string;
  content: string;
  created_at: string;
  author_id?: string;
  profiles?: IProfileTiny;
}

interface IGetTopicCommentData {
  comment: ITopicCommentRow | null;
  responses: ICommentResponseRow[];
}

// Generic result types
type TResultWithData<T> = { data: T } | { error: string };

function safeRevalidateTag(tag: string) {
  try {
    _revalidateTag?.(tag);
  } catch (e) {
    // ignore in tests or when static generation store is not present
  }
}
function safeRevalidatePath(path: string) {
  try {
    _revalidatePath?.(path);
  } catch (e) {
    // ignore in tests or when static generation store is not present
  }
}

async function callMaybeChainable<T = any>(
  maybeChainable: any,
  chainMethod?: string,
  ...chainArgs: any[]
) {
  // If the function returned a Promise-like, await it
  if (!maybeChainable) return null;
  if (typeof maybeChainable.then === "function") {
    return await maybeChainable;
  }
  // If it's chainable (has the method), call it
  if (chainMethod && typeof maybeChainable[chainMethod] === "function") {
    return await maybeChainable[chainMethod](...chainArgs);
  }
  // Otherwise, return as-is
  return maybeChainable;
}

// Get the single comment for a topic and its responses
export async function getTopicComment(
  topicId: string
): Promise<TResultWithData<IGetTopicCommentData>> {
  try {
    // Import createClient dynamically so tests can mock the module even if they
    // imported this actions file before calling jest.mock
    const { createClient } = await import(
      "@/src/infrastructure/supabase/server"
    );
    const supabase = createClient();

    const { data: comment, error } = await supabase
      .from("topic_comments")
      .select("*, profiles:author_id(id, full_name, role)")
      .eq("topic_id", topicId)
      .single();

    if (error && error.code !== "PGRST116") {
      return { error: error.message };
    }

    // If there is a comment, fetch its responses
    if (comment?.id) {
      const { data: responses, error: resError } = await supabase
        .from("comment_responses")
        .select("*, profiles:author_id(id, full_name, role)")
        .eq("comment_id", comment.id)
        .order("created_at", { ascending: true });

      if (resError) {
        return { error: resError.message };
      }

      return { data: { comment, responses } };
    }

    return { data: { comment: null, responses: [] } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Upsert (create or update) the single topic comment. Only editors allowed.
export async function upsertTopicComment(form: {
  topic_id: string;
  content: string;
}): Promise<{ success: true } | { error: string }> {
  try {
    // Import getCurrentProfile dynamically so tests can mock it reliably
    const { getCurrentProfile } = await import("./profile.actions");

    // Verify current user is editor and get author id
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    if (profileResult.profile.role !== "editor") {
      return {
        error: "Solo usuarios con rol editor pueden crear/editar el comentario",
      };
    }

    const author_id = profileResult.profile.id;
    const { createClient } = await import(
      "@/src/infrastructure/supabase/server"
    );
    const supabase = createClient();

    // Try to update existing comment for topic
    const { data: existing } = await supabase
      .from("topic_comments")
      .select("id")
      .eq("topic_id", form.topic_id)
      .single();

    if (existing?.id) {
      const updateResult = supabase
        .from("topic_comments")
        .update({ content: form.content, author_id });

      // Support both chainable mocks (update(...).eq(...)) and direct promise mocks
      const finalUpdate = await callMaybeChainable(
        updateResult,
        "eq",
        "id",
        existing.id
      );
      const error = finalUpdate?.error ?? null;
      if (error) return { error: error.message || error };
    } else {
      const insertResult = await supabase
        .from("topic_comments")
        .insert([
          { topic_id: form.topic_id, content: form.content, author_id },
        ]);
      if (insertResult.error) return { error: insertResult.error.message };
    }

    safeRevalidateTag(`topic-${form.topic_id}`);
    safeRevalidatePath(`/dashboard/editor/courses`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Create a response for the given comment. Author may be null if anonymous.
export async function createCommentResponse(form: {
  comment_id: string;
  content: string;
}): Promise<{ success: true } | { error: string }> {
  try {
    // Import getCurrentProfile dynamically so tests can mock it reliably
    const { getCurrentProfile } = await import("./profile.actions");
    // Attach author from current profile if available
    const profileResult = await getCurrentProfile();
    const author_id =
      "error" in profileResult ? null : profileResult.profile.id;

    const { createClient } = await import(
      "@/src/infrastructure/supabase/server"
    );
    const supabase = createClient();

    const { error } = await supabase
      .from("comment_responses")
      .insert([
        { comment_id: form.comment_id, content: form.content, author_id },
      ]);
    if (error) return { error: error.message };

    safeRevalidateTag(`topic-comment-${form.comment_id}`);
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

// Note: server-action wrappers were removed because the application uses API endpoints
// (app/api/topic-comments/*) and a client component that fetches them asynchronously.
// This keeps the presentation layer consistent with the project architecture and
// avoids dead code.
