import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SelectInput } from '../../components/SelectInput';

const mockOptions = [
  { label: 'Opção A', value: 'A' },
  { label: 'Opção B', value: 'B' },
];

describe('Component: SelectInput', () => {
  it('deve renderizar o placeholder quando nada estiver selecionado', () => {
    const { getByText } = render(
      <SelectInput options={mockOptions} onValueChange={() => {}} />
    );
    expect(getByText('Selecione uma opção...')).toBeTruthy();
  });

  it('deve renderizar o label da opção selecionada', () => {
    const { getByText } = render(
      <SelectInput 
        options={mockOptions} 
        selectedValue="B" 
        onValueChange={() => {}} 
      />
    );
    expect(getByText('Opção B')).toBeTruthy();
  });

  it('deve abrir o modal e selecionar uma opção', async () => {
    const onValueChangeMock = jest.fn();
    const { getByText, queryByText } = render(
      <SelectInput 
        options={mockOptions} 
        onValueChange={onValueChangeMock} 
        placeholder="Toque aqui"
      />
    );

    fireEvent.press(getByText('Toque aqui'));

    expect(getByText('Opção A')).toBeTruthy();
    expect(getByText('Opção B')).toBeTruthy();

    fireEvent.press(getByText('Opção A'));

    expect(onValueChangeMock).toHaveBeenCalledWith('A');
  });
});