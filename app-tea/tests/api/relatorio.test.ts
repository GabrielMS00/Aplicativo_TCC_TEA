import { getRelatorioGeralApi } from '../../api/relatorio';
import { apiClient } from '../../api/apiClient';

jest.mock('../../api/apiClient');

describe('API: Relatorio', () => {
  it('getRelatorioGeralApi deve buscar relatório geral', async () => {
    await getRelatorioGeralApi('id-assistido');
    expect(apiClient).toHaveBeenCalledWith('/relatorios/id-assistido/geral');
  });
});