import { apiClient } from './apiClient';

// Tipos para os dados do Assistido
export interface Assistido {
    id: string;
    nome: string;
    data_nascimento: string;
    nivel_suporte?: string | null;
    grau_seletividade?: string | null;
    cuidador_id: string;
}

export interface CreateAssistidoData {
    nome: string;
    data_nascimento: string;
    nivel_suporte?: string;
    grau_seletividade?: string;
}

interface CreateAssistidoResponse {
    message: string;
    assistido: Assistido;
}

// Funções da API
export const getAssistidosApi = async (): Promise<Assistido[] | null> => {
    return apiClient<Assistido[]>('/assistidos'); // GET por padrão
};

export const createAssistidoApi = async (data: CreateAssistidoData): Promise<CreateAssistidoResponse | null> => {
    return apiClient<CreateAssistidoResponse>('/assistidos', {
        method: 'POST',
        body: data,
    });
};

export const deleteAssistidoApi = async (id: string): Promise<{ message: string } | null> => {
    return apiClient<{ message: string }>(`/assistidos/${id}`, {
        method: 'DELETE',
    });
};

// Adicione updateAssistidoApi se precisar para a tela de edição