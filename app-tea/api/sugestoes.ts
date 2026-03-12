import { apiClient } from './apiClient';

// Tipos (mantidos da resposta anterior, ajuste se o backend retornar algo diferente)
interface SugestaoItem {
    grupo_alimentar: string;
    alimento: string;
    status: 'base_segura' | 'sugerido' | 'aceito' | 'recusado' | 'vazio';
    alimentoId: string | null;
    perfilId: string | null;
    motivo: string | null;
    score: number | null;
    detalheTrocaId: string;
}

export interface SugestaoRefeicaoResponse {
    refeicao: string;
    trocaAlimentarId: string;
    itens: SugestaoItem[];
}

export interface FeedbackItem {
    detalheTrocaId: string;
    status: 'aceito' | 'recusado';
    alimentoId?: string;
    perfilId?: string;
}

interface ProcessarFeedbackBody {
    feedback: FeedbackItem[];
}

// Funções da API
export const getSugestaoParaRefeicaoApi = async (
    assistidoId: string,
    nomeRefeicao: string,
    excluirPerfilIds?: string[]
): Promise<SugestaoRefeicaoResponse | null> => {
    const params: Record<string, any> = {};
    if (excluirPerfilIds && excluirPerfilIds.length > 0) {
        params.excluirPerfilIds = excluirPerfilIds.join(',');
    }
    return apiClient<SugestaoRefeicaoResponse>(`/sugestoes/${assistidoId}/${nomeRefeicao}`, { params });
};

export const processarFeedbackESugerirNovaApi = async (
    assistidoId: string,
    nomeRefeicao: string,
    feedback: FeedbackItem[]
): Promise<SugestaoRefeicaoResponse | null> => {
    const body: ProcessarFeedbackBody = { feedback };
    return apiClient<SugestaoRefeicaoResponse>(`/sugestoes/feedback/${assistidoId}/${nomeRefeicao}`, {
        method: 'POST',
        body: body,
    });
};

export type { SugestaoItem }; // Exporta o tipo do item