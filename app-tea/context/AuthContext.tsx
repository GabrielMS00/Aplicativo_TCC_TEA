import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi } from '../api/auth';
import { router, useSegments } from 'expo-router';
import { Alert, ActivityIndicator, View } from 'react-native'; 
interface User {
    id: string;
    nome: string;
    email: string;
}

interface AuthContextData {
    user: User | null;
    token: string | null;
    isLoading: boolean; // Para loading de chamadas API (login/register)
    signIn: (credentials: { email: string; senha: string }) => Promise<void>;
    signOut: () => void;
}

// Criando o contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Criando o Provedor
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Loading das chamadas API
    const [isStorageLoading, setIsStorageLoading] = useState(true); // Loading inicial do AsyncStorage

    const segments = useSegments();

    // Carrega token/usuário do AsyncStorage ao iniciar
    useEffect(() => {
        const loadStorageData = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('@AppTEA:token');
                const storedUser = await AsyncStorage.getItem('@AppTEA:user');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Erro ao carregar dados do AsyncStorage", e);
                // Considerar limpar o storage em caso de erro de parsing?
            } finally {
                setIsStorageLoading(false); // Finaliza o loading inicial
            }
        };
        loadStorageData();
    }, []);

    // Redirecionamento baseado no estado de login e rota
    useEffect(() => {
        // Só executa DEPOIS de carregar do AsyncStorage
        if (isStorageLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (token && inAuthGroup) {
            // Logado e na tela de auth -> vai pra home
             router.replace('/(tabs)/Home'); 
        } else if (!token && !inAuthGroup) {
             // Não logado e FORA da tela de auth -> vai pro login
            router.replace('/');
        }
    }, [token, segments, isStorageLoading]);


    const signIn = async ({ email, senha }: { email: string; senha: string }) => {
        setIsLoading(true); // Inicia loading da API
        const response = await loginApi({ email, senha });
        setIsLoading(false); // Finaliza loading da API

        if (response && response.token && response.cuidador) {
            const userData = response.cuidador;
            const userToken = response.token;

            // Atualiza o estado
            setUser(userData);
            setToken(userToken);

            // Salva no AsyncStorage
            try {
                await AsyncStorage.setItem('@AppTEA:token', userToken);
                await AsyncStorage.setItem('@AppTEA:user', JSON.stringify(userData));
                // O useEffect de redirecionamento cuidará de levar para a home
            } catch (e) {
                console.error("Erro ao salvar dados no AsyncStorage", e);
                Alert.alert("Erro", "Não foi possível salvar os dados de login.");
            }
        }
        // Erro já tratado no loginApi com Alert
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await AsyncStorage.removeItem('@AppTEA:token');
            await AsyncStorage.removeItem('@AppTEA:user');
            // Limpa o estado
            setUser(null);
            setToken(null);
            // O useEffect de redirecionamento cuidará de levar para o login
        } catch (e) {
            console.error("Erro ao limpar AsyncStorage no signOut", e);
            Alert.alert("Erro", "Não foi possível realizar o logout completo.");
        } finally {
            setIsLoading(false);
        }
    };

    // Enquanto carrega do AsyncStorage, mostra um loading genérico
    if (isStorageLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#87CFCF" />
            </View>
        );
    }

    // Passa os valores para o contexto
    return (
        <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado para usar o contexto
export function useAuth(): AuthContextData {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}