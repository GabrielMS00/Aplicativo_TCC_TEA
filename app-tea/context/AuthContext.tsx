// app-tea/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi } from '../api/auth'; // Verifique se esta é a versão que usa apiClient
import { router, useSegments } from 'expo-router';
import { Alert, ActivityIndicator, View } from 'react-native';

// Interfaces (mantidas)
interface User { id: string; nome: string; email: string; }
interface AuthContextData {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    signIn: (credentials: { email: string; senha: string }) => Promise<boolean>; // Mudar para retornar boolean (sucesso/falha)
    signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Loading apenas para signIn/signOut
    const [isStorageLoading, setIsStorageLoading] = useState(true);

    const segments = useSegments();

    // Carrega dados do AsyncStorage (mantido)
    useEffect(() => {
        const loadStorageData = async () => {
            console.log('[AUTH EFFECT INIT] Loading storage...');
            try { /* ... lógica mantida ... */
                const storedToken = await AsyncStorage.getItem('@AppTEA:token');
                const storedUser = await AsyncStorage.getItem('@AppTEA:user');
                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                    console.log('[AUTH EFFECT INIT] Found token in storage.');
                } else {
                    setToken(null); setUser(null);
                    console.log('[AUTH EFFECT INIT] No token found in storage.');
                }
            } catch (e) { /* ... tratamento de erro mantido ... */
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

    // Hook de Efeito para Redirecionamento (mantido)
    useEffect(() => {
        if (isStorageLoading) { console.log('[AUTH EFFECT NAV] Waiting storage...'); return; }
        const inAuthGroup = segments[0] === '(auth)';
        console.log('[AUTH EFFECT NAV] State Check:', { hasToken: !!token, inAuthGroup, currentSegments: segments });
        if (token && inAuthGroup) {
            console.log('[AUTH EFFECT NAV] Redirecting: Logged in, in auth -> Home');
            router.replace('/(tabs)/Home');
        } else if (!token && !inAuthGroup) {
            console.log('[AUTH EFFECT NAV] Redirecting: Not logged in, NOT in auth -> Login');
            router.replace('/');
        } else { console.log('[AUTH EFFECT NAV] No redirect needed.'); }
    }, [token, segments, isStorageLoading, router]);


    // Função signIn - Retorna boolean (sucesso/falha)
    const signIn = async ({ email, senha }: { email: string; senha: string }): Promise<boolean> => {
        // Previne chamadas simultâneas (embora o loading no botão deva fazer isso)
        if (isLoading) {
             console.log('[SIGNIN] Already in progress, ignoring call.');
             return false;
        }
        setIsLoading(true);
        console.log(`[SIGNIN] Attempting login for: ${email}`);
        const response = await loginApi({ email, senha }); // loginApi usa apiClient

        if (response && response.token && response.cuidador) {
            console.log('[SIGNIN] API Success. Updating storage and state...');
            const userData = response.cuidador;
            const userToken = response.token;
            try {
                await AsyncStorage.setItem('@AppTEA:token', userToken);
                await AsyncStorage.setItem('@AppTEA:user', JSON.stringify(userData));
                console.log('[SIGNIN] AsyncStorage updated.');
                // Atualiza o estado APÓS salvar no storage
                setUser(userData);
                setToken(userToken);
                setIsLoading(false);
                console.log('[SIGNIN] State updated. Auth effect will handle redirect.');
                return true; // Indica sucesso
            } catch (e) {
                console.error("[SIGNIN] Error saving to AsyncStorage", e);
                Alert.alert("Erro", "Não foi possível salvar os dados de login.");
                setUser(null); setToken(null); // Limpa estado se storage falhar
                setIsLoading(false);
                return false; // Indica falha
            }
        } else {
             console.log('[SIGNIN] API Failed or invalid response.');
             // Erro já foi mostrado pelo apiClient/loginApi
             setIsLoading(false);
             return false; // Indica falha
        }
    };

    // Função signOut (mantida)
    const signOut = async () => { /* ... código mantido ... */
        if (isLoading) return; // Previne chamadas simultâneas
        setIsLoading(true);
        try {
            await AsyncStorage.multiRemove(['@AppTEA:token', '@AppTEA:user']);
            setUser(null); setToken(null);
            console.log('[SIGNOUT] State and storage cleared. Redirecting to Login...');
            router.replace('/');
        } catch (e) { console.error("[SIGNOUT] Error clearing storage", e); Alert.alert("Erro", "Não foi possível realizar o logout completo.");}
        finally { setIsLoading(false); }
     };

    // Loading inicial (mantido)
    if (isStorageLoading) { /* ... retorna ActivityIndicator ... */
         return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
                <ActivityIndicator size="large" color="#87CFCF" />
            </View>
        );
     }

    // Provider
    return (
        <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook useAuth (mantido)
export function useAuth(): AuthContextData { /* ... */
     const context = useContext(AuthContext);
    if (!context) { throw new Error('useAuth must be used within an AuthProvider'); }
    return context;
}