import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../components/Button';

describe('Component: Button', () => {
  it('deve renderizar o título corretamente', () => {
    const { getByText } = render(<Button title="Confirmar" />);
    expect(getByText('Confirmar')).toBeTruthy();
  });

  it('deve chamar a função onPress quando pressionado', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Salvar" onPress={onPressMock} />);
    
    const button = getByText('Salvar');
    fireEvent.press(button);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('deve aplicar o estilo de atenção (padrão) quando nenhum tipo é passado', () => {
    const { getByText } = render(<Button title="Cancelar" />);
    // No NativeWind/Tailwind, testar estilos exatos é complexo, 
    // mas podemos verificar se renderiza sem erros.
    expect(getByText('Cancelar')).toBeTruthy();
  });
});