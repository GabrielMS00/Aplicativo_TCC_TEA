// app-tea/api/auth.ts
import { Alert } from 'react-native';
// Importa a função apiClient centralizada do ficheiro apiClient.ts
import { apiClient } from './apiClient'; 

// --- Interfaces (Tipos de Dados) ---

// Define a estrutura esperada para as credenciais de login
interface LoginCredentials {
    email: string;
    senha: string;
}

// Define a estrutura esperada para os dados de registo
interface RegisterData {
    nome: string;
    cpf: string;
    email: string;
    senha: string;
    data_nascimento: string; // Esperado no formato YYYY-MM-DD pelo backend
}

// Define a estrutura das informações do cuidador retornadas pela API
interface CuidadorInfo {
    id: string;
    nome: string;
    email: string;
    // Adicione cpf e data_nascimento aqui se a API os retornar no login/registo
}

// Define a estrutura da resposta esperada das APIs de autenticação
interface AuthResponse {
    message: string;        // Mensagem informativa (sucesso/erro)
    cuidador?: CuidadorInfo; // Dados do cuidador (em caso de sucesso)
    token?: string;          // Token JWT (em caso de sucesso)
    error?: string;          // Mensagem de erro específica (em caso de falha controlada)
}

// --- Funções da API ---

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse | null> => {
    // Utiliza o apiClient para fazer a requisição POST para /auth/login
    // O apiClient trata a montagem da URL, headers, body, erros de rede e status HTTP
    return apiClient<AuthResponse>('/auth/login', { // Especifica o tipo de resposta esperado
        method: 'POST',           // Método HTTP
        body: credentials,       // Dados a enviar no corpo da requisição
        needsAuth: false,        // Indica que esta rota não precisa de token de autenticação prévio
    });
};

export const registerApi = async (userData: RegisterData): Promise<AuthResponse | null> => {
    // Utiliza o apiClient para fazer a requisição POST para /auth/register
    return apiClient<AuthResponse>('/auth/register', { // Especifica o tipo de resposta esperado
        method: 'POST',           // Método HTTP
        body: userData,          // Dados a enviar no corpo da requisição
        needsAuth: false,        // Indica que esta rota não precisa de token de autenticação prévio
    });
};

// Exporta os tipos para que possam ser usados noutros ficheiros (como AuthContext e CreateAccount)
export type { LoginCredentials, RegisterData, AuthResponse, CuidadorInfo };