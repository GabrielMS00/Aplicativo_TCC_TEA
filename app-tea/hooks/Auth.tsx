import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type AuthProviderProps = {
    children: ReactNode;
}

type AuthContextData = {
    user: User | null;
    isLoading: boolean;
    signInWithApple(): Promise<void>;
    logOut(): Promise<void>;
}

type User = {
    id: string;
    name: string;
    email: string;
    photo?: string;
}

const AuthContext = createContext({} as AuthContextData);

const AuthProvider = ({ children }: AuthProviderProps) => {

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadUserStorageData() {
            try {
                const userStorage = await AsyncStorage.getItem('@gofinances:user');
                if (userStorage) {
                    const userLogged = JSON.parse(userStorage) as User;
                    setUser(userLogged);
                }
            } catch (error) {
                console.log('Erro ao carregar usuário:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadUserStorageData();
    }, []);

    const signInWithApple = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL
                ]
            });

            if (credential) {
                const userLogged = {
                    id: String(credential.user),
                    email: credential.email!,
                    name: credential.fullName!.givenName!,
                    photo: undefined
                };

                setUser(userLogged);
                await AsyncStorage.setItem('@gofinances:user', JSON.stringify(userLogged));
            }

        } catch (error: any) {
            throw new Error(error)
        }
    }

    const logOut = async () => {
        await AsyncStorage.removeItem('@gofinances:user');
        setUser(null);
        router.replace('/');
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, signInWithApple, logOut }}>
            {children}
        </AuthContext.Provider>
    );
}

const useAuth = () => {
    const context = useContext(AuthContext);

    return context;
}

export { AuthProvider, useAuth }
