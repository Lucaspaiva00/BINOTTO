import axios, { type AxiosError } from "axios";
import { API_BASE_URL } from "./config";
import { tokenStorage } from "./tokenStorage";

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "pt-BR",
  },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const hadToken = !!tokenStorage.get();

      tokenStorage.remove();

      if (hadToken) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
    }

    return Promise.reject(error);
  },
);
