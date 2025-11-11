"use client";
import React, { useEffect, useState } from "react";

interface IProfileTiny {
  id: string;
  full_name?: string;
  role?: string;
}
interface IComment {
  id: string;
  topic_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles?: IProfileTiny;
}
interface IResponseItem {
  id: string;
  comment_id: string;
  content: string;
  created_at: string;
  profiles?: IProfileTiny;
}

export function TopicCommentsClient({
  topicId,
}: {
  topicId: string;
}): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [comment, setComment] = useState<IComment | null>(null);
  const [responses, setResponses] = useState<IResponseItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [responseContent, setResponseContent] = useState<string>("");

  // Fetch comment and responses for a topic
  const fetchData = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/topic-comments/${topicId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error cargando comentarios");
      } else {
        setComment(data.comment ?? null);
        setResponses(data.responses ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // short polling to keep comments in sync (10s)
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, [topicId]);

  // Create or update the single topic comment (editors only allowed by backend)
  const handleCreateOrUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/topic-comments/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error guardando comentario");
      } else {
        setContent("");
        await fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Create a response for the topic comment
  const handleCreateResponse = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!comment) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/topic-comments/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_id: comment.id,
          content: responseContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error guardando respuesta");
      } else {
        setResponseContent("");
        await fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <h4 className="text-sm font-semibold">Comentario del tópico</h4>
      {loading && <div className="text-xs text-gray-500">Cargando...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {comment ? (
        <div className="mt-2 rounded border p-3">
          <div className="text-xs text-gray-600">
            Autor: {comment.profiles?.full_name ?? "Desconocido"}
          </div>
          <div className="mt-2 text-sm">{comment.content}</div>

          <form onSubmit={handleCreateOrUpdate} className="mt-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Editar comentario..."
              className="w-full rounded border p-2"
            />
            <div className="mt-2 flex gap-2">
              <button disabled={loading} className="btn">
                Guardar
              </button>
            </div>
          </form>

          <div className="mt-4">
            <h5 className="text-sm font-medium">Respuestas</h5>
            <div className="mt-2 space-y-2">
              {responses.length === 0 && (
                <div className="text-xs text-gray-500">No hay respuestas</div>
              )}
              {responses.map((r) => (
                <div key={r.id} className="rounded border p-2">
                  <div className="text-xs text-gray-600">
                    {r.profiles?.full_name ?? "Anon"}
                  </div>
                  <div className="mt-1 text-sm">{r.content}</div>
                </div>
              ))}

              <form onSubmit={handleCreateResponse} className="mt-2">
                <textarea
                  value={responseContent}
                  onChange={(e) => setResponseContent(e.target.value)}
                  placeholder="Escribe una respuesta..."
                  className="w-full rounded border p-2"
                />
                <div className="mt-2">
                  <button
                    disabled={loading || responseContent.trim() === ""}
                    className="btn"
                  >
                    Responder
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 rounded border p-3">
          <div className="text-sm text-gray-600">
            No hay comentario todavía.
          </div>
          <form onSubmit={handleCreateOrUpdate} className="mt-2">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el comentario del tópico..."
              className="w-full rounded border p-2"
            />
            <div className="mt-2">
              <button
                disabled={loading || content.trim() === ""}
                className="btn"
              >
                Crear comentario
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
