import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChangePasswordScreen from '../../app/(tabs)/Account/ChangePassword';
import { Alert } from 'react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.spyOn(Alert, 'alert');

describe('Screen: ChangePassword', () => {
  it('deve exibir alerta ao salvar', () => {
    const { getByText } = render(<ChangePasswordScreen />);
    fireEvent.press(getByText('Salvar'));
    expect(Alert.alert).toHaveBeenCalledWith('Senha salva com sucesso');
  });
});