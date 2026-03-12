import { apiClient } from './apiClient';

// Tipos para os dados do Assistido
export interface Assistido {
    id: string;
    nome: string;
    data_nascimento: string;
    nivel_suporte: string | null;
    grau_seletividade: string | null;
    cuidador_id: string;
}

export interface CreateAssistidoData {
    nome: string;
    data_nascimento: string;
    nivel_suporte?: string | null;
    grau_seletividade?: string | null;
}

// Tipo para a atualização completa (usado pelo usuário 'padrao' no perfil)
export interface UpdateAssistidoData {
    nome: string;
    data_nascimento: string;
    nivel_suporte: string | null;
    grau_seletividade: string | null;
}

// Tipo para atualizar apenas detalhes (usado pela API)
export interface UpdateAssistidoDetalhesData {
    nivel_suporte: string | null;
    grau_seletividade: string | null;
}

// Interface de resposta padrão para Create/Update
interface AssistidoResponse {
    message: string;
    assistido: Assistido;
}

// Funções da API

export const getAssistidosApi = async (): Promise<Assistido[] | null> => {
    return apiClient<Assistido[]>('/assistidos'); 
};

export const getAssistidoByIdApi = async (id: string): Promise<Assistido | null> => {
    return apiClient<Assistido>(`/assistidos/${id}`);
};

export const createAssistidoApi = async (data: CreateAssistidoData): Promise<AssistidoResponse | null> => {
    return apiClient<AssistidoResponse>('/assistidos', {
        method: 'POST',
        body: data,
    });
};

export const updateAssistidoApi = async (id: string, data: UpdateAssistidoData): Promise<AssistidoResponse | null> => {
    return apiClient<AssistidoResponse>(`/assistidos/${id}`, {
        method: 'PUT',
        body: data,
    });
};

export const updateAssistidoDetalhesApi = async (id: string, data: UpdateAssistidoDetalhesData): Promise<AssistidoResponse | null> => {
    return apiClient<AssistidoResponse>(`/assistidos/${id}/detalhes`, {
        method: 'PUT',
        body: data,
    });
};


export const deleteAssistidoApi = async (id: string): Promise<{ message: string } | null> => {
    return apiClient<{ message: string }>(`/assistidos/${id}`, {
        method: 'DELETE',
    });
};