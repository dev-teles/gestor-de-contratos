export interface CnpjSocio {
  nome: string;
  qualificacao: string;
  pais?: string;
  faixaEtaria?: string;
}

export interface CnpjConsultaResponse {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: 'ATIVA' | 'INAPTA' | 'SUSPENSA' | 'BAIXADA' | 'NULA' | 'DESCONHECIDA';
  dataSituacaoCadastral?: string;
  motivoSituacaoCadastral?: string;
  dataAbertura?: string;
  cnaeFiscal: string;
  cnaeFiscalDescricao: string;
  cnaesSecundarios?: Array<{ codigo: string; descricao: string }>;
  naturezaJuridica?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  email?: string;
  telefone?: string;
  capitalSocial?: number;
  qsa?: CnpjSocio[];
  simplesNacional?: boolean;
  porte?: string;
  fonteConsulta: 'BrasilAPI' | 'ReceitaWS' | 'Base Local Homologada';
  dataConsulta: string;
}

export interface CnpjComplianceScore {
  score: number; // 0 to 100
  nivelRisco: 'baixo' | 'medio' | 'alto';
  alertas: string[];
  aptoParaContratacao: boolean;
  recomendacoes: string[];
}
