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
  numOdS:          string;
  codProcedimento: number;
  posicao:         string;
  checagem:        string;
  obsProcedimento: string | null;
  dthFim:          string;
}

export interface OrdemServico
{
  numOdS:               string;
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
  aparelho:     Aparelho;
  equipamento:  Equipamento;
  procedimentos: ProcedimentoOdS[];
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
  numOdS:      string;
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

export interface ProcedimentoOdSInput
{
  codProcedimento: number;
  posicao:         string;
  checagem:        string;
  obsProcedimento?: string | null;
  dthFim?:         string;
}

export interface RegistrarDiagnosticoInput
{
  obsTecnica?:          string | null;
  historicoManutencao?: string | null;
  procedimentos:        ProcedimentoOdSInput[];
}

export const ordensServicoService = {
  listar: (
    params?: { limit?: number; after?: string; codCliente?: number }
  ) => api
    .get < OrdemServico[] > ( '/api/ordens-servico', { params } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    numOdS: string
  ) => api
    .get < OrdemServicoDetalhe > ( `/api/ordens-servico/${ numOdS }` )
    .then ( ( resposta ) => resposta.data ),

  abrir: (
    dados: AbrirOrdemServicoInput
  ) => api
    .post < OrdemServicoDetalhe > ( '/api/ordens-servico', dados )
    .then ( ( resposta ) => resposta.data ),

  registrarDiagnostico: (
    numOdS: string,
    dados:  RegistrarDiagnosticoInput
  ) => api
    .patch < OrdemServicoDetalhe > ( `/api/ordens-servico/${ numOdS }/diagnostico`, dados )
    .then ( ( resposta ) => resposta.data ),
};
