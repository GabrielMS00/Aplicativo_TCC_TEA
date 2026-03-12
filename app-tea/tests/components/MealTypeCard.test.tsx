import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MealTypeCard } from '../../components/MealTypeCard';

describe('Component: MealTypeCard', () => {
  it('deve renderizar o nome e o ícone', () => {
    const { getByText } = render(
      <MealTypeCard name="Almoço" icone="🍽️" onPress={() => {}} />
    );

    expect(getByText('Almoço')).toBeTruthy();
    expect(getByText('🍽️')).toBeTruthy();
  });

  it('deve responder ao pressionamento', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <MealTypeCard name="Jantar" icone="🥗" onPress={onPressMock} />
    );

    fireEvent.press(getByText('Jantar'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});