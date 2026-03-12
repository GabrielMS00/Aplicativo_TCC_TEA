import { apiClient } from './apiClient';

export interface RelatorioGeral {
    dadosPessoais: {
        nome: string;
        dataNascimento: string;
        nivelSuporte: string | null;
        grauSeletividade: string | null;
    };
    questionarios: {
        questionario: string;
        texto_pergunta: string;
        texto_opcao: string;
    }[];
    historicoTrocas: {
        data: string;
        refeicao: string;
        itens: {
            alimento: string;
            status: string;
            motivo: string | null;
        }[];
    }[];
}

export const getRelatorioGeralApi = async (assistidoId: string): Promise<RelatorioGeral | null> => {
    return apiClient<RelatorioGeral>(`/relatorios/${assistidoId}/geral`);
};