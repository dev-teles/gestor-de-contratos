/**
 * Validador e formatador de CNPJ (Algoritmo Oficial Módulo 11 da Receita Federal do Brasil)
 */

export function cleanCnpj(cnpj: string): string {
  return (cnpj || '').replace(/\D/g, '');
}

export function formatCnpj(cnpj: string): string {
  const digits = cleanCnpj(cnpj);
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

export function isValidCnpj(cnpj: string): boolean {
  const digits = cleanCnpj(cnpj);

  if (digits.length !== 14) return false;

  // Rejeita sequências conhecidas de dígitos repetidos
  if (/^(\d)\1{13}$/.test(digits)) return false;

  // Primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(digits.charAt(i), 10) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  if (parseInt(digits.charAt(12), 10) !== digito1) return false;

  // Segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(digits.charAt(i), 10) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  return parseInt(digits.charAt(13), 10) === digito2;
}
