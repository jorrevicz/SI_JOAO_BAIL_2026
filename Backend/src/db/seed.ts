import 'dotenv/config';
import sql from '../lib/db';

// ============================================================
// T-021 — Seed geográfico
// Ordem de dependência: Paises → Estados → Cidades
// ============================================================

const BRASIL = { pais: 'BRASIL', sigla: 'BRA', ddi: '+55', moeda: 'BRL' };

const ESTADOS = [
  { uf: 'AC', estado: 'ACRE' },
  { uf: 'AL', estado: 'ALAGOAS' },
  { uf: 'AP', estado: 'AMAPÁ' },
  { uf: 'AM', estado: 'AMAZONAS' },
  { uf: 'BA', estado: 'BAHIA' },
  { uf: 'CE', estado: 'CEARÁ' },
  { uf: 'DF', estado: 'DISTRITO FEDERAL' },
  { uf: 'ES', estado: 'ESPÍRITO SANTO' },
  { uf: 'GO', estado: 'GOIÁS' },
  { uf: 'MA', estado: 'MARANHÃO' },
  { uf: 'MT', estado: 'MATO GROSSO' },
  { uf: 'MS', estado: 'MATO GROSSO DO SUL' },
  { uf: 'MG', estado: 'MINAS GERAIS' },
  { uf: 'PA', estado: 'PARÁ' },
  { uf: 'PB', estado: 'PARAÍBA' },
  { uf: 'PR', estado: 'PARANÁ' },
  { uf: 'PE', estado: 'PERNAMBUCO' },
  { uf: 'PI', estado: 'PIAUÍ' },
  { uf: 'RJ', estado: 'RIO DE JANEIRO' },
  { uf: 'RN', estado: 'RIO GRANDE DO NORTE' },
  { uf: 'RS', estado: 'RIO GRANDE DO SUL' },
  { uf: 'RO', estado: 'RONDÔNIA' },
  { uf: 'RR', estado: 'RORAIMA' },
  { uf: 'SC', estado: 'SANTA CATARINA' },
  { uf: 'SP', estado: 'SÃO PAULO' },
  { uf: 'SE', estado: 'SERGIPE' },
  { uf: 'TO', estado: 'TOCANTINS' },
];

// Amostra representativa de cidades por UF (com DDD)
const CIDADES_POR_UF: Record < string, { cidade: string; ddd: string }[]> = {
  SP: [
    { cidade: 'SÃO PAULO',      ddd: '11' },
    { cidade: 'CAMPINAS',       ddd: '19' },
    { cidade: 'RIBEIRÃO PRETO', ddd: '16' },
    { cidade: 'SANTOS',         ddd: '13' },
  ],
  RJ: [
    { cidade: 'RIO DE JANEIRO', ddd: '21' },
    { cidade: 'NITERÓI',        ddd: '21' },
    { cidade: 'PETRÓPOLIS',     ddd: '24' },
  ],
  MG: [
    { cidade: 'BELO HORIZONTE', ddd: '31' },
    { cidade: 'UBERLÂNDIA',     ddd: '34' },
    { cidade: 'CONTAGEM',       ddd: '31' },
  ],
  RS: [
    { cidade: 'PORTO ALEGRE',   ddd: '51' },
    { cidade: 'CAXIAS DO SUL',  ddd: '54' },
    { cidade: 'PELOTAS',        ddd: '53' },
  ],
  PR: [
    { cidade: 'CURITIBA',  ddd: '41' },
    { cidade: 'LONDRINA',  ddd: '43' },
    { cidade: 'MARINGÁ',   ddd: '44' },
  ],
  SC: [
    { cidade: 'FLORIANÓPOLIS', ddd: '48' },
    { cidade: 'JOINVILLE',     ddd: '47' },
    { cidade: 'BLUMENAU',      ddd: '47' },
  ],
  BA: [
    { cidade: 'SALVADOR',             ddd: '71' },
    { cidade: 'FEIRA DE SANTANA',     ddd: '75' },
    { cidade: 'VITÓRIA DA CONQUISTA', ddd: '77' },
  ],
  PE: [
    { cidade: 'RECIFE',  ddd: '81' },
    { cidade: 'CARUARU', ddd: '81' },
    { cidade: 'OLINDA',  ddd: '81' },
  ],
  CE: [
    { cidade: 'FORTALEZA',         ddd: '85' },
    { cidade: 'CAUCAIA',           ddd: '85' },
    { cidade: 'JUAZEIRO DO NORTE', ddd: '88' },
  ],
  GO: [
    { cidade: 'GOIÂNIA',              ddd: '62' },
    { cidade: 'APARECIDA DE GOIÂNIA', ddd: '62' },
    { cidade: 'ANÁPOLIS',             ddd: '62' },
  ],
  DF: [{ cidade: 'BRASÍLIA', ddd: '61' }],
  AM: [
    { cidade: 'MANAUS',    ddd: '92' },
    { cidade: 'PARINTINS', ddd: '92' },
  ],
  PA: [
    { cidade: 'BELÉM',       ddd: '91' },
    { cidade: 'ANANINDEUA',  ddd: '91' },
  ],
};

// ============================================================
// T-022 — Seed de catálogo e parceiros
// Ordem: Categorias → Produtos → Fornecedores →
//        CondicaoDePagamento → Clientes → Veiculos → Transportadoras
// Nota: NCM_SH removido do escopo do projeto
// ============================================================

const CATEGORIAS_LISTA = [
  { categoria: 'NOTEBOOKS E ULTRABOOKS' },
  { categoria: 'DESKTOPS E WORKSTATIONS' },
  { categoria: 'PERIFÉRICOS' },
  { categoria: 'COMPONENTES' },
  { categoria: 'CABOS E ACESSÓRIOS' },
  { categoria: 'SOFTWARE E LICENÇAS' },
];

// Domínio fechado da classificação de propósito da compra (RN005) — os três valores
// são fixos e sustentam regra de negócio; não se confundem com "Categorias", que é a
// taxonomia aberta do catálogo de produtos.
const CLASSIFICACOES_COMPRA = [ 'obra-prima', 'revenda', 'serviços' ];

async function seedGeografico(): Promise < Record < string, number > > {
  // Paises tem unique index em sigla — usa ON CONFLICT
  const [brasil] = await sql`
    INSERT INTO "Paises" ( "pais", "sigla", "ddi", "moeda" )
    VALUES ( ${ BRASIL.pais }, ${ BRASIL.sigla }, ${ BRASIL.ddi }, ${ BRASIL.moeda } )
    ON CONFLICT ( "sigla" ) DO UPDATE SET "pais" = EXCLUDED."pais"
    RETURNING "codPais"
  `;
  const codPais: number = brasil.codPais;

  const estadoMap: Record < string, number > = {};
  for ( const est of ESTADOS )
  {
    const existing = await sql`
      SELECT "codEstado" FROM "Estados"
      WHERE "uf" = ${ est.uf } AND "codPais" = ${ codPais }
      LIMIT 1
    `;
    if ( existing.length > 0 )
    {
      estadoMap [ est.uf ] = existing [ 0 ].codEstado;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "Estados" ( "codPais", "uf", "estado" )
        VALUES (${ codPais }, ${ est.uf }, ${ est.estado })
        RETURNING "codEstado"
      `;
      estadoMap[ est.uf ] = inserted.codEstado;
    }
  }

  for (const [ uf, cidades ] of Object.entries( CIDADES_POR_UF ))
  {
    const codEstado = estadoMap[ uf ];
    if ( !codEstado ) continue;
    for (const { cidade, ddd } of cidades)
    {
      const existing = await sql`
        SELECT "codCidade" FROM "Cidades"
        WHERE "cidade" = ${ cidade } AND "codEstado" = ${ codEstado }
        LIMIT 1
      `;
      if ( existing.length === 0 )
      {
        await sql`
          INSERT INTO "Cidades" ( "codEstado", "cidade", "ddd" )
          VALUES ( ${ codEstado }, ${ cidade }, ${ ddd } )
        `;
      }
    }
  }

  return estadoMap;
}

async function seedClassificacoesCompra(): Promise < void >
{
  for ( const classificacao of CLASSIFICACOES_COMPRA )
  {
    await sql`
      INSERT INTO "ClassificacoesCompra" ( "classificacaoCompra" )
      VALUES ( ${ classificacao } )
      ON CONFLICT ( "classificacaoCompra" ) DO NOTHING
    `;
  }
}

async function seedCatalogo ( estadoMap: Record < string, number > ): Promise < Record < string, number > >
{
  const catMap: Record < string, number > = {};
  for (const cat of CATEGORIAS_LISTA)
  {
    const existing = await sql`
      SELECT "codCategoria" FROM "Categorias"
      WHERE "categoria" = ${ cat.categoria }
      LIMIT 1
    `;
    if ( existing.length > 0 )
    {
      catMap [ cat.categoria ] = existing [ 0 ].codCategoria;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "Categorias" ( "categoria" )
        VALUES ( ${ cat.categoria } )
        RETURNING "codCategoria"
      `;
      catMap [ cat.categoria ] = inserted.codCategoria;
    }
  }

  const produtos = [
    {
      produto:        'NOTEBOOK DELL INSPIRON 15 CORE I5 16GB 512GB SSD',
      undProduto:     'UN',
      codCategoria:   catMap [ 'NOTEBOOKS E ULTRABOOKS' ],
      pesoBruto:      '2.500',
      pesoLiq:        '2.100',
      saldoProd:      '15.000',
      custoMedioProd: '3200.00',
      estoque:        15,
    },
    {
      produto:        'DESKTOP POSITIVO MASTER D570 CORE I3 8GB 240GB SSD',
      undProduto:     'UN',
      codCategoria:   catMap [ 'DESKTOPS E WORKSTATIONS' ],
      pesoBruto:      '6.800',
      pesoLiq:        '5.900',
      saldoProd:      '8.000',
      custoMedioProd: '1950.00',
      estoque:        8,
    },
    {
      produto:        'MOUSE LOGITECH MX MASTER 3S SEM FIO',
      undProduto:     'UN',
      codCategoria:   catMap [ 'PERIFÉRICOS' ],
      pesoBruto:      '0.141',
      pesoLiq:        '0.100',
      saldoProd:      '25.000',
      custoMedioProd: '380.00',
      estoque:        25,
    },
    {
      produto:        'SSD KINGSTON A400 480GB SATA III',
      undProduto:     'UN',
      codCategoria:   catMap [ 'COMPONENTES' ],
      pesoBruto:      '0.070',
      pesoLiq:        '0.055',
      saldoProd:      '30.000',
      custoMedioProd: '210.00',
      estoque:        30,
    },
    {
      produto:        'CABO HDMI 2.0 4K 1,8M',
      undProduto:     'UN',
      codCategoria:   catMap [ 'CABOS E ACESSÓRIOS' ],
      pesoBruto:      '0.150',
      pesoLiq:        '0.120',
      saldoProd:      '50.000',
      custoMedioProd: '28.00',
      estoque:        50,
    },
  ];

  for ( const prod of produtos )
  {
    const existing = await sql`
      SELECT "codProd" FROM "Produtos"
      WHERE "produto" = ${ prod.produto }
      LIMIT 1
    `;

    let codProd: number;

    if ( existing.length > 0 )
    {
      codProd = existing [ 0 ].codProd;

      await sql`
        UPDATE "Produtos" SET
          "undProduto"     = ${ prod.undProduto },
          "pesoBruto"      = ${ prod.pesoBruto },
          "pesoLiq"        = ${ prod.pesoLiq },
          "saldoProd"      = ${ prod.saldoProd },
          "custoMedioProd" = ${ prod.custoMedioProd },
          "estoque"        = ${ prod.estoque }
        WHERE "codProd" = ${ codProd }
      `;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "Produtos"
          ( "produto", "undProduto", "pesoBruto", "pesoLiq",
           "saldoProd", "custoMedioProd", "estoque" )
        VALUES
          ( ${ prod.produto }, ${ prod.undProduto },
           ${ prod.pesoBruto }, ${ prod.pesoLiq }, ${ prod.saldoProd },
           ${ prod.custoMedioProd }, ${ prod.estoque } )
        RETURNING "codProd"
      `;

      codProd = inserted.codProd;
    }

    // Produto ↔ Categoria é N:N — o vínculo vive na associativa, não em "Produtos"
    await sql`
      INSERT INTO "ProdutoCategoria" ( "codProduto", "codCategoria" )
      VALUES ( ${ codProd }, ${ prod.codCategoria } )
      ON CONFLICT DO NOTHING
    `;
  }

  void estadoMap;
  return catMap;
}

async function seedParceiros( estadoMap: Record < string, number > ): Promise < void >
{
  const [ cidadeSP ]  = await sql`SELECT "codCidade" FROM "Cidades" WHERE "cidade" = 'SÃO PAULO'    LIMIT 1`;
  const [ cidadeRJ ]  = await sql`SELECT "codCidade" FROM "Cidades" WHERE "cidade" = 'RIO DE JANEIRO' LIMIT 1`;
  const [ cidadeCWB ] = await sql`SELECT "codCidade" FROM "Cidades" WHERE "cidade" = 'CURITIBA'     LIMIT 1`;

  if ( !cidadeSP || !cidadeRJ || !cidadeCWB )
  {
    throw new Error ( 'Cidades de referência não encontradas — rode seedGeografico primeiro.' );
  }

  // Condição de pagamento — precisa existir antes dos Fornecedores (FK obrigatória)
  let codCondDePag: number;
  const existCond = await sql`
    SELECT "codCondDePag" FROM "CondicaoDePagamento" WHERE "descricao" = 'À VISTA' LIMIT 1
  `;
  if ( existCond.length > 0 )
  {
    codCondDePag = existCond [ 0 ].codCondDePag;
  }
  else
  {
    const [ inserted ] = await sql`
      INSERT INTO "CondicaoDePagamento" ( "descricao", "juroCondPag", "multaCondPag", "descontoCondPag" )
      VALUES ( 'À VISTA', '0.00', '0.00', '0.00' )
      RETURNING "codCondDePag"
    `;
    codCondDePag = inserted.codCondDePag;
  }

  // Fornecedores — dados sem máscara (CPF/CNPJ, CEP, fone em dígitos puros)
  let forn1Cod: number;
  const existForn1 = await sql`
    SELECT "codForn" FROM "Fornecedores" WHERE "cpfCnpjForn" = '12345678000190' LIMIT 1
  `;
  if ( existForn1.length > 0 )
  {
    forn1Cod = existForn1 [ 0 ].codForn;
    await sql`
      UPDATE "Fornecedores" SET
        "fornecedor"     = 'TECHDISTRIB INFORMÁTICA LTDA',
        "nomeFantasia"   = 'TECHDISTRIB',
        "tipoPessoa"     = 'J',
        "codCidade"      = ${ cidadeSP.codCidade },
        "codCondDePag"   = ${ codCondDePag },
        "enderecoForn"   = 'AV. PAULISTA, 726',
        "bairroForn"     = 'BELA VISTA',
        "cepForn"        = '01310100',
        "foneForn"       = '551133331111',
        "inscEstSubTrib" = '111111111111'
      WHERE "codForn" = ${ forn1Cod }
    `;
  }
  else
  {
    const [ inserted ] = await sql`
      INSERT INTO "Fornecedores"
        ( "fornecedor", "nomeFantasia", "tipoPessoa", "codCidade", "codCondDePag", "enderecoForn",
         "bairroForn", "cepForn", "foneForn", "cpfCnpjForn", "inscEstSubTrib" )
      VALUES
        ( 'TECHDISTRIB INFORMÁTICA LTDA', 'TECHDISTRIB', 'J', ${ cidadeSP.codCidade }, ${ codCondDePag },
         'AV. PAULISTA, 726', 'BELA VISTA', '01310100', '551133331111',
         '12345678000190', '111111111111' )
      RETURNING "codForn"
    `;
    forn1Cod = inserted.codForn;
  }

  const existForn2 = await sql`
    SELECT "codForn" FROM "Fornecedores" WHERE "cpfCnpjForn" = '98765432000110' LIMIT 1
  `;
  if ( existForn2.length > 0 )
  {
    await sql`
      UPDATE "Fornecedores" SET
        "fornecedor"     = 'INFOSUL DISTRIBUIDORA DE TI EIRELI',
        "nomeFantasia"   = 'INFOSUL TI',
        "tipoPessoa"     = 'J',
        "codCidade"      = ${ cidadeCWB.codCidade },
        "codCondDePag"   = ${ codCondDePag },
        "enderecoForn"   = 'RUA XV DE NOVEMBRO, 1000',
        "bairroForn"     = 'CENTRO',
        "cepForn"        = '80060000',
        "foneForn"       = '554122229999',
        "inscEstSubTrib" = '222222222222'
      WHERE "codForn" = ${ existForn2[ 0 ].codForn }
    `;
  }
  else
  {
    await sql`
      INSERT INTO "Fornecedores"
        ( "fornecedor", "nomeFantasia", "tipoPessoa", "codCidade", "codCondDePag", "enderecoForn",
         "bairroForn", "cepForn", "foneForn", "cpfCnpjForn", "inscEstSubTrib" )
      VALUES
        ( 'INFOSUL DISTRIBUIDORA DE TI EIRELI', 'INFOSUL TI', 'J', ${ cidadeCWB.codCidade }, ${ codCondDePag },
         'RUA XV DE NOVEMBRO, 1000', 'CENTRO', '80060000', '554122229999',
         '98765432000110', '222222222222' )
    `;
  }

  // Clientes — dados sem máscara
  const existCl1 = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'ANA PAULA LIMA' LIMIT 1
  `;
  if ( existCl1.length === 0 )
  {
    await sql`
      INSERT INTO "Clientes"
        ( "cliente", "tipoPessoa", "codCidade", "codCondDePag",
         "enderecoCl", "bairroCl", "cepCl", "foneCl" )
      VALUES
        ( 'ANA PAULA LIMA', 'F', ${ cidadeRJ.codCidade }, ${ codCondDePag },
         'RUA DAS FLORES, 45', 'TIJUCA', '20511120', '5521988887777' )
    `;
  }

  const existCl2 = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'CARLOS EDUARDO SANTOS' LIMIT 1
  `;
  if ( existCl2.length === 0 )
  {
    await sql`
      INSERT INTO "Clientes"
        ( "cliente", "tipoPessoa", "codCidade", "codCondDePag",
         "enderecoCl", "bairroCl", "cepCl", "foneCl" )
      VALUES
        ( 'CARLOS EDUARDO SANTOS', 'F', ${ cidadeSP.codCidade }, ${ codCondDePag },
         'AV. PAULISTA, 1500', 'BELA VISTA', '01310100', '5511977776666' )
    `;
  }

  // Veículo
  let codVeiculo: number;
  const existVeic = await sql`
    SELECT "codVeiculo" FROM "Veiculos" WHERE "placaVeiculo" = 'ABC1234' LIMIT 1
  `;
  if ( existVeic.length > 0 )
  {
    codVeiculo = existVeic [ 0 ].codVeiculo;
    await sql`
      UPDATE "Veiculos" SET
        "modeloVeiculo" = 'FIORINO FURGÃO 1.3',
        "marca"         = 'FIAT',
        "placaMercoSul" = 'ABC1G34',
        "codAntt"       = '00000001',
        "codEstado"     = ${ estadoMap[ 'SP' ] }
      WHERE "codVeiculo" = ${ codVeiculo }
    `;
  }
  else
  {
    const [ inserted ] = await sql`
      INSERT INTO "Veiculos"
        ( "placaVeiculo", "modeloVeiculo", "marca", "placaMercoSul", "codAntt", "codEstado" )
      VALUES
        ( 'ABC1234', 'FIORINO FURGÃO 1.3', 'FIAT', 'ABC1G34', '00000001', ${ estadoMap[ 'SP' ] } )
      RETURNING "codVeiculo"
    `;
    codVeiculo = inserted.codVeiculo;
  }

  // Transportadora
  const existTransp = await sql`
    SELECT "codTransp" FROM "Transportadoras" WHERE "cpfCnpjTransp" = '55555555000155' LIMIT 1
  `;
  if ( existTransp.length > 0 )
  {
    await sql`
      UPDATE "Transportadoras" SET
        "transportadora"  = 'EXPRESSO RÁPIDO CARGAS LTDA',
        "nomeFantasia"    = 'EXPRESSO RÁPIDO',
        "tipoPessoa"      = 'J',
        "codCidade"       = ${ cidadeSP.codCidade },
        "codVeiculo"      = ${ codVeiculo },
        "enderecoTransp"  = 'RUA DOS CAMINHÕES, 300',
        "inscEstTransp"   = '333333333333'
      WHERE "codTransp" = ${ existTransp[ 0 ].codTransp }
    `;
  }
  else
  {
    await sql`
      INSERT INTO "Transportadoras"
        ( "transportadora", "nomeFantasia", "tipoPessoa", "codCidade", "codVeiculo",
         "enderecoTransp", "cpfCnpjTransp", "inscEstTransp" )
      VALUES
        ( 'EXPRESSO RÁPIDO CARGAS LTDA', 'EXPRESSO RÁPIDO', 'J', ${ cidadeSP.codCidade },
         ${ codVeiculo }, 'RUA DOS CAMINHÕES, 300', '55555555000155', '333333333333' )
    `;
  }

  // Vínculo Produto ↔ Fornecedor
  const [ prod1 ] = await sql`
    SELECT "codProd" FROM "Produtos"
    WHERE "produto" = 'NOTEBOOK DELL INSPIRON 15 CORE I5 16GB 512GB SSD'
    LIMIT 1
  `;
  if ( prod1 )
  {
    const existVinculo = await sql`
      SELECT 1 FROM "ProdutoFornecedor"
      WHERE "codProd" = ${ prod1.codProd } AND "codForn" = ${ forn1Cod }
      LIMIT 1
    `;
    if ( existVinculo.length === 0 )
    {
      await sql`
        INSERT INTO "ProdutoFornecedor" ( "codProd", "codForn" )
        VALUES ( ${ prod1.codProd }, ${ forn1Cod } )
      `;
    }
  }
}

// ============================================================
// T-031 — Seed financeiro
// Ordem: CondicaoDePagamento → FormaDePagamento → Parcelas
// ============================================================

async function seedFinanceiro(): Promise < void >
{
  // Condições de pagamento
  const condicoes = [
    { descricao: 'À VISTA',       juroCondPag: '0.00', multaCondPag: '0.00', descontoCondPag: '5.00' },
    { descricao: '30 DIAS',       juroCondPag: '1.00', multaCondPag: '2.00', descontoCondPag: '0.00' },
    { descricao: '30/60/90 DIAS', juroCondPag: '1.50', multaCondPag: '2.00', descontoCondPag: '0.00' },
  ];

  const codCondMap: Record < string, number > = {};
  for ( const cond of condicoes )
  {
    const existing = await sql`
      SELECT "codCondDePag" FROM "CondicaoDePagamento"
      WHERE "descricao" = ${ cond.descricao }
      LIMIT 1
    `;
    if ( existing.length > 0 )
    {
      codCondMap [ cond.descricao ] = existing [ 0 ].codCondDePag;
      await sql`
        UPDATE "CondicaoDePagamento" SET
          "juroCondPag"     = ${ cond.juroCondPag     ?? null },
          "multaCondPag"    = ${ cond.multaCondPag    ?? null },
          "descontoCondPag" = ${ cond.descontoCondPag ?? null }
        WHERE "codCondDePag" = ${ existing[ 0 ].codCondDePag }
      `;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "CondicaoDePagamento"
          ( "descricao", "juroCondPag", "multaCondPag", "descontoCondPag" )
        VALUES
          ( ${ cond.descricao }, ${ cond.juroCondPag ?? null }, ${ cond.multaCondPag ?? null }, ${ cond.descontoCondPag ?? null } )
        RETURNING "codCondDePag"
      `;
      codCondMap [ cond.descricao ] = inserted.codCondDePag;
    }
  }

  // Formas de pagamento
  const formas = [
    { formaDePag: 'DINHEIRO',          prazoCompensacao: 0  },
    { formaDePag: 'PIX',               prazoCompensacao: 0  },
    { formaDePag: 'BOLETO BANCÁRIO',   prazoCompensacao: 3  },
    { formaDePag: 'CARTÃO DE CRÉDITO', prazoCompensacao: 30 },
  ];

  const codFormaMap: Record < string, number > = {};
  for ( const forma of formas )
  {
    const existing = await sql`
      SELECT "codFormaDePag" FROM "FormaDePagamento"
      WHERE "formaDePag" = ${ forma.formaDePag }
      LIMIT 1
    `;
    if ( existing.length > 0 )
    {
      codFormaMap [ forma.formaDePag ] = existing [ 0 ].codFormaDePag;
      await sql`
        UPDATE "FormaDePagamento" SET
          "prazoCompensacao" = ${ forma.prazoCompensacao }
        WHERE "codFormaDePag" = ${ existing[ 0 ].codFormaDePag }
      `;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "FormaDePagamento" ( "formaDePag", "prazoCompensacao" )
        VALUES ( ${ forma.formaDePag }, ${ forma.prazoCompensacao } )
        RETURNING "codFormaDePag"
      `;
      codFormaMap [ forma.formaDePag ] = inserted.codFormaDePag;
    }
  }

  // Parcelas — vinculadas às condições
  const parcelas = [
    // À Vista: 100% no 1º dia (à vista = 1 dia) via Dinheiro
    { codCondDePag: codCondMap [ 'À VISTA' ],       codFormaDePag: codFormaMap [ 'DINHEIRO' ],          percentual: '100.00', numDias: 1  },
    // 30 dias: 100% em 30 dias via boleto
    { codCondDePag: codCondMap [ '30 DIAS' ],       codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual: '100.00', numDias: 30 },
    // 30/60/90 dias: 3 parcelas de 33,33% via boleto
    { codCondDePag: codCondMap [ '30/60/90 DIAS' ], codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual:  '33.33', numDias: 30 },
    { codCondDePag: codCondMap [ '30/60/90 DIAS' ], codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual:  '33.33', numDias: 60 },
    { codCondDePag: codCondMap [ '30/60/90 DIAS' ], codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual:  '33.34', numDias: 90 },
  ];

  for ( const parcela of parcelas )
  {
    const existing = await sql`
      SELECT "codParcela" FROM "Parcelas"
      WHERE  "codCondDePag"  = ${ parcela.codCondDePag }
      AND    "codFormaDePag" = ${ parcela.codFormaDePag }
      AND    "numDias"       = ${ parcela.numDias }
      LIMIT 1
    `;
    if ( existing.length === 0 )
    {
      await sql`
        INSERT INTO "Parcelas" ( "codCondDePag", "codFormaDePag", "percentual", "numDias" )
        VALUES ( ${ parcela.codCondDePag }, ${ parcela.codFormaDePag }, ${ parcela.percentual }, ${ parcela.numDias } )
      `;
    }
  }
}

// ============================================================
// T-041 — Seed de Contas a Pagar
// Ordem: Fornecedores → FormaDePagamento → ContasAPagar
// ============================================================

async function seedContasAPagar(): Promise < void >
{
  const [ forn1 ] = await sql`
    SELECT "codForn" FROM "Fornecedores" WHERE "cpfCnpjForn" = '12345678000190' LIMIT 1
  `;
  const [ forn2 ] = await sql`
    SELECT "codForn" FROM "Fornecedores" WHERE "cpfCnpjForn" = '98765432000110' LIMIT 1
  `;
  const [ boleto ] = await sql`
    SELECT "codFormaDePag" FROM "FormaDePagamento" WHERE "formaDePag" = 'BOLETO BANCÁRIO' LIMIT 1
  `;
  const [ pix ] = await sql`
    SELECT "codFormaDePag" FROM "FormaDePagamento" WHERE "formaDePag" = 'PIX' LIMIT 1
  `;

  if ( !forn1 || !forn2 || !boleto || !pix )
  {
    throw new Error ( 'Fornecedores/Formas de Pagamento de referência não encontrados — rode seedParceiros e seedFinanceiro primeiro.' );
  }

  const contas = [
    {
      numero:        '00000001',
      modelo:        '55',
      serie:         '01',
      parcela:       1,
      codFornecedor: forn1.codForn,
      codFormaDePag: boleto.codFormaDePag,
      dtEmissao:     '2026-09-01',
      dtVencimento:  '2026-10-01',
      valor:         '3200.00',
      juro:          '0.00',
      desconto:      '0.00',
      multa:         '0.00',
    },
    {
      numero:        '00000002',
      modelo:        '55',
      serie:         '01',
      parcela:       1,
      codFornecedor: forn2.codForn,
      codFormaDePag: pix.codFormaDePag,
      dtEmissao:     '2026-09-05',
      dtVencimento:  '2026-09-05',
      valor:         '1950.00',
      juro:          '0.00',
      desconto:      '5.00',
      multa:         '0.00',
    },
  ];

  for ( const conta of contas )
  {
    const existing = await sql`
      SELECT 1 FROM "ContasAPagar"
      WHERE "numero"  = ${ conta.numero }
      AND   "modelo"  = ${ conta.modelo }
      AND   "serie"   = ${ conta.serie }
      AND   "parcela" = ${ conta.parcela }
      LIMIT 1
    `;
    if ( existing.length === 0 )
    {
      await sql`
        INSERT INTO "ContasAPagar"
          ( "numero", "modelo", "serie", "parcela", "codFornecedor", "codFormaDePag",
           "dtEmissao", "dtVencimento", "valor", "juro", "desconto", "multa" )
        VALUES
          ( ${ conta.numero }, ${ conta.modelo }, ${ conta.serie }, ${ conta.parcela },
           ${ conta.codFornecedor }, ${ conta.codFormaDePag }, ${ conta.dtEmissao },
           ${ conta.dtVencimento }, ${ conta.valor }, ${ conta.juro }, ${ conta.desconto }, ${ conta.multa } )
      `;
    }
  }
}

async function main()
{
  console.log ( 'Iniciando seed...' );

  console.log ( '  Geográfico (Países, Estados, Cidades)...' );
  const estadoMap = await seedGeografico();
  console.log ( `  -> 1 país, ${Object.keys(estadoMap).length} estados, cidades de ${Object.keys(CIDADES_POR_UF).length} UFs.` );

  console.log ( '  Catálogo (Categorias, Produtos)...' );
  await seedCatalogo(estadoMap);
  console.log ( `  -> ${CATEGORIAS_LISTA.length} categorias, 5 produtos.` );

  console.log ( '  Classificações de Compra...' );
  await seedClassificacoesCompra();
  console.log ( `  -> ${CLASSIFICACOES_COMPRA.length} classificações de compra.` );

  console.log ( '  Parceiros (Fornecedores, Clientes, Veículos, Transportadoras)...' );
  await seedParceiros(estadoMap);
  console.log ( '  -> 2 fornecedores, 1 condição de pagamento, 2 clientes, 1 veículo, 1 transportadora.' );

  console.log ( '  Financeiro (Condições, Formas de Pagamento, Parcelas)...' );
  await seedFinanceiro();
  console.log ( '  -> 3 condições de pagamento, 4 formas de pagamento, 5 parcelas.' );

  console.log ( '  Contas a Pagar...' );
  await seedContasAPagar();
  console.log ( '  -> 2 contas a pagar.' );

  console.log ( 'Seed concluído.' );
}

main()
  .catch ( ( e ) => {
    console.error ( 'Erro no seed:', e );
    process.exit ( 1 );
  } )
  .finally( () => sql.end() );
