import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterScreen from '../../app/(tabs)/Register';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { tipo_usuario: 'cuidador' } }),
}));

describe('Screen: Register (Assistido)', () => {
  it('deve iniciar o fluxo de questionários ao preencher nome', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome do assistido'), 'Novo Assistido');
    fireEvent.press(getByText('Iniciar Questionários'));

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({
      pathname: '/QuestionnaireFlow/Screen',
      params: expect.objectContaining({
        assistidoData: expect.stringContaining('"nome":"Novo Assistido"'),
      })
    }));
  });
});