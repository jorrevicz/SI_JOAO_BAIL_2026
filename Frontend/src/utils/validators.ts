// Validações básicas de formato, pensadas para o `onChange` dos campos: cada função recebe o
// valor digitado e devolve a mensagem de erro (em português) ou '' quando o valor é válido.
// Valor vazio é sempre válido aqui — a obrigatoriedade fica com o `required` do campo e com o
// Backend (Zod), que continua sendo a fonte de verdade e confere tudo de novo ao salvar.

const SOMENTE_NUMEROS = /^[0-9]+$/;
const SOMENTE_LETRAS  = /^[\p{L}\s'.-]+$/u;
const EMAIL           = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validarSomenteNumeros = ( valor: string, rotulo = 'O campo' ) =>
{
  if ( valor === '' || SOMENTE_NUMEROS.test ( valor ) )
  {
    return '';
  }

  return `${ rotulo } deve conter apenas números.`;
};

// Letras (com acento), espaço, apóstrofo, ponto e hífen — o que um nome próprio comporta.
export const validarSomenteLetras = ( valor: string, rotulo = 'O campo' ) =>
{
  if ( valor === '' || SOMENTE_LETRAS.test ( valor ) )
  {
    return '';
  }

  return `${ rotulo } deve conter apenas letras.`;
};

export const validarEmail = ( valor: string ) =>
{
  if ( valor === '' || EMAIL.test ( valor ) )
  {
    return '';
  }

  return 'Informe um e-mail válido (ex.: nome@dominio.com).';
};

// Apenas números e com um dos tamanhos permitidos (ex.: CPF = 11, CNPJ = 14).
export const validarDigitos = ( valor: string, tamanhos: number[], rotulo = 'O campo' ) =>
{
  const erroNumerico = validarSomenteNumeros ( valor, rotulo );

  if ( erroNumerico !== '' || valor === '' || tamanhos.includes ( valor.length ) )
  {
    return erroNumerico;
  }

  return `${ rotulo } deve ter ${ tamanhos.join ( ' ou ' ) } dígitos.`;
};

// Somente letras A-Z (sem acento) com um dos tamanhos permitidos (ex.: UF = 2).
export const validarLetrasComTamanho = ( valor: string, tamanhos: number[], rotulo = 'O campo' ) =>
{
  if ( valor === '' )
  {
    return '';
  }

  if ( !/^[A-Za-z]+$/.test ( valor ) )
  {
    return `${ rotulo } deve conter apenas letras.`;
  }

  return tamanhos.includes ( valor.length ) ? '' : `${ rotulo } deve ter ${ tamanhos.join ( ' ou ' ) } letras.`;
};

// Decimal com ponto e no máximo `casas` casas decimais (ex.: 10, 10.5 e 10.50 passam; 10.505
// não). O envio completa para 2 casas com toFixed, que arredondaria o excedente em silêncio.
export const validarDecimal = ( valor: string, casas = 2, rotulo = 'O valor' ) =>
{
  if ( valor === '' )
  {
    return '';
  }

  if ( !/^[0-9]+(\.[0-9]*)?$/.test ( valor ) )
  {
    return `${ rotulo } deve ser um número decimal (ex.: 10.00).`;
  }

  const [ , fracao = '' ] = valor.split ( '.' );

  return fracao.length > casas ? `${ rotulo } deve ter no máximo ${ casas } casas decimais.` : '';
};

export const validarCep      = ( valor: string ) => validarDigitos ( valor, [ 8 ], 'O CEP' );
export const validarCpf      = ( valor: string ) => validarDigitos ( valor, [ 11 ], 'O CPF' );
export const validarCnpj     = ( valor: string ) => validarDigitos ( valor, [ 14 ], 'O CNPJ' );

// Telefone só com dígitos (DDI + DDD + número), de 10 a 15 — mesma regra do Backend.
export const validarTelefone = ( valor: string ) =>
{
  const erroNumerico = validarSomenteNumeros ( valor, 'O telefone' );

  if ( erroNumerico !== '' || valor === '' || ( valor.length >= 10 && valor.length <= 15 ) )
  {
    return erroNumerico;
  }

  return 'O telefone deve ter entre 10 e 15 dígitos.';
};

// Datas da compra — mesma regra do Backend (`ValidarDatasDocumentoFiscal`): a emissão não
// pode ser futura; a chegada não pode ser anterior à emissão nem futura. Recebem o valor do
// <input type="datetime-local"> (dígitos UTC, ver `paraDataHoraInputUtc`); vazio é válido aqui.
const dataHoraInputParaDate = ( valor: string ) => new Date ( `${ valor }:00.000Z` );

export const validarDataEmissaoCompra = ( emissao: string, agora = new Date() ) =>
{
  if ( emissao === '' || dataHoraInputParaDate ( emissao ) < agora )
  {
    return '';
  }

  return 'A data de emissão não pode ser futura.';
};

export const validarDataChegadaCompra = ( chegada: string, emissao: string, agora = new Date() ) =>
{
  if ( chegada === '' )
  {
    return '';
  }

  const dataChegada = dataHoraInputParaDate ( chegada );

  if ( emissao !== '' && dataChegada < dataHoraInputParaDate ( emissao ) )
  {
    return 'A data de chegada não pode ser anterior à data de emissão.';
  }

  return dataChegada > agora ? 'A data de chegada não pode ser futura.' : '';
};

// Atualiza só o erro de um campo no objeto `errosCampo` do formulário (mensagem vazia remove
// o erro), sem mexer nos demais — o formulário não precisa ser revalidado por inteiro.
// Uso: setErrosCampo ( ( anterior ) => comErroDoCampo ( anterior, 'email', validarEmail ( valor ) ) )
export const comErroDoCampo = (
  erros:    Record < string, string >,
  campo:    string,
  mensagem: string
): Record < string, string > =>
{
  const { [ campo ]: _removido, ...restante } = erros; // eslint-disable-line @typescript-eslint/no-unused-vars

  return mensagem === '' ? restante : { ...restante, [ campo ]: mensagem };
};
