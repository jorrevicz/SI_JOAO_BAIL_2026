import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';
import { criarCompraDeTeste, type CompraDeTeste } from '../helpers/fixtures';

const BASE = '/api/compras';

describe ( 'Compras routes', () =>
{
    let compra: CompraDeTeste;

    // As rotas usam o cliente `sql` da aplicação, fora de qualquer transação de teste —
    // por isso a compra é criada numa transação comitada e removida no afterAll.
    beforeAll ( async () =>
    {
        compra = await sql.begin ( ( transaction ) =>
            criarCompraDeTeste ( transaction, { numero: '080000001', modelo: '55', serie: '01' } )
        ) as unknown as CompraDeTeste;
    });

    afterAll ( async () =>
    {
        const [ fornecedor ] = await sql < { codCidade: number }[] >`
            SELECT "codCidade" FROM "Fornecedores" WHERE "codForn" = ${ compra.codForn }
        `;
        const [ cidade ] = await sql < { codEstado: number }[] >`
            SELECT "codEstado" FROM "Cidades" WHERE "codCidade" = ${ fornecedor.codCidade }
        `;
        const [ estado ] = await sql < { codPais: number }[] >`
            SELECT "codPais" FROM "Estados" WHERE "codEstado" = ${ cidade.codEstado }
        `;

        await sql`
            DELETE FROM "CompraParcelas"
            WHERE ( "numero", "modelo", "serie" ) IN
                  ( SELECT "numero", "modelo", "serie" FROM "Compras" WHERE "codForn" = ${ compra.codForn } )
        `;
        await sql`
            DELETE FROM "CompraProduto"
            WHERE ( "numero", "modelo", "serie" ) IN
                  ( SELECT "numero", "modelo", "serie" FROM "Compras" WHERE "codForn" = ${ compra.codForn } )
        `;
        await sql`DELETE FROM "Compras"             WHERE "codForn"      = ${ compra.codForn }`;
        // Conta a pagar criada no ciclo completo — removida pela chave primária completa.
        await sql`
            DELETE FROM "ContasAPagar"
            WHERE "numero"        = '080000002'
            AND   "modelo"        = '55'
            AND   "serie"         = '01'
            AND   "codFornecedor" = ${ compra.codForn }
            AND   "parcela"       = 1
        `;
        await sql`DELETE FROM "FormaDePagamento"    WHERE "codFormaDePag" = ${ compra.codFormaDePag }`;
        await sql`DELETE FROM "Produtos"            WHERE "codProd"      = ${ compra.codProduto }`;
        await sql`DELETE FROM "Fornecedores"        WHERE "codForn"      = ${ compra.codForn }`;
        await sql`DELETE FROM "CondicaoDePagamento" WHERE "codCondDePag" = ${ compra.codCondDePag }`;
        await sql`DELETE FROM "Cidades"             WHERE "codCidade"    = ${ fornecedor.codCidade }`;
        await sql`DELETE FROM "Estados"             WHERE "codEstado"    = ${ cidade.codEstado }`;
        await sql`DELETE FROM "Paises"               WHERE "codPais"                = ${ estado.codPais }`;

        await sql.end();
    });

    it ( 'GET /api/compras retorna 200 e a compra com o nome do fornecedor', async () =>
    {
        const res = await request ( app ).get ( BASE ).query ( { codForn: compra.codForn } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toHaveLength ( 1 );
        expect ( res.body[ 0 ] ).toMatchObject
        ({
            numero:     '080000001',
            modelo:     '55',
            serie:      '01',
            fornecedor: 'FORNECEDOR DE TESTE',
            vlrTotal:   '210.00',
        });
    });

    it ( 'GET /api/compras/:numero/:modelo/:serie retorna o cabeçalho com os itens', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/080000001/55/01/${ compra.codForn }` );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toMatchObject
        ({
            numero:            '080000001',
            fornecedor:        'FORNECEDOR DE TESTE',
            condicaoPagamento: 'CONDIÇÃO DE TESTE',
            transportadora:    null,
            frete:             '5.00',
            seguro:            '3.00',
            despesas:          '2.00',
            dtEmissao:         '2026-09-01T10:00:00.000Z',
            dtChegada:         '2026-09-02T10:00:00.000Z',
            dtEntrada:         '2026-09-02T10:00:00.000Z',
        });
        expect ( res.body.itens ).toHaveLength ( 1 );
        expect ( res.body.itens[ 0 ] ).toMatchObject
        ({
            codProduto:        compra.codProduto,
            produto:           'PRODUTO COMPRA 080000001',
            quantidade:        2,
            valorUnitario:     '100.00',
            valorRateio:       '10.00',
            custoMedioProduto: '105.000000',
        });
    });

    it ( 'GET /api/compras/:numero/:modelo/:serie inexistente retorna 404', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/099999999/99/99/${ compra.codForn }` );

        expect ( res.status ).toBe ( 404 );
        expect ( res.body ).toEqual ( { mensagem: 'Compra não encontrada.' } );
    });

    it ( 'GET /api/compras/validar com formato inválido retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query ( { numero: '1', modelo: 'ab', serie: '01', codForn: compra.codForn } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
        expect ( res.body.erros ).toHaveProperty ( 'modelo' );
    });

    it ( 'GET /api/compras/validar com documento inédito retorna 200 (RN007)', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query ( { numero: '080000999', modelo: '55', serie: '01', codForn: compra.codForn } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual ( { valido: true } );
    });

    it ( 'GET /api/compras/validar sem o fornecedor retorna 400 com erro no campo codForn', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query ( { numero: '080000999', modelo: '55', serie: '01' } );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'codForn' );
    });

    it ( 'GET /api/compras/validar com o mesmo número de outro fornecedor retorna 200 (a chave inclui o fornecedor)', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query
        ( {
            numero: '080000001', modelo: '55', serie: '01', codForn: compra.codForn + 1_000_000,
        } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toEqual ( { valido: true } );
    });

    it ( 'GET /api/compras/validar com documento já cadastrado retorna 409 (RN007)', async () =>
    {
        const res = await request ( app ).get ( `${ BASE }/validar` ).query ( { numero: '080000001', modelo: '55', serie: '01', codForn: compra.codForn } );

        expect ( res.status ).toBe ( 409 );
        expect ( res.body ).toEqual ( { mensagem: 'Já existe um documento cadastrado com este número, modelo e série.' } );
    });

    // ------------------------------------------------------------------
    // Cadastro (já lançado) e cancelamento
    // ------------------------------------------------------------------

    const UM_DIA = 24 * 60 * 60 * 1000;

    function NovaCompra ( numero: string, sobrescrever: Record < string, unknown > = {} )
    {
        return {
            numero,
            modelo:       '55',
            serie:        '01',
            codForn:      compra.codForn,
            codCondDePag: compra.codCondDePag,
            dtEmissao:    new Date ( Date.now() - 2 * UM_DIA ).toISOString(),
            dtChegada:    new Date ( Date.now() - UM_DIA ).toISOString(),
            frete:        '0.00',
            seguro:       '0.00',
            despesas:     '0.00',
            itens:        [ { codProduto: compra.codProduto, quantidade: 3, valorUnitario: '50.00', desconto: '0.00', unidade: 'CX' } ],
            // RN023 — uma parcela que fecha no vlrTotal (3 × 50,00 = 150,00)
            parcelas:
            [
                {
                    numParcela:    1,
                    codFormaDePag: compra.codFormaDePag,
                    valor:         '150.00',
                    dtVencimento:  new Date ( Date.now() + 10 * UM_DIA ).toISOString(),
                },
            ],
            ...sobrescrever,
        };
    }

    async function EstoqueDoProduto ()
    {
        const res = await request ( app ).get ( `/api/produtos/${ compra.codProduto }` );

        return { estoque: res.body.estoque, custoMedioProd: res.body.custoMedioProd };
    }

    it ( 'POST /api/compras/calculo devolve a prévia dos totais calculada pelo Backend', async () =>
    {
        const res = await request ( app )
            .post ( `${ BASE }/calculo` )
            .send
            ({
                frete: '10.00', seguro: '0.00', despesas: '0.00',
                itens: [ { codProduto: compra.codProduto, quantidade: 2, valorUnitario: '100.00', desconto: '0.00' } ],
            });

        expect ( res.status ).toBe ( 200 );
        expect ( res.body ).toMatchObject ( { totalProdutos: '200.00', vlrTotal: '210.00' } );
        expect ( res.body.itens[ 0 ] ).toMatchObject
        ({
            valorRateio: '10.00', custoMedioProduto: '105.000000', estoqueResultante: 2, precoVenda: '10.00',
        });
    });

    it ( 'POST /api/compras com payload vazio retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).post ( BASE ).send ( {} );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'numero' );
        expect ( res.body.erros ).toHaveProperty ( 'codForn' );
        expect ( res.body.erros ).toHaveProperty ( 'itens' );
        expect ( res.body.erros ).toHaveProperty ( 'parcelas' );
    });

    it ( 'POST /api/compras com chegada anterior à emissão retorna 400 (RN004)', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send ( NovaCompra ( '080000010', { dtChegada: new Date ( Date.now() - 3 * UM_DIA ).toISOString() } ) );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros.dtChegada ).toBe ( 'A data de chegada não pode ser anterior à data de emissão.' );
    });

    it ( 'POST /api/compras com desconto igual ao valor do item retorna 400 (RN016)', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send
            (
                NovaCompra
                (
                    '080000010',
                    { itens: [ { codProduto: compra.codProduto, quantidade: 1, valorUnitario: '50.00', desconto: '50.00' } ] }
                )
            );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'itens' );
    });

    it ( 'POST /api/compras/parcelas gera as parcelas da condição sobre o total calculado (RN022)', async () =>
    {
        const [ parcelaCondicao ] = await sql < { codFormaDePag: number }[] >`
            INSERT INTO "Parcelas" ( "codCondDePag", "numParcela", "codFormaDePag", "percentual", "numDias", "codUser" )
            VALUES ( ${ compra.codCondDePag }, 99, ${ compra.codFormaDePag }, 100, 30, 1 )
            RETURNING "codFormaDePag"
        `;

        try
        {
            const emissao = '2026-09-20T10:00:00.000Z';

            const res = await request ( app )
                .post ( `${ BASE }/parcelas` )
                .send
                ({
                    codCondDePag: compra.codCondDePag,
                    dtEmissao:    emissao,
                    frete:        '0.00',
                    seguro:       '0.00',
                    despesas:     '0.00',
                    itens:        [ { codProduto: compra.codProduto, quantidade: 3, valorUnitario: '50.00', desconto: '0.00' } ],
                });

            expect ( res.status ).toBe ( 200 );
            expect ( res.body.vlrTotal ).toBe ( '150.00' );
            expect ( res.body.parcelas ).toContainEqual
            ({
                numParcela:    99,
                codFormaDePag: parcelaCondicao.codFormaDePag,
                valor:         '150.00',
                dtVencimento:  '2026-10-20T10:00:00.000Z',
            });
        }
        finally
        {
            await sql`DELETE FROM "Parcelas" WHERE "codCondDePag" = ${ compra.codCondDePag } AND "numParcela" = 99`;
        }
    });

    it ( 'POST /api/compras/parcelas com payload vazio retorna 400 com erros por campo', async () =>
    {
        const res = await request ( app ).post ( `${ BASE }/parcelas` ).send ( {} );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'codCondDePag' );
        expect ( res.body.erros ).toHaveProperty ( 'itens' );
    });

    it ( 'POST /api/compras com soma das parcelas diferente do total retorna 400 (RN023)', async () =>
    {
        const res = await request ( app )
            .post ( BASE )
            .send
            (
                NovaCompra
                (
                    '080000011',
                    { parcelas: [ { numParcela: 1, codFormaDePag: compra.codFormaDePag, valor: '10.00', dtVencimento: new Date ( Date.now() + UM_DIA ).toISOString() } ] }
                )
            );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.mensagem ).toContain ( 'soma das parcelas' );
    });

    it ( 'POST /api/compras com vencimentos fora de ordem retorna 400 (RN023)', async () =>
    {
        const vencimento = ( dias: number ) => new Date ( Date.now() + dias * UM_DIA ).toISOString();

        const res = await request ( app )
            .post ( BASE )
            .send
            (
                NovaCompra
                (
                    '080000012',
                    {
                        parcelas:
                        [
                            { numParcela: 1, codFormaDePag: compra.codFormaDePag, valor: '75.00', dtVencimento: vencimento ( 30 ) },
                            { numParcela: 2, codFormaDePag: compra.codFormaDePag, valor: '75.00', dtVencimento: vencimento ( 10 ) },
                        ],
                    }
                )
            );

        expect ( res.status ).toBe ( 400 );
        expect ( res.body.erros ).toHaveProperty ( 'parcelas' );
    });

    it ( 'ciclo completo: cria já lançada (estoque/custo) e cancela (estorno)', async () =>
    {
        const antes = await EstoqueDoProduto();

        const criada = await request ( app ).post ( BASE ).send ( NovaCompra ( '080000002', { frete: '6.00', parcelas: [ { numParcela: 1, codFormaDePag: compra.codFormaDePag, valor: '156.00', dtVencimento: new Date ( Date.now() + 10 * UM_DIA ).toISOString() } ] } ) );

        expect ( criada.status ).toBe ( 201 );
        expect ( criada.body ).toMatchObject ( { numero: '080000002', vlrTotal: '156.00' } );
        expect ( criada.body ).not.toHaveProperty ( 'situacao' );
        expect ( criada.body.dtEntrada ).not.toBeNull();
        expect ( criada.body.itens[ 0 ] ).toMatchObject ( { quantidade: 3, valorRateio: '6.00', custoMedioProduto: '52.000000', unidade: 'CX' } );
        expect ( criada.body.parcelas ).toHaveLength ( 1 );
        expect ( criada.body.parcelas[ 0 ] ).toMatchObject ( { numParcela: 1, valor: '156.00' } );

        // O cadastro já dá entrada no estoque e no custo médio.
        expect ( await EstoqueDoProduto() ).toEqual ( { estoque: antes.estoque + 3, custoMedioProd: '52.000000' } );

        const duplicada = await request ( app ).post ( BASE ).send ( NovaCompra ( '080000002' ) );
        expect ( duplicada.status ).toBe ( 409 );

        // Sem rascunho: não existem rotas de edição, lançamento nem exclusão.
        const id = `${ BASE }/080000002/55/01/${ compra.codForn }`;

        expect ( ( await request ( app ).put ( id ).send ( NovaCompra ( '080000002' ) ) ).status ).toBe ( 404 );
        expect ( ( await request ( app ).patch ( `${ id }/lancar` ) ).status ).toBe ( 404 );
        expect ( ( await request ( app ).delete ( id ) ).status ).toBe ( 404 );

        // Conta a pagar do mesmo documento: só cai junto com a compra.
        const contaId = `/api/contas-pagamento/080000002/55/01/${ compra.codForn }/1`;
        const conta   = await request ( app )
            .post ( '/api/contas-pagamento' )
            .send ({
                numero: '080000002', modelo: '55', serie: '01', parcela: 1,
                codFornecedor: compra.codForn, codFormaDePag: compra.codFormaDePag,
                dtEmissao: '2026-01-01T10:00:00.000Z', dtVencimento: '2026-01-10T10:00:00.000Z',
                valor: '156.00', juro: '0.00', desconto: '0.00', multa: '0.00',
                valorBaixa: '156.00', dtBaixa: '2026-01-11',
            });
        expect ( conta.status ).toBe ( 201 );

        const semJustificativa = await request ( app ).patch ( `${ id }/cancelar` ).send ( {} );
        expect ( semJustificativa.status ).toBe ( 400 );
        expect ( semJustificativa.body.erros ).toHaveProperty ( 'justificativaCancelamento' );

        const cancelada = await request ( app )
            .patch ( `${ id }/cancelar` )
            .send ( { justificativaCancelamento: 'Mercadoria devolvida ao fornecedor' } );

        expect ( cancelada.status ).toBe ( 200 );
        expect ( cancelada.body.justificativaCancelamento ).toBe ( 'Mercadoria devolvida ao fornecedor' );
        expect ( cancelada.body.isActive ).toBe ( false );
        expect ( await EstoqueDoProduto() ).toEqual ( { estoque: antes.estoque, custoMedioProd: '0.000000' } );

        const contaCancelada = await request ( app ).get ( contaId );
        expect ( contaCancelada.body ).toMatchObject
        (
            { justificativaCancelamento: 'Mercadoria devolvida ao fornecedor', isActive: false }
        );

        const recancelada = await request ( app )
            .patch ( `${ id }/cancelar` )
            .send ( { justificativaCancelamento: 'De novo' } );
        expect ( recancelada.status ).toBe ( 409 );
    });
});
