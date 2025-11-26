import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginApi, AuthResponse, CuidadorInfo } from '../api/auth';
import { router, useSegments } from 'expo-router';
import { Alert, ActivityIndicator, View } from 'react-native';

// Interface estendida do usuário para incluir estado dos questionários e assistido padrão
interface User extends CuidadorInfo {
    assistidoIdPadrao?: string | null;
    questionariosConcluidos?: boolean;
}

interface AuthContextData {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    signIn: (credentials: { email: string; senha: string }) => Promise<boolean>;
    signOut: () => void;
    handleRegistration: (response: AuthResponse) => Promise<void>;
    completeQuestionnaireFlow: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStorageLoading, setIsStorageLoading] = useState(true);

    const segments = useSegments();

    // Carrega dados do AsyncStorage ao iniciar o app
    useEffect(() => {
        const loadStorageData = async () => {
            setIsStorageLoading(true);
            try {
                const storedToken = await AsyncStorage.getItem('@AppTEA:token');
                const storedUser = await AsyncStorage.getItem('@AppTEA:user');
                if (storedToken && storedUser) {
                    setUser(JSON.parse(storedUser));
                    setToken(storedToken);
                } else {
                    setToken(null); setUser(null);
                }
            } catch (e) {
                console.error("Erro ao carregar storage:", e);
                setToken(null); setUser(null);
            } finally {
                setIsStorageLoading(false);
            }
        };
        loadStorageData();
    }, []);

    // Lógica Central de Navegação e Proteção de Rotas
    useEffect(() => {
        if (isStorageLoading) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inQuestionnaire = segments[0] === 'QuestionnaireFlow';

        if (token && user) {
            // REGRA: Usuário Padrão (TEA) deve completar os questionários obrigatoriamente
            if (user.tipo_usuario === 'padrao' && user.questionariosConcluidos === false) {

                // Se ele ainda não está na tela de questionários, redireciona forçadamente
                if (!inQuestionnaire) {
                    console.log('[AUTH] Usuário Padrão Pendente: Redirecionando para Questionários');

                    router.replace({
                        pathname: '/QuestionnaireFlow/Screen',
                        params: {
                            // Passa o ID se disponível para garantir que o fluxo saiba quem é
                            assistidoId: user.assistidoIdPadrao ?? undefined
                        }
                    });
                }
            }
            // Caso contrário (Cuidador OU Padrão que já terminou), se tentar acessar login, vai pra Home
            else if (inAuthGroup) {
                console.log('[AUTH] Usuário autenticado: Redirecionando para Home');
                router.replace('/(tabs)/Home');
            }
        } else if (!token && !inAuthGroup) {
            // Se não tem token e tenta acessar rota protegida (não-auth), joga pro Login
            router.replace('/');
        }
    }, [token, user, segments, isStorageLoading]);


    // Função auxiliar para salvar sessão
    const saveAuthState = async (userToken: string, userData: User) => {
        try {
            await AsyncStorage.setItem('@AppTEA:token', userToken);
            await AsyncStorage.setItem('@AppTEA:user', JSON.stringify(userData));
            setUser(userData);
            setToken(userToken);
        } catch (e) {
            console.error("Erro ao salvar auth no storage:", e);
        }
    };

    // Login
    const signIn = async ({ email, senha }: { email: string; senha: string }): Promise<boolean> => {
        setIsLoading(true);
        const response = await loginApi({ email, senha });

        if (response && response.token && response.cuidador) {
            const userData: User = {
                ...response.cuidador,
                assistidoIdPadrao: response.assistidoIdPadrao || null,
                // Se a API não retornar o campo (backend antigo), assume true para não travar cuidadores
                questionariosConcluidos: response.questionariosConcluidos ?? true
            };
            await saveAuthState(response.token, userData);
            setIsLoading(false);
            return true;
        } else {
            setIsLoading(false);
            return false;
        }
    };

    // Chamado após o Registro (CreateAccount)
    const handleRegistration = async (response: AuthResponse) => {
        if (response.token && response.cuidador) {

            let statusQuestionarios = response.questionariosConcluidos;

            if (response.cuidador.tipo_usuario === 'padrao') {
                statusQuestionarios = false;
            } else if (statusQuestionarios === undefined) {
                statusQuestionarios = true;
            }

            const userData: User = {
                ...response.cuidador,
                assistidoIdPadrao: response.assistidoIdPadrao || null,
                questionariosConcluidos: statusQuestionarios
            };

            console.log('[AUTH] Registrando usuário:', userData.tipo_usuario, 'Questionários:', statusQuestionarios);

            await saveAuthState(response.token, userData);
        }
    };

    // Chamado pelo QuestionnaireFlow ao finalizar todas as respostas
    const completeQuestionnaireFlow = async () => {
        if (user) {
            console.log('[AUTH] Fluxo de questionários concluído. Atualizando perfil.');
            const updatedUser = { ...user, questionariosConcluidos: true };

            // Atualiza estado e persistência
            setUser(updatedUser);
            await AsyncStorage.setItem('@AppTEA:user', JSON.stringify(updatedUser));
        }
    };

    // Logout
    const signOut = async () => {
        setIsLoading(true);
        try {
            await AsyncStorage.multiRemove(['@AppTEA:token', '@AppTEA:user']);
            setUser(null);
            setToken(null);
        } catch (e) {
            console.error("Erro ao fazer logout:", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isStorageLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
                <ActivityIndicator size="large" color="#87CFCF" />
            </View>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, handleRegistration, completeQuestionnaireFlow }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth(): AuthContextData {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}