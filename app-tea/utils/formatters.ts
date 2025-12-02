export const formatCPF = (cpf: string): string => {
  if (!cpf) return '';
  // Remove tudo que não for dígito
  const digitsOnly = cpf.replace(/\D/g, '').slice(0, 11); // Limita a 11 dígitos

  // Aplica a máscara
  return digitsOnly
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os primeiros 3 dígitos
    .replace(/(\d{3})(\d)/, '$1.$2') // Coloca ponto após os seguintes 3 dígitos
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2'); // Coloca hífen antes dos últimos 2 dígitos
};

// Remove a máscara de um CPF formatado (XXX.XXX.XXX-XX), retornando apenas os dígitos.
export const unformatCPF = (cpf: string): string => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, ''); // Remove tudo que não for dígito
};

export const calcularIdade = (dataNascimento: string): string => {
  // Verificação de segurança
  if (!dataNascimento) return 'N/I';

  try {
    let nascimento: Date;

    // Pega apenas os primeiros 10 caracteres (YYYY-MM-DD) para ignorar horas/fusos
    const dataLimpa = dataNascimento.toString().substring(0, 10); 
    const partes = dataLimpa.split('-');

    // Se tivermos Ano, Mês e Dia, montamos a data manualmente (Mês no JS começa em 0)
    if (partes.length === 3) {
      const ano = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const dia = parseInt(partes[2], 10);
      nascimento = new Date(ano, mes, dia);
    } else {
      // Fallback: se não vier no padrão com traços, tenta o padrão do sistema
      nascimento = new Date(dataNascimento);
    }

    // Se mesmo assim for inválida
    if (isNaN(nascimento.getTime())) return 'N/I';

    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();

    // Lógica para verificar se já fez aniversário este ano
    if (mesAtual < nascimento.getMonth() || (mesAtual === nascimento.getMonth() && diaAtual < nascimento.getDate())) {
      idade--;
    }

    return idade >= 0 ? idade.toString() : 'N/A';
  } catch (error) {
    console.error("Erro fatal ao calcular idade:", error);
    return 'N/A';
  }
};