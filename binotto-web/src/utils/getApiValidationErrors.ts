import axios from "axios";
import type { ApiErrorResponse } from "@/types/api";

export function getApiValidationErrors(error: unknown): Record<string, string> | undefined {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return undefined;

  const errors = error.response?.data?.errors;
  if (!errors) return undefined;

  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? ""]));
}
