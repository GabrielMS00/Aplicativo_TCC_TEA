import { getModelosApi, getModeloCompletoApi, salvarRespostasApi } from '../../api/questionario';
import { apiClient } from '../../api/apiClient';

jest.mock('../../api/apiClient');

describe('API: Questionario', () => {
  it('getModelosApi deve buscar lista de modelos', async () => {
    await getModelosApi();
    expect(apiClient).toHaveBeenCalledWith('/questionarios/modelos');
  });

  it('getModeloCompletoApi deve buscar detalhes do modelo por ID', async () => {
    await getModeloCompletoApi('modelo-123');
    expect(apiClient).toHaveBeenCalledWith('/questionarios/modelos/modelo-123');
  });

  it('salvarRespostasApi deve enviar POST com respostas', async () => {
    const assistidoId = 'assistido-1';
    const data = {
      modelo_questionario_id: 'mod-1',
      respostas: [{ pergunta_id: 'p1', opcao_id: 'o1' }]
    };
    
    await salvarRespostasApi(assistidoId, data);
    
    expect(apiClient).toHaveBeenCalledWith(`/questionarios/${assistidoId}/responder`, {
      method: 'POST',
      body: data,
    });
  });
});