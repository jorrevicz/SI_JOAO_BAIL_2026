import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import sql from '../../lib/db';

// Rotas reais (sem rollback). Identificadores fixos para os cadastros de apoio,
// limpos antes e depois do ciclo completo de execução/aprovação/substituição de
// peças de uma OS (Lote OS-B). O `numOdS` é gerado pelo banco a cada execução —
// não há mais valor fixo a limpar antes da criação.
const PAIS_TESTE   = { pais: 'Teste', sigla: 'TE', ddi: '902', moeda: 'BRL' };
const CARGO_TESTE  = { cargo: 'Téc. ExecTst' };

describe ( 'Ordens de Serviço routes — execução/aprovação (Lote OS-B)', () =>
{
    let numOdS:         number;
    let codCidade:      number;
    let codCargo:       number;
    let codCliente:     number;
    let codFuncionario: number;
    let codServico:     number;
    let codPeca:        number;
    let codPecaReprovada: number;

    beforeAll ( async () =>
    {
        await sql`DELETE FROM "Servicos" WHERE "servico" = 'Formatação ExecTst'`;
        await sql`DELETE FROM "Pecas" WHERE "peca" IN ( 'Placa ExecTst', 'Placa ExecTst Rep' )`;
        await sql`DELETE FROM "Funcionarios" WHERE "funcFone" = '19933333333'`;
        await sql`DELETE FROM "Cargos" WHERE "cargo" = ${ CARGO_TESTE.cargo }`;
        await sql`DELETE FROM "Clientes" WHERE "cliente" = 'Cliente ExecTst'`;
        await sql`DELETE FROM "Cidades" WHERE "cidade" = 'Campinas ExecTst'`;
        await sql`DELETE FROM "Estados" WHERE "estado" = 'SP ExecTst'`;
        await sql`DELETE FROM "Paises" WHERE "sigla" = ${ PAIS_TESTE.sigla }`;

        const pais = await request ( app ).post ( '/api/paises' ).send ( PAIS_TESTE );
        const estado = await request ( app )
            .post ( '/api/estados' )
            .send ( { codPais: pais.body.codPais, uf: 'SP', estado: 'SP ExecTst' } );
        const cidade = await request ( app )
            .post ( '/api/cidades' )
            .send ( { codEstado: estado.body.codEstado, cidade: 'Campinas ExecTst', ddd: '19' } );
        const cargo = await request ( app ).post ( '/api/cargos' ).send ( CARGO_TESTE );
        const funcionario = await request ( app )
            .post ( '/api/funcionarios' )
            .send ( { codCidade: cidade.body.codCidade, codCargo: cargo.body.codCargo, funcionario: 'Ana Silva', funcFone: '19933333333' } );
        const servico = await request ( app )
            .post ( '/api/servicos' )
            .send ( { servico: 'Formatação ExecTst', valor: '150.00', codFuncionario: funcionario.body.codFuncionario } );
        const peca = await request ( app ).post ( '/api/pecas' ).send ( { peca: 'Placa ExecTst' } );
        const pecaReprovada = await request ( app ).post ( '/api/pecas' ).send ( { peca: 'Placa ExecTst Rep' } );
        const cliente = await request ( app )
            .post ( '/api/clientes' )
            .send
            ({
                tipoPessoa: 'FISICA', cliente: 'Cliente ExecTst', codCidade: cidade.body.codCidade,
                enderecoCl: 'Rua X', bairroCl: 'Centro', cepCl: '13000000', cpfCnpjCl: '12345678901', inscEstCl: '123456', foneCl: '19999999999',
                email: 'exec@kaneko.com.br', dtNascimento: '1990-01-01', genero: 'OUTRO',
            });

        codCidade      = cidade.body.codCidade;
        codCargo       = cargo.body.codCargo;
        codFuncionario = funcionario.body.codFuncionario;
        codServico     = servico.body.codServico;
        codPeca          = peca.body.codPeca;
        codPecaReprovada = pecaReprovada.body.codPeca;
        codCliente     = cliente.body.codCliente;

        const ordemServico = await request ( app )
            .post ( '/api/ordens-servico' )
            .send
            ({
                codCliente, atendente: 'Ana', defeito: 'Não liga', tipoOdS: 'Garantia',
                aparelho: { modelo: 'Inspiron 15', voltagem: 'Bivolt', garantia: '12 meses' },
                equipamento: {
                    equipamento: 'Notebook Dell', soEq: 'Win11', socketEq: 'BGA', memoriaRam: '8GB',
                    tipoOffice: '2021', placaMae: 'Dell', bios: '1.2.0', capacidadeRam: '8GB',
                    possuiSSD: true, possuiHD: false, capacidadeArmz: '256GB', usoArmz: '50%',
                },
            });

        numOdS = ordemServico.body.numOdS;
    });

    afterAll ( async () =>
    {
        await sql`DELETE FROM "SubstituirPecasOdS" WHERE "numOdS" = ${ numOdS }`;
        await sql`DELETE FROM "OrcamentoPecasOdS" WHERE "numOdS" = ${ numOdS }`;
        await sql`DELETE FROM "ServicosOdS" WHERE "numOdS" = ${ numOdS }`;
        await sql`DELETE FROM "OrdemDeServicos" WHERE "numOdS" = ${ numOdS }`;
        await sql`DELETE FROM "Servicos" WHERE "codServico" = ${ codServico }`;
        await sql`DELETE FROM "Pecas" WHERE "codPeca" IN ( ${ codPeca }, ${ codPecaReprovada } )`;
        await sql`DELETE FROM "Clientes" WHERE "codCliente" = ${ codCliente }`;
        await sql`DELETE FROM "Funcionarios" WHERE "codFuncionario" = ${ codFuncionario }`;
        await sql`DELETE FROM "Cargos" WHERE "codCargo" = ${ codCargo }`;
        await sql`DELETE FROM "Cidades" WHERE "codCidade" = ${ codCidade }`;

        await sql.end();
    });

    it ( 'a OS nasce com situacao=Aberta', async () =>
    {
        const res = await request ( app ).get ( `/api/ordens-servico/${ numOdS }` );
        expect ( res.status ).toBe ( 200 );
        expect ( res.body.situacao ).toBe ( 'Aberta' );
    });

    it ( 'PATCH .../diagnostico reconcilia o orçamento de peças e avança a situação', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ numOdS }/diagnostico` )
            .send
            ({
                historicoManutencao: null,
                procedimentos:  [],
                orcamentoPecas: [ { codPeca, vlrPv: '89.90' }, { codPeca: codPecaReprovada, vlrPv: '40.00' } ],
            });

        expect ( res.status ).toBe ( 200 );
        expect ( res.body.orcamentoPecas ).toHaveLength ( 2 );
        expect ( res.body.orcamentoPecas.every ( ( item: { aprovado: boolean } ) => item.aprovado === false ) ).toBe ( true );
        expect ( res.body.situacao ).toBe ( 'Aguardando aprovação' );
    });

    it ( 'PATCH .../orcamento-pecas/:codPeca/reprovar remove o item do orçamento ativo', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ numOdS }/orcamento-pecas/${ codPecaReprovada }/reprovar` );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body.orcamentoPecas ).toHaveLength ( 1 );
        expect ( res.body.orcamentoPecas[ 0 ].codPeca ).toBe ( codPeca );
    });

    it ( 'PATCH .../substituicao-pecas bloqueia peça sem orçamento aprovado (409)', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ numOdS }/substituicao-pecas` )
            .send ( { pecas: [ { codPeca, qtdPeca: 1, vlrUnitarioPeca: 90 } ] } );

        expect ( res.status ).toBe ( 409 );
    });

    it ( 'PATCH .../orcamento-pecas/:codPeca/aprovar aprova o item e volta a Em execução', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ numOdS }/orcamento-pecas/${ codPeca }/aprovar` );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body.orcamentoPecas[ 0 ].aprovado ).toBe ( true );
        expect ( res.body.situacao ).toBe ( 'Em execução' );
    });

    it ( 'PATCH .../execucao reconcilia serviços e registra as observações técnicas', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ numOdS }/execucao` )
            .send ( { servicos: [ { codServico, qtdServico: 1 } ], obsTecnica: 'Placa-mãe trocada' } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body.servicos ).toHaveLength ( 1 );
        expect ( res.body.obsTecnica ).toBe ( 'Placa-mãe trocada' );
    });

    it ( 'PATCH .../substituicao-pecas registra a peça já aprovada', async () =>
    {
        const res = await request ( app )
            .patch ( `/api/ordens-servico/${ numOdS }/substituicao-pecas` )
            .send ( { pecas: [ { codPeca, qtdPeca: 1, vlrUnitarioPeca: 95 } ] } );

        expect ( res.status ).toBe ( 200 );
        expect ( res.body.substituicaoPecas ).toHaveLength ( 1 );
        expect ( res.body.substituicaoPecas[ 0 ].vlrUnitarioPeca ).toBe ( 95 );
    });
});
