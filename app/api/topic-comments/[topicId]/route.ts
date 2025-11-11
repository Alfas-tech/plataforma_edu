import { NextResponse } from 'next/server';
import { getTopicComment } from '@/src/presentation/actions/topic-comments.actions';

export async function GET(request: Request, { params }: { params: { topicId: string }}) {
  try {
    const { topicId } = params;
    const result = await getTopicComment(topicId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
