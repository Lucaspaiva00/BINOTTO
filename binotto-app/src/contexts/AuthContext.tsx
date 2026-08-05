import { Dispatch, SetStateAction, useContext, useEffect, createContext, useState } from "react";
import AuthService from "../services/AuthService";
import SecureStorageService from "../services/SecureStorageService";
import { setUnauthorizedHandler } from "@/services/Api";
import { AuthResponse, User } from "@/types/auth";
import { Platform } from "react-native";
import { getPushToken } from "@/services/NotificationService";
import { SocialLoginRequest, SocialLoginResponse } from "@/types/social";

type TAuthContextData = {
	authData?: User | null;
	setAuthData?: Dispatch<SetStateAction<any | null>>;
	signIn: (login: string, senha: string, idioma: string) => Promise<AuthResponse>;
	signInSocial: (payload: SocialLoginRequest) => Promise<SocialLoginResponse>;
	authenticatedWithoutSignIn: (data: any) => void;
	signOut: () => Promise<void>;
	authToken: string | null;
	loading: boolean;
};

type TProps = {
	children: React.ReactNode;
};

export const AuthContext = createContext<TAuthContextData>({} as TAuthContextData);

export const AuthProvider: React.FC<TProps> = ({ children }) => {
	const [authData, setAuthData] = useState<User | null>(null);
	const [authToken, setAuthToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function loadStorageData() {
		try {
			setLoading(true);

			const token = await SecureStorageService.getToken();
			const user = await SecureStorageService.getUser();

			if (token && user) {
				setAuthToken(token);
				setAuthData(user);
			} else {
				await SecureStorageService.clear();
			}
		} catch (error) {
			
		} finally {
			setLoading(false);
		}
	}

	async function signIn(login: string, senha: string, idioma: string) : Promise<AuthResponse>{
		try {
			const pushToken = await getPushToken();

			const data = await AuthService.signIn(login, senha, idioma, pushToken, Platform.OS);

			if (data.status === "PRE_REGISTRATION") {
				return data;
			}

			if (data.status === "AUTHENTICATED") {
				await SecureStorageService.setToken(data.access_token);
				await SecureStorageService.setUser(data.user);

				setAuthToken(data.access_token);
				setAuthData(data.user);
			}

			return data;
		} catch (error) {
			throw error;
		}
	}

	async function signInSocial(payload: SocialLoginRequest) : Promise<SocialLoginResponse>{
		try {
			const data = await AuthService.signInSocial(payload);

			if (data.status === "PRE_REGISTRATION_SOCIAL") {
				return data;
			}

			if (data.status === "AUTHENTICATED") {
				await SecureStorageService.setToken(data.access_token);
				await SecureStorageService.setUser(data.user);

				setAuthToken(data.access_token);
				setAuthData(data.user);
			}

			return data;
		} catch (error) {
			throw error;
		}
	}

	async function authenticatedWithoutSignIn(data: any){
		try {
			await SecureStorageService.setToken(data.access_token);
			await SecureStorageService.setUser(data.user);
			setAuthToken(data.access_token);
			setAuthData(data.user);
		} catch (error) {
			throw error;
		}
	}

	async function signOut() {
		try {
			setLoading(true);

			await AuthService.logout();
		} catch (error) {
		} finally {
			await clearSession();
			setLoading(false);
		}
	}

	async function forceSignOut() {
		await clearSession();
	}

	async function clearSession() {
		await SecureStorageService.clear();

		setAuthData(null);
		setAuthToken(null);
	}

	useEffect(() => {
		loadStorageData();
	}, []);

	useEffect(() => {
		setUnauthorizedHandler(forceSignOut);
	}, []);

	return (
		<AuthContext.Provider
			value={{
				authData,
				signIn,
				signInSocial,
				authenticatedWithoutSignIn,
				signOut,
				authToken,
				setAuthData,
				loading,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export function useAuth() {
	return useContext(AuthContext);
}
