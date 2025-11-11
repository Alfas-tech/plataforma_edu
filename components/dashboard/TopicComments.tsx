import React from "react";
import { getTopicComment, handleUpsertCommentAction, handleCreateResponseAction } from "@/src/presentation/actions/topic-comments.actions";

export default async function TopicComments({ topicId }: { topicId: string }) {
  const result = await getTopicComment(topicId);

  if ("error" in result) {
    return <div>Error: {result.error}</div>;
  }

  const { comment, responses } = result.data;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comentario del tópico</h3>

      {comment ? (
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-600">Autor: {comment.profiles?.full_name || 'Desconocido'}</div>
          <div className="mt-2">{comment.content}</div>
          <form action={handleUpsertCommentAction}>
            <input type="hidden" name="topic_id" value={topicId} />
            <textarea name="content" defaultValue={comment.content} className="w-full mt-2 p-2 border rounded" />
            <button type="submit" className="mt-2 btn">Guardar</button>
          </form>

          <div className="mt-4">
            <h4 className="font-medium">Respuestas</h4>
            <div className="space-y-2 mt-2">
              {responses && responses.length > 0 ? responses.map((r: any) => (
                <div key={r.id} className="p-2 border rounded">
                  <div className="text-sm text-gray-600">{r.profiles?.full_name || 'Anon'}</div>
                  <div className="mt-1">{r.content}</div>
                </div>
              )) : <div className="text-sm text-gray-500">No hay respuestas</div>}
            </div>

            <form action={handleCreateResponseAction} className="mt-2">
              <input type="hidden" name="comment_id" value={comment.id} />
              <textarea name="content" placeholder="Escribe una respuesta..." className="w-full mt-2 p-2 border rounded" />
              <button type="submit" className="mt-2 btn">Responder</button>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded">
          <div>No hay comentario aún.</div>
          <form action={handleUpsertCommentAction}>
            <input type="hidden" name="topic_id" value={topicId} />
            <textarea name="content" placeholder="Escribe el comentario del tópico..." className="w-full mt-2 p-2 border rounded" />
            <button type="submit" className="mt-2 btn">Crear comentario</button>
          </form>
        </div>
      )}
    </div>
  );
}
