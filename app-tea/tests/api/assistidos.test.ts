import { 
  getAssistidosApi, 
  createAssistidoApi, 
  updateAssistidoApi, 
  deleteAssistidoApi 
} from '../../api/assistidos';
import { apiClient } from '../../api/apiClient';

jest.mock('../../api/apiClient');

describe('API: Assistidos', () => {
  it('getAssistidosApi deve buscar a lista', async () => {
    await getAssistidosApi();
    expect(apiClient).toHaveBeenCalledWith('/assistidos');
  });

  it('createAssistidoApi deve enviar POST com dados', async () => {
    const data = { nome: 'João', data_nascimento: '2010-01-01' };
    await createAssistidoApi(data);
    expect(apiClient).toHaveBeenCalledWith('/assistidos', {
      method: 'POST',
      body: data,
    });
  });

  it('updateAssistidoApi deve enviar PUT com ID na URL', async () => {
    const id = '123';
    const data = { nome: 'João Modificado', data_nascimento: '2010-01-01', nivel_suporte: '1', grau_seletividade: 'leve' };
    await updateAssistidoApi(id, data);
    expect(apiClient).toHaveBeenCalledWith(`/assistidos/${id}`, {
      method: 'PUT',
      body: data,
    });
  });

  it('deleteAssistidoApi deve enviar DELETE com ID na URL', async () => {
    const id = '123';
    await deleteAssistidoApi(id);
    expect(apiClient).toHaveBeenCalledWith(`/assistidos/${id}`, {
      method: 'DELETE',
    });
  });
});