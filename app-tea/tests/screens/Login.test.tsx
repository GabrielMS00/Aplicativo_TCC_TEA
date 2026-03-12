import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../app/(auth)/index';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockSignIn = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    isLoading: false,
  }),
}));

describe('Screen: Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar os campos de email e senha', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    expect(getByPlaceholderText('seuemail@exemplo.com')).toBeTruthy();
    expect(getByPlaceholderText('******')).toBeTruthy();
    expect(getByText('Entrar')).toBeTruthy();
  });

  it('deve exibir erro se tentar entrar com campos vazios', async () => {
    const { getByText } = render(<LoginScreen />);
    
    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(getByText('E-mail é obrigatório')).toBeTruthy();
      expect(getByText('Senha deve ter no mínimo 6 caracteres')).toBeTruthy();
    });
    
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('deve chamar a função signIn com os dados corretos quando o formulário for válido', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('seuemail@exemplo.com'), 'teste@email.com');
    fireEvent.changeText(getByPlaceholderText('******'), '12345678');

    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'teste@email.com',
        senha: '12345678',
      });
    });
  });
});