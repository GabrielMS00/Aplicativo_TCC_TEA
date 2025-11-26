import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WatchedCard } from '../../components/WatchedCard';

describe('Component: WatchedCard', () => {
  const mockData = {
    id: '123',
    name: 'João Silva',
    idade: '10',
    suporte: 'Nível 1',
    onPressOptions: jest.fn(),
  };

  it('deve renderizar as informações do assistido', () => {
    const { getByText } = render(<WatchedCard {...mockData} />);

    expect(getByText('João Silva')).toBeTruthy();
    expect(getByText('Idade: 10')).toBeTruthy();
    expect(getByText('Nível de suporte: Nível 1')).toBeTruthy();
  });

  it('deve chamar onPressOptions com o ID e nome corretos ao clicar nas opções (...)', () => {
    const { getByText } = render(<WatchedCard {...mockData} />);

    const optionsButton = getByText('...');
    fireEvent.press(optionsButton);

    expect(mockData.onPressOptions).toHaveBeenCalledWith('123', 'João Silva');
  });
});