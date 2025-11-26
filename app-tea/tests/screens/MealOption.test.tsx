import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MealOptionScreen from '../../app/FoodExchange/MealOption';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ assistidoId: '123' }),
}));

jest.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ user: { nome: 'Teste' }, signOut: jest.fn() })
}));

describe('Screen: MealOption', () => {
  it('deve navegar para a sugestão ao clicar em uma refeição', () => {
    const { getByText } = render(<MealOptionScreen />);
    
    fireEvent.press(getByText('Almoço'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/FoodExchange/FoodExchangeOption',
      params: { assistidoId: '123', mealName: 'Almoço' }
    });
  });
});