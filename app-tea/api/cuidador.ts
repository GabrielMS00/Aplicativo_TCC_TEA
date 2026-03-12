import { apiClient } from './apiClient';

export interface CuidadorInfo { // Adapte conforme o retorno real da API
    id: string;
    nome: string;
    email: string;
    cpf?: string; // Adicionar se a API retornar
    data_nascimento?: string; // Adicionar se a API retornar
}

export interface UpdatePerfilData {
    nome: string;
    email: string;
    cpf: string;
    data_nascimento: string;
}

interface UpdatePerfilResponse {
    message: string;
    cuidador: CuidadorInfo;
}

// Funções da API
export const getPerfilApi = async (): Promise<CuidadorInfo | null> => {
    return apiClient<CuidadorInfo>('/cuidador/perfil');
};

export const updatePerfilApi = async (data: UpdatePerfilData): Promise<UpdatePerfilResponse | null> => {
    return apiClient<UpdatePerfilResponse>('/cuidador/perfil', {
        method: 'PUT',
        body: data,
    });
};