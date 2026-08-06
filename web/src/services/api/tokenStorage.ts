const TOKEN_KEY = "@binotto:token";

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
