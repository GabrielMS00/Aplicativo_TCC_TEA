import { getSugestaoParaRefeicaoApi, processarFeedbackESugerirNovaApi } from '../../api/sugestoes';
import { apiClient } from '../../api/apiClient';

jest.mock('../../api/apiClient');

describe('API: Sugestoes', () => {
  it('getSugestaoParaRefeicaoApi deve chamar endpoint correto', async () => {
    await getSugestaoParaRefeicaoApi('id-123', 'Almoço');
    expect(apiClient).toHaveBeenCalledWith('/sugestoes/id-123/Almoço', { params: {} });
  });

  it('getSugestaoParaRefeicaoApi deve passar parametros de exclusão', async () => {
    await getSugestaoParaRefeicaoApi('id-123', 'Jantar', ['p1', 'p2']);
    expect(apiClient).toHaveBeenCalledWith('/sugestoes/id-123/Jantar', {
      params: { excluirPerfilIds: 'p1,p2' }
    });
  });

  it('processarFeedbackESugerirNovaApi deve enviar POST com feedback', async () => {
    const feedback = [{ detalheTrocaId: 'd1', status: 'aceito' as const }];
    await processarFeedbackESugerirNovaApi('id-123', 'Almoço', feedback);

    expect(apiClient).toHaveBeenCalledWith('/sugestoes/feedback/id-123/Almoço', {
      method: 'POST',
      body: { feedback },
    });
  });
});