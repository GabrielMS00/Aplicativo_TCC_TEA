import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, AuthResponse, CuidadorInfo } from '../api/auth';
import { router, useSegments } from 'expo-router';
import { Alert, ActivityIndicator, View } from 'react-native';

interface User extends CuidadorInfo {
    assistidoIdPadrao?: string | null;
}

interface AuthContextData {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    signIn: (credentials: { email: string; senha: string }) => Promise<boolean>;
    signOut: () => void;
    // Função chamada pelo CreateAccount
    handleRegistration: (response: AuthResponse) => Promise<void>;
    // Função chamada pelo QuestionnaireFlow no final
    completeQuestionnaireFlow: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStorageLoading, setIsStorageLoading] = useState(true);

    // Flag para travar o redirect durante o cadastro do 'padrao'
    const [isPendingQuestionnaire, setIsPendingQuestionnaire] = useState(false);

    const segments = useSegments();

    // Carrega dados do AsyncStorage
    useEffect(() => {
        const loadStorageData = async () => {
            console.log('[AUTH EFFECT INIT] Loading storage...');
            setIsStorageLoading(true);
            try {
                const storedToken = await AsyncStorage.getItem('@AppTEA:token');
                const storedUser = await AsyncStorage.getItem('@AppTEA:user');
                if (storedToken && storedUser) {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
                    console.log('[AUTH EFFECT INIT] Found token and user in storage.');
                } else {
                    setToken(null); setUser(null);
                    console.log('[AUTH EFFECT INIT] No token found in storage.');
                }
            } catch (e) {
                console.error("[AUTH EFFECT INIT] Error loading storage", e);
                await AsyncStorage.multiRemove(['@AppTEA:token', '@AppTEA:user']);
                setToken(null); setUser(null);
            } finally {
                setIsStorageLoading(false);
                console.log('[AUTH EFFECT INIT] Storage loading finished.');
            }
        };
        loadStorageData();
    }, []);

    // Hook de Efeito para Redirecionamento 
    useEffect(() => {
        if (isStorageLoading || isPendingQuestionnaire) {
            console.log(`[AUTH EFFECT NAV] Waiting... Storage: ${isStorageLoading}, PendingQ: ${isPendingQuestionnaire}`);
            return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        console.log('[AUTH EFFECT NAV] State Check:', { hasToken: !!token, inAuthGroup, userType: user?.tipo_usuario });

        if (token && inAuthGroup) {
            console.log('[AUTH EFFECT NAV] Redirecting: Logged in, in auth -> Home');
            router.replace('/(tabs)/Home'); // A Home.tsx vai lidar com o 'padrao'
        }

        else if (!token && !inAuthGroup) {
            console.log('[AUTH EFFECT NAV] Redirecting: Not logged in, NOT in auth -> Login');
            router.replace('/');
        } else {
            console.log('[AUTH EFFECT NAV] No redirect needed.');
        }
    }, [token, user, segments, isStorageLoading, isPendingQuestionnaire, router]); // 'user' é necessário


    // Função helper para salvar estado e storage
    const saveAuthState = async (userToken: string, userData: User) => {
        try {
            await AsyncStorage.setItem('@AppTEA:token', userToken);
            await AsyncStorage.setItem('@AppTEA:user', JSON.stringify(userData));
            console.log('[AUTH] AsyncStorage updated.');
            setUser(userData);
            setToken(userToken);
        } catch (e) {
            console.error("[AUTH] Error saving to AsyncStorage", e);
            Alert.alert("Erro", "Não foi possível salvar os dados de login.");
            setUser(null); setToken(null);
            throw e;
        }
    };

    // Função signIn
    const signIn = async ({ email, senha }: { email: string; senha: string }): Promise<boolean> => {
        if (isLoading) return false;
        setIsLoading(true);
        console.log(`[SIGNIN] Attempting login for: ${email}`);
        const response = await loginApi({ email, senha });

        if (response && response.token && response.cuidador) {
            console.log('[SIGNIN] API Success. Updating storage and state...');
            const userData: User = {
                ...response.cuidador,
                assistidoIdPadrao: response.assistidoIdPadrao || null,
            };

            try {
                // Limpa o flag de pendência (caso exista de um cadastro anterior falho)
                setIsPendingQuestionnaire(false);
                await saveAuthState(response.token, userData);
                console.log('[SIGNIN] State updated. Auth effect will handle redirect.');
                setIsLoading(false);
                return true;
            } catch (e) {
                setIsLoading(false);
                return false;
            }
        } else {
            console.log('[SIGNIN] API Failed or invalid response.');
            setIsLoading(false);
            return false;
        }
    };

    // Função handleRegistration (Define o token e o flag de pendência)
    const handleRegistration = async (response: AuthResponse) => {
        if (response.token && response.cuidador) {
            console.log('[REGISTER_HANDLER] Processing registration...');
            const userData: User = {
                ...response.cuidador,
                assistidoIdPadrao: response.assistidoIdPadrao || null,
            };

            if (userData.tipo_usuario === 'padrao') {
                console.log('[REGISTER_HANDLER] Setting PENDING_QUESTIONNAIRE flag.');
                setIsPendingQuestionnaire(true); // Trava o redirecionamento automático
            }

            await saveAuthState(response.token, userData);
        } else {
            throw new Error("Resposta de registro inválida.");
        }
    };

    // Função chamada pelo QuestionnaireFlow para liberar o redirecionamento
    const completeQuestionnaireFlow = () => {
        console.log('[AUTH] Clearing PENDING_QUESTIONNAIRE flag.');
        setIsPendingQuestionnaire(false);
    };


    // Função signOut
    const signOut = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await AsyncStorage.multiRemove(['@AppTEA:token', '@AppTEA:user']);
            setUser(null); setToken(null);
            setIsPendingQuestionnaire(false);
            console.log('[SIGNOUT] State and storage cleared. Redirecting to Login...');
            router.replace('/');
        } catch (e) { console.error("[SIGNOUT] Error clearing storage", e); Alert.alert("Erro", "Não foi possível realizar o logout completo."); }
        finally { setIsLoading(false); }
    };


    if (isStorageLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
                <ActivityIndicator size="large" color="#87CFCF" />
            </View>
        );
    }

    // Provider
    return (
        <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, handleRegistration, completeQuestionnaireFlow }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook useAuth
export function useAuth(): AuthContextData {
    const context = useContext(AuthContext);
    if (!context) { throw new Error('useAuth must be used within an AuthProvider'); }
    return context;
}