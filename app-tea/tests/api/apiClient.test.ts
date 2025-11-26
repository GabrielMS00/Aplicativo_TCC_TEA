import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, API_BASE_URL } from '../../api/apiClient';
import { Alert } from 'react-native';

global.fetch = jest.fn();
jest.spyOn(Alert, 'alert');

describe('API: apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('deve fazer uma requisição GET simples sem auth', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true }),
    });

    const response = await apiClient('/teste', { needsAuth: false });

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/teste`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.not.objectContaining({ Authorization: expect.anything() }),
      })
    );
    expect(response).toEqual({ success: true });
  });

  it('deve injetar o token de autenticação quando needsAuth é true', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token-falso');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ data: 'secreto' }),
    });

    await apiClient('/protegido');

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@AppTEA:token');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-falso',
        }),
      })
    );
  });

  it('deve retornar null e alertar em caso de erro da API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'Dados inválidos' }),
    });

    const response = await apiClient('/erro', { needsAuth: false });

    expect(response).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith('Erro 400', 'Dados inválidos');
  });

  it('deve lidar com exceções de rede (fetch falhando)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Falha na rede'));

    const response = await apiClient('/network-error', { needsAuth: false });

    expect(response).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith('Erro de Rede', expect.stringContaining('Não foi possível conectar'));
  });
});