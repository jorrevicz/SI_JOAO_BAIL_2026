import type { ReactNode } from 'react';
import {
  ModalOverlay,
  Alerta,
  ErroCampo,
  CardFormulario,
  CabecalhoFormulario,
  BotaoFechar,
  CorpoFormulario,
  Secao,
  Celula,
  Controle,
  LinhaErro,
  Obrigatorio,
  Acoes,
} from './style';

interface PropsFormModal
{
  titulo:    string;
  erro?:     string;
  onFechar:  () => void;
  onSubmit:  ( evento: React.SyntheticEvent ) => void;
  children:  ReactNode;
}

// Overlay + card largo ( tamanho das consultas ) + cabeçalho + faixa de erro global + <form>.
export function FormModal ( { titulo, erro, onFechar, onSubmit, children }: PropsFormModal )
{
  return (
    <ModalOverlay onClick={ onFechar }>
      <CardFormulario onClick={ ( evento ) => evento.stopPropagation() }>
        <CabecalhoFormulario>
          <h3>{ titulo }</h3>
          <BotaoFechar type="button" aria-label="Fechar" onClick={ onFechar }>
            ×
          </BotaoFechar>
        </CabecalhoFormulario>
        { erro && <Alerta role="alert">{ erro }</Alerta> }
        <CorpoFormulario
          onSubmit={ ( evento ) =>
          {
            evento.stopPropagation();
            onSubmit ( evento );
          } }
        >
          { children }
        </CorpoFormulario>
      </CardFormulario>
    </ModalOverlay>
  );
}

interface PropsFormSecao
{
  children: ReactNode;
}

// Bloco/grid de 12 colunas. Um por seção semântica; o espaçamento entre seções separa os blocos.
export function FormSecao ( { children }: PropsFormSecao )
{
  return <Secao>{ children }</Secao>;
}

interface PropsFormCampo
{
  label?:       string;
  obrigatorio?: boolean;
  colunas?:     number;
  erro?:        string;
  htmlFor?:     string;
  children:     ReactNode;
}

// Célula do campo: label acima ( com asterisco quando obrigatório ), controle e erro por campo.
// `colunas` vai de 0.5 a 12, em passos de 0.5 ( ex.: 1.5 para campos curtos com rótulo maior ).
export function FormCampo (
  { label, obrigatorio = false, colunas = 12, erro, htmlFor, children }: PropsFormCampo
)
{
  return (
    <Celula $colunas={ colunas }>
      {
        label && (
          <label htmlFor={ htmlFor }>
            { label }
            { obrigatorio && <Obrigatorio>*</Obrigatorio> }
          </label>
        )
      }
      <Controle>{ children }</Controle>
      { erro && <LinhaErro><ErroCampo>{ erro }</ErroCampo></LinhaErro> }
    </Celula>
  );
}

interface PropsFormAcoes
{
  children: ReactNode;
}

// Linha de ações ( Cancelar / Salvar ) alinhada à direita.
export function FormAcoes ( { children }: PropsFormAcoes )
{
  return <Acoes>{ children }</Acoes>;
}

