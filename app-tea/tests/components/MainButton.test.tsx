import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MainButton } from '../../components/MainButton';

describe('Component: MainButton', () => {
  it('deve renderizar o título corretamente', () => {
    const { getByText } = render(<MainButton title="Entrar" />);
    expect(getByText('Entrar')).toBeTruthy();
  });

  it('deve chamar a função onPress ao ser pressionado', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<MainButton title="Entrar" onPress={onPressMock} />);
    
    const button = getByText('Entrar');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});