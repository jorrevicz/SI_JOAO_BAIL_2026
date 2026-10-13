// Parcela na lista local do formulário (RN023): valores como texto do input. O vencimento
// usa o formato do <input type="datetime-local"> com os dígitos em UTC.
export interface ParcelaLocal
{
  numParcela:    number;
  codFormaDePag: string;
  valor:         string;
  dtVencimento:  string;
}

export const emCentavos = ( valor: string ) => Math.round ( Number ( valor || 0 ) * 100 );

// Soma exibida ao vivo e usada para bloquear o "Salvar" (mesmo padrão de Condição de
// Pagamento × Parcelas); a conferência definitiva é do Backend.
export const somaParcelasEmCentavos = ( parcelas: ParcelaLocal[] ) =>
  parcelas.reduce ( ( soma, parcela ) => soma + emCentavos ( parcela.valor ), 0 );
