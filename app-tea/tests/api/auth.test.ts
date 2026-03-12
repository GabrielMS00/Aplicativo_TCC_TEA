import { loginApi, registerApi, recoverPasswordApi } from '../../api/auth';
import { apiClient } from '../../api/apiClient';

jest.mock('../../api/apiClient');

describe('API: Auth', () => {
  it('loginApi deve chamar o endpoint correto', async () => {
    const credentials = { email: 'teste@email.com', senha: '123' };
    await loginApi(credentials);

    expect(apiClient).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: credentials,
      needsAuth: false,
    });
  });

  it('registerApi deve enviar os dados de registro', async () => {
    const userData = {
      nome: 'Teste',
      cpf: '000',
      email: 'teste@email.com',
      senha: '123',
      data_nascimento: '2000-01-01',
      tipo_usuario: 'cuidador' as const,
      palavra_seguranca: 'dog'
    };
    await registerApi(userData);

    expect(apiClient).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: userData,
      needsAuth: false,
    });
  });

  it('recoverPasswordApi deve chamar o endpoint de recuperação', async () => {
    const data = { email: 'a@a.com', palavra_seguranca: 'b', nova_senha: 'c' };
    await recoverPasswordApi(data);

    expect(apiClient).toHaveBeenCalledWith('/auth/recover-password', {
      method: 'POST',
      body: data,
      needsAuth: false,
    });
  });
});