import api from './api';

export interface Veiculo
{
  codVeiculo:    number;
  placaVeiculo:  string;
  modeloVeiculo: string | null;
  marca:         string | null;
  codEstado:     number | null;
  placaMercoSul: string | null;
  codAntt:       string | null;
  dtCriacao:     string;
  dtEdicao:      string;
  codUser:       number | null;
  isActive:      boolean;
}

export interface CreateVeiculoInput
{
  placaVeiculo:  string;
  modeloVeiculo:  string;
  marca:          string;
  codEstado?:     number;
  placaMercoSul?: string;
  codAntt:        string;
  isActive:       boolean;
}

export type UpdateVeiculoInput = CreateVeiculoInput;

export const veiculosService = {
  listar: (
    codTransp?: number,
    params?: { limit?: number; after?: number }
  ) => api
    .get < Veiculo[] > ( '/api/veiculos', { params: { ...( codTransp ? { codTransp } : {} ), ...params } } )
    .then ( ( resposta ) => resposta.data ),

  obter: (
    id: number
  ) => api
    .get < Veiculo > ( `/api/veiculos/${ id }` )
    .then ( ( resposta ) => resposta.data ),

  criar: (
    dados: CreateVeiculoInput
  ) => api
    .post < Veiculo > ( '/api/veiculos', dados )
    .then ( ( resposta ) => resposta.data ),

  atualizar: (
    id:    number,
    dados: UpdateVeiculoInput
  ) => api
    .put < Veiculo > ( `/api/veiculos/${ id }`, dados )
    .then ( ( resposta ) => resposta.data ),

  remover: (
    id: number
  ) => api
    .delete ( `/api/veiculos/${ id }` ),
};
