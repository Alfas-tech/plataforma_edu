import { NextResponse } from "next/server";
import { createCommentResponse } from "@/src/presentation/actions/topic-comments.actions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { comment_id, content } = body;
    const result = await createCommentResponse({ comment_id, content });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
