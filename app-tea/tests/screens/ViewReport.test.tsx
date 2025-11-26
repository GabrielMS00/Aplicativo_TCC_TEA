import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ViewReportScreen from '../../app/Reports/ViewReport';
import { getRelatorioGeralApi } from '../../api/relatorio';

jest.mock('../../api/relatorio');
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ assistidoId: '123' }),
}));
jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

const mockRelatorio = {
  dadosPessoais: { nome: 'João', dataNascimento: '2010-01-01' },
  questionarios: [],
  historicoTrocas: []
};

describe('Screen: ViewReport', () => {
  it('deve renderizar o relatório', async () => {
    (getRelatorioGeralApi as jest.Mock).mockResolvedValue(mockRelatorio);
    const { getByText } = render(<ViewReportScreen />);

    await waitFor(() => {
      expect(getByText('João')).toBeTruthy();
    });
  });
});