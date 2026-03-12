import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '../../components/Input';

describe('Component: Input', () => {
  it('deve renderizar corretamente com o placeholder', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Digite aqui" />);
    expect(getByPlaceholderText('Digite aqui')).toBeTruthy();
  });

  it('deve repassar o valor e lidar com a mudança de texto', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <Input 
        placeholder="Teste" 
        value="Valor Inicial" 
        onChangeText={onChangeTextMock} 
      />
    );

    const input = getByPlaceholderText('Teste');
    
    expect(input.props.value).toBe('Valor Inicial');

    fireEvent.changeText(input, 'Novo Texto');
    expect(onChangeTextMock).toHaveBeenCalledWith('Novo Texto');
  });

  it('deve aceitar props de estilo (ex: secureTextEntry)', () => {
    const { getByPlaceholderText } = render(<Input placeholder="Senha" secureTextEntry />);
    const input = getByPlaceholderText('Senha');
    expect(input.props.secureTextEntry).toBe(true);
  });
});