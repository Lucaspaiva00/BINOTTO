import axios from "axios";
import i18n from "../i18n";
import { GLOBAL } from "../constants/global";

const baseUrl = GLOBAL.baseURL;

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
});

// Interceptor para mandar linguagem do app
api.interceptors.request.use((config) => {
  config.headers.set("Accept-Language", i18n.language || "pt-BR");
  return config;
});

// Handler para logout em caso de 401
let onUnauthorized: (() => Promise<void>) | null = null;
let isSigningOut = false;

const setUnauthorizedHandler = (
    callback: () => Promise<void>
) => {
    onUnauthorized = callback;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {

    const status = error?.response?.status;
    const url = error?.config?.url || "";

    const isPublicRoute =
      url.includes("/auth/login") ||
      url.includes("/register/finalizar");

    const isLogoutRoute = url.includes("/logout");

    // Intercepta erro 401
    if (status === 401 && !isPublicRoute && !isLogoutRoute) {
      if (!isSigningOut) {
        isSigningOut = true;

        await onUnauthorized?.();

        isSigningOut = false;
      }
    }

    // Intercepta erro 422 (validações)
    if (status === 422) {
      const data = error?.response?.data;

      error.message =
        data?.message ||
        data?.error ||
        formatValidationErrors(data?.errors);
    }

    return Promise.reject(error);
  }
);

const formatValidationErrors = (errors: any): string | null => {
  if (!errors || typeof errors !== "object") return null;

  const messages = Object.values(errors).flat();

  if (!messages.length) return null;

  const firstMessage = messages[0];

  return typeof firstMessage === "string" ? firstMessage : null;
};

export { api, baseUrl, setUnauthorizedHandler };