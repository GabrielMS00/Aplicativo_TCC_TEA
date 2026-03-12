import { getPerfilApi, updatePerfilApi } from '../../api/cuidador';
import { apiClient } from '../../api/apiClient';

jest.mock('../../api/apiClient');

describe('API: Cuidador', () => {
  it('getPerfilApi deve buscar perfil', async () => {
    await getPerfilApi();
    expect(apiClient).toHaveBeenCalledWith('/cuidador/perfil');
  });

  it('updatePerfilApi deve enviar PUT com dados', async () => {
    const data = { nome: 'Cuidador', email: 'c@c.com', cpf: '000', data_nascimento: '1990-01-01' };
    await updatePerfilApi(data);
    expect(apiClient).toHaveBeenCalledWith('/cuidador/perfil', {
      method: 'PUT',
      body: data,
    });
  });
});