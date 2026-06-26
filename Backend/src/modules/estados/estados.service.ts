import { AppError } from '../../shared/errors/AppError';
import { EstadosRepository } from './estados.repository';
import { PaisesRepository } from '../paises/paises.repository';
import type { CreateEstadoInput, UpdateEstadoInput } from './estados.schema';

export class EstadosService 
{
  constructor
  (
    private readonly repo:
     EstadosRepository = new EstadosRepository(),
    private readonly paisesRepo:
     PaisesRepository = new PaisesRepository(),
  ) {}

  async ListEstados
  (
    limit = 50, 
    afterId = 0, 
    codPais?: number
  ) 
  {
    return this.repo.List ( limit, afterId, codPais );
  }

  async FindEstados (id: number) 
  {
    const estado = await this.repo.FindById ( id );
    if ( !estado )
    { 
        throw new AppError( 'Estado não encontrado.', 404 ); 
    }

    return estado;
  }

  async CreateEstado
  (
    data: CreateEstadoInput, 
    codUser: number
  ) 
  {
    await this.AssertPais ( data.codPais );
    return this.repo.Create ( data, codUser );
  }

  async UpdateEstado
  (
    id: number, 
    data: UpdateEstadoInput, 
    codUser: number
  ) 
  {
    await this.AssertPais ( data.codPais );
    const atualizado = await this.repo.Update ( id, data, codUser );

    if ( !atualizado )
    { 
        throw new AppError ( 'Estado não encontrado.', 404 );
    }

    return atualizado;
  }

  async DeleteEstado
  (
    id: number, 
    codUser: number
  ) 
  {
    if ( !( await this.repo.FindById ( id ) ) )
    { 
        throw new AppError ( 'Estado não encontrado.', 404 );
    }
    if ( await this.repo.HasDependents ( id ) ) 
    {
      throw new AppError
      (
        'Não é possível excluir: há cidades ou veículos vinculados a este estado.', 
        409
      );
    }

    await this.repo.Delete ( id, codUser );
  }

  private async AssertPais
  (
    codPais: number
  ) 
  {
    if ( !( await this.paisesRepo.FindById ( codPais ) ) ) 
    {
      throw new AppError ( 'País informado não existe.', 400 );
    }
  }
}