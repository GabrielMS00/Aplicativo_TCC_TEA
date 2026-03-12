import { apiClient } from './apiClient';

// --- Interfaces (Tipos de Dados) ---

// Opção de resposta para uma pergunta
export interface OpcaoResposta {
    id: string; // modelo_opcao_resposta_id
    texto_opcao: string;
    modelo_pergunta_id: string;
}

// Pergunta com suas opções
export interface PerguntaQuestionario {
    id: string; // modelo_pergunta_id
    texto_pergunta: string;
    opcoes: OpcaoResposta[];
}

// Estrutura completa de um modelo de questionário retornado pela API
// (A API retorna um array de perguntas com opções aninhadas)
export type ModeloQuestionarioCompleto = PerguntaQuestionario[];

// Modelo de Questionário (apenas ID e nome)
export interface ModeloInfo {
  id: string; // modelo_questionario_id
  nome: string;
}

// Dados para salvar uma única resposta
interface RespostaItem {
    pergunta_id: string; // modelo_pergunta_id
    opcao_id: string;    // modelo_opcao_resposta_id
}

// Corpo da requisição para salvar respostas de UM questionário
interface SalvarRespostasBody {
    modelo_questionario_id: string;
    respostas: RespostaItem[];
}

// Resposta esperada da API ao salvar respostas
interface SalvarRespostasResponse {
    message: string;
}


export const getModelosApi = async (): Promise<ModeloInfo[] | null> => {
    // GET /api/questionarios/modelos
    return apiClient<ModeloInfo[]>('/questionarios/modelos');
};


/**
 * Busca a estrutura completa de um modelo de questionário (perguntas e opções) pelo ID.
 */
export const getModeloCompletoApi = async (modeloId: string): Promise<ModeloQuestionarioCompleto | null> => {
    // GET /api/questionarios/modelos/:id
    return apiClient<ModeloQuestionarioCompleto>(`/questionarios/modelos/${modeloId}`);
};

/**
 * Salva as respostas de um questionário específico para um assistido.
 */
export const salvarRespostasApi = async (assistidoId: string, data: SalvarRespostasBody): Promise<SalvarRespostasResponse | null> => {
    // POST /api/questionarios/:assistidoId/responder
    return apiClient<SalvarRespostasResponse>(`/questionarios/${assistidoId}/responder`, {
        method: 'POST',
        body: data,
        // needsAuth: true já é o padrão no apiClient
    });
};

// Exporta os tipos para uso externo, se necessário
export type { RespostaItem, SalvarRespostasBody };