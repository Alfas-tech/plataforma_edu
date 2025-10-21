import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateSpanish(dateInput: string | number | Date): string {
  const parsedDate =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : new Date(dateInput);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const day = parsedDate.getUTCDate();
  const monthName = MONTH_NAMES_ES[parsedDate.getUTCMonth()];
  const year = parsedDate.getUTCFullYear();

  return `${day} de ${monthName} de ${year}`;
}
