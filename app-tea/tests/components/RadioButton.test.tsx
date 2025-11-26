import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RadioButton } from '../../components/RadioButton';

describe('Component: RadioButton', () => {
  it('deve renderizar o label corretamente', () => {
    const { getByText } = render(
      <RadioButton label="Opção 1" selected={false} onSelect={() => {}} />
    );
    expect(getByText('Opção 1')).toBeTruthy();
  });

  it('deve chamar a função onSelect ao ser pressionado', () => {
    const onSelectMock = jest.fn();
    const { getByText } = render(
      <RadioButton label="Opção 1" selected={false} onSelect={onSelectMock} />
    );

    fireEvent.press(getByText('Opção 1'));
    expect(onSelectMock).toHaveBeenCalledTimes(1);
  });
});