import { formatCPF, unformatCPF } from '../../utils/formatters';

describe('Utils: formatters', () => {
  describe('formatCPF', () => {
    it('deve formatar um CPF corretamente com pontos e traço', () => {
      const input = '12345678901';
      const expected = '123.456.789-01';
      expect(formatCPF(input)).toBe(expected);
    });

    it('deve lidar com string vazia', () => {
      expect(formatCPF('')).toBe('');
    });

    it('deve formatar parcialmente enquanto o usuário digita', () => {
      expect(formatCPF('123456')).toBe('123.456');
    });
  });

  describe('unformatCPF', () => {
    it('deve remover pontos e traços, retornando apenas números', () => {
      const input = '123.456.789-01';
      const expected = '12345678901';
      expect(unformatCPF(input)).toBe(expected);
    });

    it('deve retornar string vazia se não houver input', () => {
      expect(unformatCPF('')).toBe('');
    });
  });
});