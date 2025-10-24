import { Alert } from 'react-native';

// !!! IMPORTANTE: Substitua pelo IP local da sua máquina onde o backend está rodando !!!

const API_BASE_URL = 'http://192.168.1.11/api';

interface LoginCredentials {
    email: string;
    senha: string;
}

interface RegisterData {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
    data_nascimento: string; // Formato YYYY-MM-DD
}

interface AuthResponse {
    message: string;
    cuidador?: {
        id: string;
        nome: string;
        email: string;
    };
    token?: string;
    error?: string;
}

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        const data: AuthResponse = await response.json();

        if (!response.ok) {
            Alert.alert('Erro de Login', data.error || `Erro ${response.status}`);
            return null;
        }

        return data; // Retorna { message, cuidador, token }

    } catch (error) {
        console.error('Erro na chamada de login:', error);
        Alert.alert('Erro de Rede', 'Não foi possível conectar ao servidor. Verifique sua conexão e o IP da API.');
        return null;
    }
};


export const registerApi = async (userData: RegisterData): Promise<AuthResponse | null> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const data: AuthResponse = await response.json();

        if (!response.ok) {
            Alert.alert('Erro no Cadastro', data.error || `Erro ${response.status}`);
            return null;
        }
        // O backend atual retorna o token no registro
        return data;

    } catch (error) {
        console.error('Erro na chamada de registro:', error);
        Alert.alert('Erro de Rede', 'Não foi possível conectar ao servidor. Verifique sua conexão e o IP da API.');
        return null;
    }
};