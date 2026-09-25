import { cleanCnpj, formatCnpj, isValidCnpj } from './cnpjValidator';
import { CnpjConsultaResponse } from './types';

export class BrasilApiClient {
  private readonly baseUrl: string = 'https://brasilapi.com.br/api/cnpj/v1';

  async consultarCnpj(rawCnpj: string, timeoutMs: number = 8000): Promise<CnpjConsultaResponse> {
    const digits = cleanCnpj(rawCnpj);

    if (!isValidCnpj(digits)) {
      throw new Error(`CNPJ inválido de acordo com o dígito verificador da Receita Federal: ${rawCnpj}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/${digits}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`CNPJ ${formatCnpj(digits)} não localizado na base da Receita Federal.`);
        }
        if (response.status === 429) {
          throw new Error('Limite de consultas temporariamente excedido na API da Receita.');
        }
        throw new Error(`Falha na consulta à Receita Federal (HTTP ${response.status})`);
      }

      const data = await response.json();

      const situacao = (data.descricao_situacao_cadastral || data.situacao_cadastral || 'ATIVA').toUpperCase();
      let parsedSituacao: CnpjConsultaResponse['situacaoCadastral'] = 'ATIVA';
      if (situacao.includes('INAPT')) parsedSituacao = 'INAPTA';
      else if (situacao.includes('SUSP')) parsedSituacao = 'SUSPENSA';
      else if (situacao.includes('BAIX')) parsedSituacao = 'BAIXADA';
      else if (situacao.includes('NUL')) parsedSituacao = 'NULA';

      const qsa = Array.isArray(data.qsa)
        ? data.qsa.map((s: Record<string, string>) => ({
            nome: s.nome_socio || s.nome || 'Sócio',
            qualificacao: s.qualificacao_socio || s.qualificacao || 'Administrador',
            pais: s.pais,
            faixaEtaria: s.faixa_etaria,
          }))
        : [];

      return {
        cnpj: formatCnpj(digits),
        razaoSocial: data.razao_social || data.nome || 'Empresa Consultada',
        nomeFantasia: data.nome_fantasia || data.fantasia || data.razao_social || '—',
        situacaoCadastral: parsedSituacao,
        dataSituacaoCadastral: data.data_situacao_cadastral,
        motivoSituacaoCadastral: data.motivo_situacao_cadastral,
        dataAbertura: data.data_inicio_atividade,
        cnaeFiscal: String(data.cnae_fiscal || ''),
        cnaeFiscalDescricao: data.cnae_fiscal_descricao || 'Atividade Econômica Principal',
        cnaesSecundarios: Array.isArray(data.cnaes_secundarios)
          ? data.cnaes_secundarios.map((c: Record<string, string>) => ({
              codigo: String(c.codigo || ''),
              descricao: String(c.descricao || ''),
            }))
          : [],
        naturezaJuridica: data.natureza_juridica,
        logradouro: `${data.descricao_tipo_de_logradouro || ''} ${data.logradouro || ''}`.trim(),
        numero: data.numero || 'S/N',
        complemento: data.complemento,
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        cep: data.cep || '',
        email: data.email?.toLowerCase(),
        telefone: data.ddd_telefone_1 || data.telefone,
        capitalSocial: Number(data.capital_social || 0),
        qsa,
        simplesNacional: data.opcao_pelo_simples,
        porte: data.porte,
        fonteConsulta: 'BrasilAPI',
        dataConsulta: new Date().toISOString(),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
