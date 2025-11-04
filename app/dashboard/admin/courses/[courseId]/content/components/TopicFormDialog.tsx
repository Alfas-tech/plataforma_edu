"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { topicSchema, type TopicInput } from "@/lib/validations";
import {
	createTopic,
	updateTopic,
} from "@/src/presentation/actions/content.actions";

interface TopicData {
	id: string;
	title: string;
	description: string | null;
	orderIndex: number;
}

interface TopicFormDialogProps {
	isOpen: boolean;
	onClose: () => void;
	mode: "create" | "edit";
	courseId: string;
	courseVersionId: string | null;
	topic?: TopicData | null;
}

export function TopicFormDialog({
	isOpen,
	onClose,
	mode,
	courseId,
	courseVersionId,
	topic,
}: TopicFormDialogProps) {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<TopicInput>({
		resolver: zodResolver(topicSchema),
		defaultValues: {
			title: "",
			description: "",
		},
	});

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		if (mode === "edit" && topic) {
			reset({
				title: topic.title,
				description: topic.description ?? "",
			});
		} else {
			reset({ title: "", description: "" });
		}

		setError(null);
	}, [isOpen, mode, topic, reset]);

	const onSubmit = async (data: TopicInput) => {
		setIsSubmitting(true);
		setError(null);

		if (mode === "create" && !courseVersionId) {
			setError(
				"Esta edición del curso no tiene una versión activa para vincular tópicos."
			);
			setIsSubmitting(false);
			return;
		}

		try {
			let result;

			if (mode === "create") {
				result = await createTopic({
					courseId,
					courseVersionId: courseVersionId ?? undefined,
					title: data.title,
					description: data.description || null,
				});
			} else if (topic) {
				result = await updateTopic(topic.id, {
					title: data.title,
					description: data.description || null,
				});
			}

			if (result && "error" in result) {
				setError(result.error || "Error al guardar el tópico");
			} else {
				onClose();
				router.refresh();
			}
		} catch (err) {
			setError("Error inesperado al guardar el tópico");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open: boolean) => !open && !isSubmitting && onClose()}
		>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Crear nuevo tópico" : "Editar tópico"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Completa la información del nuevo tópico del curso."
							: "Modifica la información del tópico."}
					</DialogDescription>
					{!courseVersionId && (
						<p className="mt-2 text-xs text-red-600">
							Esta edición del curso necesita una versión activa antes de crear
							tópicos.
						</p>
					)}
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="title">
							Título del tópico <span className="text-red-500">*</span>
						</Label>
						<Input
							id="title"
							placeholder="Ej: Fundamentos de Python"
							{...register("title")}
							error={errors.title?.message}
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							placeholder="Describe brevemente el contenido del tópico..."
							{...register("description")}
							error={errors.description?.message}
							disabled={isSubmitting}
							rows={3}
						/>
					</div>

					{error && (
						<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
							{error}
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting || (mode === "create" && !courseVersionId)}
							className="bg-purple-600 hover:bg-purple-700"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Guardando...
								</>
							) : mode === "create" ? (
								"Crear tópico"
							) : (
								"Guardar cambios"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}