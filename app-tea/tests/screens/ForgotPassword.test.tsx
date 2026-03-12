import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../../app/(auth)/ForgotPassword';
import { recoverPasswordApi } from '../../api/auth';
import { Alert } from 'react-native';

jest.mock('../../api/auth');
jest.spyOn(Alert, 'alert');

describe('Screen: ForgotPassword', () => {
  it('deve chamar a API de recuperação ao preencher corretamente', async () => {
    (recoverPasswordApi as jest.Mock).mockResolvedValue({ message: 'Senha alterada' });

    const { getByText, getByPlaceholderText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'teste@email.com');
    fireEvent.changeText(getByPlaceholderText('Sua palavra secreta'), 'segredo');
    fireEvent.changeText(getByPlaceholderText('Nova senha (mín 8 caracteres)'), 'novasenha123');

    fireEvent.press(getByText('Redefinir Senha'));

    await waitFor(() => {
      expect(recoverPasswordApi).toHaveBeenCalledWith({
        email: 'teste@email.com',
        palavra_seguranca: 'segredo',
        nova_senha: 'novasenha123'
      });
      expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Senha alterada', expect.any(Array));
    });
  });
});