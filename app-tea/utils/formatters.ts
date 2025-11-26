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