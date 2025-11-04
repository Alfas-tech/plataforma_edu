import type { CourseVersionStatus } from "@/src/core/types/course.types";

export interface CourseVersionOverview {
  id: string;
  versionNumber: number;
  title: string;
  description: string | null;
  status: CourseVersionStatus;
  startDate: string | null;
  endDate: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Compatibilidad histórica: etiqueta legible usada en la UI previa.
   */
  label?: string;
  /**
   * Compatibilidad histórica: resumen corto de la versión.
   */
  summary?: string | null;
  /**
   * Compatibilidad histórica: identificador de rama (ya no se usa).
   */
  branchId?: string | null;
  /**
   * Compatibilidad histórica: nombre de la rama asociada (ya no se usa).
   */
  branchName?: string | null;
  /**
   * Compatibilidad histórica: indicador de publicación en la capa anterior.
   */
  isPublished?: boolean;
}

export interface CourseOverview {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  activeVersion: CourseVersionOverview | null;
  draftVersion: CourseVersionOverview | null;
  archivedVersions: CourseVersionOverview[];
  hasActiveVersion: boolean;
  hasDraft: boolean;
  canEditCourse?: boolean;
  /**
   * Compatibilidad histórica: título usado por componentes existentes.
   */
  title?: string;
  /**
   * Compatibilidad histórica: resumen breve mostrado en tarjetas.
   */
  summary?: string | null;
  /**
   * Compatibilidad histórica: indicador de visibilidad forzada.
   */
  visibilityOverride?: boolean;
  /**
   * Compatibilidad histórica: origen de la visibilidad.
   */
  visibilitySource?: "version" | "override" | "hidden";
  /**
   * Compatibilidad histórica: indica visibilidad para estudiantes.
   */
  isVisibleForStudents?: boolean;
  /**
   * Compatibilidad histórica: marca de tiempo de última actualización usada en UI.
   */
  lastUpdatedAt?: string;
  /**
   * Compatibilidad histórica: rama principal (ya no se usa).
   */
  defaultBranch?: unknown;
  /**
   * Compatibilidad histórica: ramas auxiliares (ya no se usan).
   */
  branches?: unknown[];
  /**
   * Compatibilidad histórica: solicitudes de fusión (ya no se usan).
   */
  pendingMergeRequests?: unknown[];
}
