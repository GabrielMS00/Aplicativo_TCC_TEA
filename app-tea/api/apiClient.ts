import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// !!! IMPORTANTE: Substituir pelo IP local da sua máquina onde o backend está rodando !!!
export const API_BASE_URL = 'http://192.168.1.23:3001/api'; 


interface RequestOptions extends RequestInit {
    needsAuth?: boolean;
    params?: Record<string, string | number | boolean | string[]>;
    body?: any; // Para simplificar, aceita qualquer tipo aqui
}

// Função helper para construir URL com query params
const buildUrlWithParams = (url: string, params?: Record<string, any>): string => {
    if (!params || Object.keys(params).length === 0) return url;
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, String(v)));
        } else if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    });
    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
};


export const apiClient = async <T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T | null> => {
    const { needsAuth = true, params, body, headers = {}, method = 'GET', ...restOptions } = options;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (needsAuth) {
        const token = await AsyncStorage.getItem('@AppTEA:token');
        if (!token) {
            console.error('Erro: Token não encontrado para rota autenticada:', endpoint);
            Alert.alert('Erro de Autenticação', 'Sessão inválida. Faça login novamente.');
            // Idealmente, redirecionar para login aqui.
            // Ex: import { router } from 'expo-router'; router.replace('/');
            return null;
        }
        (defaultHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = buildUrlWithParams(`${API_BASE_URL}${endpoint}`, params);
    const fetchOptions: RequestInit = {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
        ...restOptions,
    };

    // console.log(`API Request: ${method} ${url}`, fetchOptions); // Log para debug
console.log(`--- Tentando chamar API ---`);
console.log(`URL: ${url}`);
console.log(`Método: ${method}`);
console.log(`Headers: ${JSON.stringify(defaultHeaders)}`);
if (body) {
    console.log(`Body: ${JSON.stringify(body)}`);
}
    try {
        const response = await fetch(url, fetchOptions);
        const responseBody = await response.text(); // Lê como texto primeiro

        let data: any = {};
        try {
            data = responseBody ? JSON.parse(responseBody) : {}; // Tenta parsear JSON
        } catch (jsonError) {
            // Se não for JSON válido e a resposta não foi OK, trata como erro
            if (!response.ok) {
                 console.error(`Erro na API (${response.status}) - Resposta não-JSON: ${endpoint}`, responseBody);
                 Alert.alert(
                    `Erro ${response.status}`,
                    `Ocorreu um erro no servidor (resposta inválida). Endpoint: ${endpoint}`
                 );
                 return null;
            }
             // Se foi OK mas não JSON, pode ser uma resposta vazia (ex: DELETE 200 OK)
             console.warn(`Resposta OK mas não-JSON recebida de ${endpoint}:`, responseBody);
             // Retorna um objeto vazio ou um objeto indicando sucesso se for status 200/201/204
             if ([200, 201, 204].includes(response.status)) return { success: true } as T;
             // Caso contrário, trata como erro inesperado
              Alert.alert('Erro Inesperado', `Resposta inesperada do servidor para ${endpoint}.`);
             return null;
        }


        if (!response.ok) {
            console.error(`Erro na API (${response.status}): ${endpoint}`, data);
            Alert.alert(
                `Erro ${response.status}`,
                data?.error || data?.message || `Ocorreu um erro na requisição para ${endpoint}`
            );
            return null;
        }

        return data as T;

    } catch (error: any) {
        console.error(`Erro de Rede/Conexão: ${method} ${endpoint}`, error);
        Alert.alert(
            'Erro de Rede',
            `Não foi possível conectar ao servidor (${API_BASE_URL}). Verifique sua conexão e o endereço IP da API no código.`
        );
        return null;
    }
};