import { User } from '@/types/auth';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const SecureStorageService = {
    async setToken(token: string) {
        if (!token) return;
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    },

    async getToken() {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    },

    async setUser(user: User) {
        if (!user) return;
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    },

    async getUser() {
        const user = await SecureStore.getItemAsync(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    async clear() {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    }
};

export default SecureStorageService;