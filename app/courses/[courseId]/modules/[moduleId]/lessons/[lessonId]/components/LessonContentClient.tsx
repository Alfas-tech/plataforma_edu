"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import {
  markLessonComplete,
  markLessonIncomplete,
} from "@/src/presentation/actions/student.actions";
import { useRouter } from "next/navigation";

interface LessonContentClientProps {
  lessonId: string;
  content: string;
  isCompleted: boolean;
}

export function LessonContentClient({
  lessonId,
  content,
  isCompleted: initialCompleted,
}: LessonContentClientProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleComplete = async () => {
    setIsLoading(true);

    try {
      if (isCompleted) {
        const result = await markLessonIncomplete(lessonId);
        if ("error" in result) {
          console.error("Error:", result.error);
        } else {
          setIsCompleted(false);
          router.refresh();
        }
      } else {
        const result = await markLessonComplete(lessonId);
        if ("error" in result) {
          console.error("Error:", result.error);
        } else {
          setIsCompleted(true);
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Lesson Content */}
      <div className="prose prose-slate max-w-none">
        {content ? (
          <div className="whitespace-pre-wrap text-slate-700">{content}</div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-slate-600">
              El contenido de esta lección estará disponible pronto.
            </p>
          </div>
        )}
      </div>

      {/* Complete Button */}
      <div className="mt-8 border-t pt-6">
        <Button
          onClick={handleToggleComplete}
          disabled={isLoading}
          className={`w-full ${
            isCompleted
              ? "bg-slate-600 hover:bg-slate-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Actualizando...
            </>
          ) : isCompleted ? (
            <>
              <Circle className="mr-2 h-5 w-5" />
              Marcar como no completada
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Marcar como completada
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
