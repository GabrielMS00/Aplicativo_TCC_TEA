import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FoodCardChecable } from '../../components/FoodCardChecable';

jest.mock('expo-checkbox', () => {
  const { View } = require('react-native');
  return (props: any) => (
    <View 
      testID="checkbox" 
      onTouchEnd={() => props.onValueChange(!props.value)} 
      {...props} 
    />
  );
});

describe('Component: FoodCardChecable', () => {
  it('deve renderizar o nome do alimento', () => {
    const { getByText } = render(
      <FoodCardChecable 
        foodName="Banana" 
        isChecked={false} 
        onValueChange={() => {}} 
      />
    );
    expect(getByText('Banana')).toBeTruthy();
  });

  it('deve chamar onValueChange ao interagir com o checkbox', () => {
    const onValueChangeMock = jest.fn();
    const { getByTestId } = render(
      <FoodCardChecable 
        foodName="Banana" 
        isChecked={false} 
        onValueChange={onValueChangeMock} 
      />
    );

    const checkbox = getByTestId('checkbox');
    // Simulamos o evento definido no Mock acima
    fireEvent(checkbox, 'onTouchEnd');

    expect(onValueChangeMock).toHaveBeenCalledWith(true);
  });
});