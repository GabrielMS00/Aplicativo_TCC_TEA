import React from 'react';
import { render } from '@testing-library/react-native';
import { FoodCard } from '../../components/FoodCard';

describe('Component: FoodCard', () => {
  it('deve renderizar as informações do alimento corretamente', () => {
    const { getByText } = render(
      <FoodCard 
        food="Maçã" 
        foodGroup="Frutas" 
        preparation="Natural" 
      />
    );

    expect(getByText('Maçã')).toBeTruthy();
    expect(getByText('Frutas')).toBeTruthy();
    expect(getByText('Natural')).toBeTruthy();
  });
});