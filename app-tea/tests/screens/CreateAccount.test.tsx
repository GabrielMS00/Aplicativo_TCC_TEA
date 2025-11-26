import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateAccountScreen from '../../app/(auth)/CreateAccount';
import { registerApi } from '../../api/auth';
import { format } from 'date-fns';

jest.mock('../../api/auth');
const mockHandleRegistration = jest.fn();

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    handleRegistration: mockHandleRegistration,
  }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return (props: any) => {
    return <View testID={props.testID} {...props} />;
  };
});

describe('Screen: CreateAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar os campos básicos de cadastro', () => {
    const { getByText, getByPlaceholderText } = render(<CreateAccountScreen />);
    
    expect(getByText('Cadastro')).toBeTruthy();
    expect(getByPlaceholderText('Seu nome completo')).toBeTruthy();
    expect(getByPlaceholderText('000.000.000-00')).toBeTruthy();
  });

  it('deve mostrar campos extras ao selecionar "uso pessoal" (Padrão)', async () => {
    const { getByText, queryByText } = render(<CreateAccountScreen />);

    expect(queryByText('Nível de Suporte')).toBeNull();

    fireEvent.press(getByText('É para meu uso pessoal'));

    await waitFor(() => {
      expect(getByText('Nível de Suporte')).toBeTruthy();
      expect(getByText('Grau de Seletividade')).toBeTruthy();
    });
  });

  it('deve chamar a API de registro com os dados corretos', async () => {
    (registerApi as jest.Mock).mockResolvedValue({
      token: 'fake-token',
      cuidador: { id: '1', nome: 'João Teste', tipo_usuario: 'cuidador' }
    });

    const { getByText, getByPlaceholderText, getByTestId } = render(<CreateAccountScreen />);

    fireEvent.press(getByText('Sou um cuidador (para outra pessoa)'));
    fireEvent.changeText(getByPlaceholderText('Seu nome completo'), 'João Teste');
    fireEvent.changeText(getByPlaceholderText('000.000.000-00'), '12345678901');
    fireEvent.changeText(getByPlaceholderText('seuemail@exemplo.com'), 'joao@teste.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 8 caracteres'), 'senha123');
    fireEvent.changeText(getByPlaceholderText('Repita a senha'), 'senha123');
    fireEvent.changeText(getByPlaceholderText('Ex: nomedocachorro'), 'rex');

    const todayStr = format(new Date(), 'dd/MM/yyyy');
    const dateBtn = getByText(todayStr); 
    fireEvent.press(dateBtn);

    const picker = getByTestId('dateTimePicker');
    const pastDate = new Date('2000-01-01');
    
    fireEvent(picker, 'onChange', { type: 'set' }, pastDate);

    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(registerApi).toHaveBeenCalledWith(expect.objectContaining({
        nome: 'João Teste',
        email: 'joao@teste.com',
        tipo_usuario: 'cuidador'
      }));
      expect(mockHandleRegistration).toHaveBeenCalled();
    });
  });
});