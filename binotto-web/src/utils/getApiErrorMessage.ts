import axios from "axios";
import type { ApiErrorResponse } from "@/types/api";

const DEFAULT_ERROR_MESSAGE = "Não foi possível completar a solicitação. Tente novamente.";

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    const firstFieldError = data?.errors && Object.values(data.errors)[0]?.[0];

    if (firstFieldError) return firstFieldError;
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK") {
      return "Não foi possível conectar ao servidor. Verifique sua conexão.";
    }
  }

  if (error instanceof Error) return error.message;

  return DEFAULT_ERROR_MESSAGE;
}
