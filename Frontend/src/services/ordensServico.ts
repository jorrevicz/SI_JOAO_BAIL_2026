import api from './api';

export interface Aparelho
{
  codAparelho: number;
  aparelho:    string | null;
  serie:       string | null;
  modelo:      string;
  voltagem:    string;
  garantia:    string;
}

export interface Equipamento
{
  codEquipamento: number;
  equipamento:    string;
  grupoUser:      string | null;
  soEq:           string;
  socketEq:       string;
  memoriaRam:     string;
  tipoOffice:     string;
  placaMae:       string;
  bios:           string;
  capacidadeRam:  string;
  possuiSSD:      boolean;
  possuiHD:       boolean;
  capacidadeArmz: string;
  usoArmz:        string;
}

export interface ProcedimentoOdS
{
  numOdS:          number;
  codProcedimento: number;
  ordem:           number;
  posicao:         string | null;
  checagem:        boolean | null;
  obsProcedimento: string | null;
  dthFim:          string | null;
}

export interface ServicoOdS
{
  numOdS:     number;
  codServico: number;
  qtdServico: number;
}

export interface OrcamentoPecaOdS
{
  numOdS:   number;
  codPeca:  number;
  vlrPv:    string;
  aprovado: boolean;
}

export interface SubstituirPecaOdS
{
  numOdS:          number;
  codPeca:         number;
  qtdPeca:         number;
  vlrUnitarioPeca: number;
}

export interface OrdemServico
{
  numOdS:               number;
  codCliente:            number;
  atendente:             string;
  dtAtendimento:         string | null;
  dtExecucao:            string | null;
  codAparelho:            number;
  acessorio:             string | null;
  defeito:               string;
  obsBalcao:             string | null;
  obsTecnica:            string | null;
  entreguePara:          string | null;
  tipoOdS:               string;
  codEquipamento:         number;
  historicoManutencao:   string | null;
  solicitante:           string | null;
  dtCriacao:             string;
  dtEdicao:              string;
  codUser:               number | null;
  isActive:              boolean;
}

export interface OrdemServicoDetalhe extends OrdemServico
{
  aparelho:          Aparelho;
  equipamento:       Equipamento;
  procedimentos:     ProcedimentoOdS[];
  servicos:          ServicoOdS[];
  orcamentoPecas:    OrcamentoPecaOdS[];
  substituicaoPecas: SubstituirPecaOdS[];
}

export interface AparelhoInput
{
  aparelho?: string | null;
  serie?:    string | null;
  modelo:    string;
  voltagem:  string;
  garantia:  string;
}

export interface EquipamentoInput
{
  equipamento:    string;
  grupoUser?:     string | null;
  soEq:           string;
  socketEq:       string;
  memoriaRam:     string;
  tipoOffice:     string;
  placaMae:       string;
  bios:           string;
  capacidadeRam:  string;
  possuiSSD:      boolean;
  possuiHD:       boolean;
  capacidadeArmz: string;
  usoArmz:        string;
}

export interface AbrirOrdemServicoInput
{
  codCliente:   number;
  atendente:   string;
  acessorio?:  string | null;
  defeito:     string;
  obsBalcao?:  string | null;
  tipoOdS:     string;
  solicitante?: string | null;
  aparelho:    AparelhoInput;
  equipamento: EquipamentoInput;
}

export interface ProcedimentoEstruturaOdSInput
{
  codProcedimento: number;
  ordem:           number;
}

export interface DefinirProcedimentosInput
{
  procedimentos: ProcedimentoEstruturaOdSInput[];
}

export interface ProcedimentoOdSInput
{
  codProcedimento: number;
  posicao:         string;
  checagem:        boolean;
  dthFim:          string;
  obsProcedimento?: string | null;
}

export interface OrcamentoPecaOdSInput
{
  codPeca: number;
  vlrPv:   string;
}

export interface RegistrarDiagnosticoInput
{
  historicoManutencao?: string | null;
  procedimentos:        ProcedimentoOdSInput[];
  orcamentoPecas:       OrcamentoPecaOdSInput[];
}

export interface ServicoOdSInput
{
  codServico: number;
  qtdServico: number;
}

export interface RegistrarExecucaoInput
{
  servicos:    ServicoOdSInput[];
  obsTecnica?: string | null;
}

export interface SubstituirPecaOdSInput
{
  codPeca:         number;
  qtdPeca:         number;
  vlrUnitarioPeca: number;
}

export interface RegistrarSubstituicaoPecasInput
{
  pecas: SubstituirPecaOdSInput[];
}

export const ordensServicoService = {
  listar: (
    params?: { limit?: number; after?: number; codCliente?: number }
  ) => api
    .get < OrdemServico[] > ( '/api/ordens-servico', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    numOdS: number
  ) => api
    .get < OrdemServicoDetalhe > ( `/api/ordens-servico/${ numOdS }` )
    .then ( ( resposta ) => resposta.data ),

  abrir: (
    dados: AbrirOrdemServicoInput
  ) => api
    .post < OrdemServicoDetalhe > ( '/api/ordens-servico', dados )
    .then ( ( resposta ) => resposta.data ),

  definirProcedimentos: (
    numOdS: number,
    dados:  DefinirProcedimentosInput
  ) => api
    .patch < OrdemServicoDetalhe > ( `/api/ordens-servico/${ numOdS }/procedimentos`, dados )
    .then ( ( resposta ) => resposta.data ),

  registrarDiagnostico: (
    numOdS: number,
    dados:  RegistrarDiagnosticoInput
  ) => api
    .patch < OrdemServicoDetalhe > ( `/api/ordens-servico/${ numOdS }/diagnostico`, dados )
    .then ( ( resposta ) => resposta.data ),

  registrarExecucao: (
    numOdS: number,
    dados:  RegistrarExecucaoInput
  ) => api
    .patch < OrdemServicoDetalhe > ( `/api/ordens-servico/${ numOdS }/execucao`, dados )
    .then ( ( resposta ) => resposta.data ),

  registrarSubstituicaoPecas: (
    numOdS: number,
    dados:  RegistrarSubstituicaoPecasInput
  ) => api
    .patch < OrdemServicoDetalhe > ( `/api/ordens-servico/${ numOdS }/substituicao-pecas`, dados )
    .then ( ( resposta ) => resposta.data ),
};
