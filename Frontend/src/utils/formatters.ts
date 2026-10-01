const doisDigitos = ( numero: number ) => String ( numero ).padStart ( 2, '0' );

// Padrão brasileiro DD-MM-AAAA, sempre a partir dos componentes UTC do valor (nunca
// do fuso do navegador) — consistente com o Backend, que grava/retorna tudo em UTC
// (colunas TIMESTAMPTZ, respostas ISO 8601 com sufixo "Z").
export const formatarData = ( iso: string ) =>
{
  const data = new Date ( iso );

  return `${ doisDigitos ( data.getUTCDate() ) }-${ doisDigitos ( data.getUTCMonth() + 1 ) }-${ data.getUTCFullYear() }`;
};

// Mesmo padrão de formatarData, acrescido do horário (UTC) — usado nos campos onde a
// hora do dia é informação relevante (ex.: emissão/vencimento de Contas a Pagar/Receber).
export const formatarDataHora = ( iso: string ) =>
{
  const data = new Date ( iso );

  return `${ formatarData ( iso ) } ${ doisDigitos ( data.getUTCHours() ) }:${ doisDigitos ( data.getUTCMinutes() ) }`;
};

// Constrói o valor aceito por <input type="datetime-local"> ("AAAA-MM-DDTHH:mm") a
// partir dos componentes UTC da data — o widget do navegador sempre exibe/edita como
// se fosse horário local, então "mentimos" os componentes (UTC no lugar de local) para
// que os dígitos mostrados ao usuário sejam sempre o horário UTC, igual ao que o
// Backend grava e retorna. Ver doInputUtcParaIso, que desfaz essa conversão no envio.
export const paraDataHoraInputUtc = ( data: Date ) =>
  `${ data.getUTCFullYear() }-${ doisDigitos ( data.getUTCMonth() + 1 ) }-${ doisDigitos ( data.getUTCDate() ) }`
  + `T${ doisDigitos ( data.getUTCHours() ) }:${ doisDigitos ( data.getUTCMinutes() ) }`;

// Mesma data, com o horário ajustado para o fim do dia em UTC (23:59) — usado como
// vencimento padrão ao abrir o formulário de criação de uma conta.
export const fimDoDiaUtc = ( data: Date ) =>
{
  const resultado = new Date ( data );
  resultado.setUTCHours ( 23, 59, 0, 0 );

  return resultado;
};

// Desfaz paraDataHoraInputUtc: o valor de um <input type="datetime-local"> cujos
// dígitos representam um horário UTC vira uma string ISO 8601 inequívoca, pronta para
// envio à API (o Backend só entende UTC/fuso explícito — ver validarDatas nos schemas
// de contas-pagamento/contas-receber).
export const doInputUtcParaIso = ( valor: string ) => `${ valor }:00.000Z`;
