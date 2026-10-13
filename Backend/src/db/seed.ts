import 'dotenv/config';
import sql from '../lib/db';
import { CalcularCompra, CalcularEntradaEstoque } from '../modules/compras/compras.calculo';

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

// ============================================================
// T-061 — Seed de atendimento (Procedimentos e Ordens de Serviço)
// Ordem: Procedimentos → (Clientes, Servicos, Pecas já existentes) → OrdemDeServicos
// ============================================================

const PROCEDIMENTOS_LISTA = [
  'TESTE DE INICIALIZAÇÃO',
  'TESTE DE TECLADO E TOUCHPAD',
  'TESTE DE TELA E VÍDEO',
  'LIMPEZA EXTERNA E INTERNA',
  'TESTE DE CONECTIVIDADE WI-FI',
];

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
      custoProd:      '3200.00',
      precoVenda:     '4299.00',
      estoque:        15,
    },
    {
      produto:        'DESKTOP POSITIVO MASTER D570 CORE I3 8GB 240GB SSD',
      undProduto:     'UN',
      codCategoria:   catMap [ 'DESKTOPS E WORKSTATIONS' ],
      pesoBruto:      '6.800',
      pesoLiq:        '5.900',
      custoProd:      '1950.00',
      precoVenda:     '2599.00',
      estoque:        8,
    },
    {
      produto:        'MOUSE LOGITECH MX MASTER 3S SEM FIO',
      undProduto:     'UN',
      codCategoria:   catMap [ 'PERIFÉRICOS' ],
      pesoBruto:      '0.141',
      pesoLiq:        '0.100',
      custoProd:      '380.00',
      precoVenda:     '549.00',
      estoque:        25,
    },
    {
      produto:        'SSD KINGSTON A400 480GB SATA III',
      undProduto:     'UN',
      codCategoria:   catMap [ 'COMPONENTES' ],
      pesoBruto:      '0.070',
      pesoLiq:        '0.055',
      custoProd:      '210.00',
      precoVenda:     '299.00',
      estoque:        30,
    },
    {
      produto:        'CABO HDMI 2.0 4K 1,8M',
      undProduto:     'UN',
      codCategoria:   catMap [ 'CABOS E ACESSÓRIOS' ],
      pesoBruto:      '0.150',
      pesoLiq:        '0.120',
      custoProd:      '28.00',
      precoVenda:     '49.90',
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
          "custoProd"      = ${ prod.custoProd },
          "precoVenda"     = ${ prod.precoVenda },
          "estoque"        = ${ prod.estoque }
        WHERE "codProd" = ${ codProd }
      `;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "Produtos"
          ( "produto", "undProduto", "pesoBruto", "pesoLiq",
           "custoProd", "precoVenda", "estoque" )
        VALUES
          ( ${ prod.produto }, ${ prod.undProduto },
           ${ prod.pesoBruto }, ${ prod.pesoLiq }, ${ prod.custoProd },
           ${ prod.precoVenda }, ${ prod.estoque } )
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
        "tipoPessoa"     = 'JURIDICA',
        "codCidade"      = ${ cidadeSP.codCidade },
        "codCondDePag"   = ${ codCondDePag },
        "enderecoForn"   = 'AV. PAULISTA, 726',
        "bairroForn"     = 'BELA VISTA',
        "cepForn"        = '01310100',
        "foneForn"       = '551133331111',
        "foneFixo"       = '551133331111',
        "email"          = 'contato@techdistrib.com.br',
        "dtFundacao"     = '2005-03-15',
        "inscEstSubTrib" = '111111111111'
      WHERE "codForn" = ${ forn1Cod }
    `;
  }
  else
  {
    const [ inserted ] = await sql`
      INSERT INTO "Fornecedores"
        ( "fornecedor", "nomeFantasia", "tipoPessoa", "codCidade", "codCondDePag", "enderecoForn",
         "bairroForn", "cepForn", "foneForn", "cpfCnpjForn", "inscEstSubTrib",
         "foneFixo", "email", "dtFundacao" )
      VALUES
        ( 'TECHDISTRIB INFORMÁTICA LTDA', 'TECHDISTRIB', 'JURIDICA', ${ cidadeSP.codCidade }, ${ codCondDePag },
         'AV. PAULISTA, 726', 'BELA VISTA', '01310100', '551133331111',
         '12345678000190', '111111111111',
         '551133331111', 'contato@techdistrib.com.br', '2005-03-15' )
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
        "tipoPessoa"     = 'JURIDICA',
        "codCidade"      = ${ cidadeCWB.codCidade },
        "codCondDePag"   = ${ codCondDePag },
        "enderecoForn"   = 'RUA XV DE NOVEMBRO, 1000',
        "bairroForn"     = 'CENTRO',
        "cepForn"        = '80060000',
        "foneForn"       = '554122229999',
        "foneFixo"       = '554122229999',
        "email"          = 'vendas@infosulti.com.br',
        "dtFundacao"     = '2011-08-22',
        "inscEstSubTrib" = '222222222222'
      WHERE "codForn" = ${ existForn2[ 0 ].codForn }
    `;
  }
  else
  {
    await sql`
      INSERT INTO "Fornecedores"
        ( "fornecedor", "nomeFantasia", "tipoPessoa", "codCidade", "codCondDePag", "enderecoForn",
         "bairroForn", "cepForn", "foneForn", "cpfCnpjForn", "inscEstSubTrib",
         "foneFixo", "email", "dtFundacao" )
      VALUES
        ( 'INFOSUL DISTRIBUIDORA DE TI EIRELI', 'INFOSUL TI', 'JURIDICA', ${ cidadeCWB.codCidade }, ${ codCondDePag },
         'RUA XV DE NOVEMBRO, 1000', 'CENTRO', '80060000', '554122229999',
         '98765432000110', '222222222222',
         '554122229999', 'vendas@infosulti.com.br', '2011-08-22' )
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
         "enderecoCl", "bairroCl", "cepCl", "foneCl",
         "foneFixo", "email", "apelido", "rg", "dtNascimento", "genero" )
      VALUES
        ( 'ANA PAULA LIMA', 'FISICA', ${ cidadeRJ.codCidade }, ${ codCondDePag },
         'RUA DAS FLORES, 45', 'TIJUCA', '20511120', '5521988887777',
         '552133334444', 'ana.lima@email.com', 'ANA', '123456789', '1992-04-18', 'FEMININO' )
    `;
  }
  else
  {
    await sql`
      UPDATE "Clientes" SET "tipoPessoa" = 'FISICA' WHERE "codCliente" = ${ existCl1[ 0 ].codCliente }
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
         "enderecoCl", "bairroCl", "cepCl", "foneCl",
         "foneFixo", "email", "apelido", "rg", "dtNascimento", "genero" )
      VALUES
        ( 'CARLOS EDUARDO SANTOS', 'FISICA', ${ cidadeSP.codCidade }, ${ codCondDePag },
         'AV. PAULISTA, 1500', 'BELA VISTA', '01310100', '5511977776666',
         '551133335555', 'carlos.santos@email.com', 'CADU', '987654321', '1985-11-02', 'MASCULINO' )
    `;
  }
  else
  {
    await sql`
      UPDATE "Clientes" SET "tipoPessoa" = 'FISICA' WHERE "codCliente" = ${ existCl2[ 0 ].codCliente }
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
        "tipoPessoa"      = 'JURIDICA',
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
        ( 'EXPRESSO RÁPIDO CARGAS LTDA', 'EXPRESSO RÁPIDO', 'JURIDICA', ${ cidadeSP.codCidade },
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

  // Parcelas — vinculadas às condições; o número (numParcela) é definido manualmente, por condição
  const parcelas = [
    // À Vista: 100% no 1º dia (à vista = 1 dia) via Dinheiro
    { numParcela: 1, codCondDePag: codCondMap [ 'À VISTA' ],       codFormaDePag: codFormaMap [ 'DINHEIRO' ],          percentual: '100.00', numDias: 1  },
    // 30 dias: 100% em 30 dias via boleto
    { numParcela: 1, codCondDePag: codCondMap [ '30 DIAS' ],       codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual: '100.00', numDias: 30 },
    // 30/60/90 dias: 3 parcelas de 33,33% via boleto
    { numParcela: 1, codCondDePag: codCondMap [ '30/60/90 DIAS' ], codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual:  '33.33', numDias: 30 },
    { numParcela: 2, codCondDePag: codCondMap [ '30/60/90 DIAS' ], codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual:  '33.33', numDias: 60 },
    { numParcela: 3, codCondDePag: codCondMap [ '30/60/90 DIAS' ], codFormaDePag: codFormaMap [ 'BOLETO BANCÁRIO' ],   percentual:  '33.34', numDias: 90 },
  ];

  for ( const parcela of parcelas )
  {
    const existing = await sql`
      SELECT "numParcela" FROM "Parcelas"
      WHERE  "codCondDePag" = ${ parcela.codCondDePag }
      AND    "numParcela"   = ${ parcela.numParcela }
      LIMIT 1
    `;
    if ( existing.length === 0 )
    {
      await sql`
        INSERT INTO "Parcelas" ( "codCondDePag", "numParcela", "codFormaDePag", "percentual", "numDias" )
        VALUES ( ${ parcela.codCondDePag }, ${ parcela.numParcela }, ${ parcela.codFormaDePag }, ${ parcela.percentual }, ${ parcela.numDias } )
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
      numero:        '000000001',
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
      valorBaixa:    '3200.00',
      dtBaixa:       '2026-10-01T12:00:00Z',
    },
    {
      numero:        '000000002',
      modelo:        '55',
      serie:         '01',
      parcela:       1,
      codFornecedor: forn2.codForn,
      codFormaDePag: pix.codFormaDePag,
      dtEmissao:     '2026-09-05',
      dtVencimento:  '2026-09-05T23:59:00Z',
      valor:         '1950.00',
      juro:          '0.00',
      desconto:      '5.00',
      multa:         '0.00',
      valorBaixa:    '1945.00',
      dtBaixa:       '2026-09-05T20:00:00Z',
    },
    // A conta a pagar nasce já baixada (sem estado "em aberto").
    {
      numero:        '000000003',
      modelo:        '55',
      serie:         '01',
      parcela:       1,
      codFornecedor: forn1.codForn,
      codFormaDePag: pix.codFormaDePag,
      dtEmissao:     '2026-09-10',
      dtVencimento:  '2026-09-10T23:59:00Z',
      valor:         '500.00',
      juro:          '0.00',
      desconto:      '0.00',
      multa:         '0.00',
      valorBaixa:    '500.00',
      dtBaixa:       '2026-09-10T18:00:00Z',
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
           "dtEmissao", "dtVencimento", "valor", "juro", "desconto", "multa",
           "valorBaixa", "dtBaixa" )
        VALUES
          ( ${ conta.numero }, ${ conta.modelo }, ${ conta.serie }, ${ conta.parcela },
           ${ conta.codFornecedor }, ${ conta.codFormaDePag }, ${ conta.dtEmissao },
           ${ conta.dtVencimento }, ${ conta.valor }, ${ conta.juro }, ${ conta.desconto }, ${ conta.multa },
           ${ conta.valorBaixa }, ${ conta.dtBaixa } )
      `;
    }
  }
}

// ============================================================
// T-080 — Seed de Compras (Fase 4)
// Ordem: Fornecedores → CondicaoDePagamento → Produtos → Compras
//
// Uma compra já lançada (a compra não tem rascunho): ao ser criada, dá entrada nos itens
// em estoque e custo médio — só na 1ª execução, para o seed seguir idempotente. Só os dados
// informados são gravados; total, rateio e custo unitário são calculados pelo Backend:
//   mouse: 5 × 380,00 = 1.900,00
//   SSD:  10 × 210,00 − 100,00 = 2.000,00
// A parcela única de 4.000,00 fecha no total da compra (3.900,00 de produtos + 100,00 de despesas).
// ============================================================
async function seedCompras(): Promise < void >
{
  const [ fornecedor ] = await sql`
    SELECT "codForn", "codCondDePag" FROM "Fornecedores" WHERE "cpfCnpjForn" = '12345678000190' LIMIT 1
  `;
  const [ mouse ] = await sql`
    SELECT "codProd" FROM "Produtos" WHERE "produto" = 'MOUSE LOGITECH MX MASTER 3S SEM FIO' LIMIT 1
  `;
  const [ ssd ] = await sql`
    SELECT "codProd" FROM "Produtos" WHERE "produto" = 'SSD KINGSTON A400 480GB SATA III' LIMIT 1
  `;

  if ( !fornecedor || !mouse || !ssd )
  {
    throw new Error ( 'Fornecedor/Produtos de referência não encontrados — rode seedCatalogo e seedParceiros primeiro.' );
  }

  const compra = {
    numero:    '000000101',
    modelo:    '55',
    serie:     '01',
    dtEmissao: '2026-09-20T10:00:00Z',
    dtChegada: '2026-09-22T14:00:00Z',
    frete:     '60.00',
    seguro:    '20.00',
    despesas:  '20.00',
  };

  const compraCriada = await sql`
    INSERT INTO "Compras"
      ( "numero", "modelo", "serie", "codForn", "codCondDePag",
       "dtEmissao", "dtChegada", "dtEntrada", "frete", "seguro", "despesas" )
    VALUES
      ( ${ compra.numero }, ${ compra.modelo }, ${ compra.serie }, ${ fornecedor.codForn },
       ${ fornecedor.codCondDePag },
       ${ compra.dtEmissao }, ${ compra.dtChegada }, ${ compra.dtChegada }, ${ compra.frete }, ${ compra.seguro },
       ${ compra.despesas } )
    ON CONFLICT ( "numero", "modelo", "serie", "codForn" ) DO NOTHING
    RETURNING "numero"
  `;

  const itens = [
    {
      codProduto:        mouse.codProd,
      quantidade:        5,
      valorUnitario:     '380.00',
      desconto:          '0.00',
    },
    {
      codProduto:        ssd.codProd,
      quantidade:        10,
      valorUnitario:     '210.00',
      desconto:          '100.00',
    },
  ];

  for ( const item of itens )
  {
    await sql`
      INSERT INTO "CompraProduto"
        ( "numero", "modelo", "serie", "codForn", "codProduto", "quantidade", "valorUnitario",
         "desconto", "unidade" )
      VALUES
        ( ${ compra.numero }, ${ compra.modelo }, ${ compra.serie }, ${ fornecedor.codForn }, ${ item.codProduto },
         ${ item.quantidade }, ${ item.valorUnitario }, ${ item.desconto },
         'UN' )
      ON CONFLICT ( "numero", "modelo", "serie", "codForn", "codProduto" ) DO NOTHING
    `;
  }

  // Entrada em estoque/custo médio (RN018), igual ao cadastro da compra pela API.
  if ( compraCriada.length > 0 )
  {
    const calculo = CalcularCompra ( { frete: compra.frete, seguro: compra.seguro, despesas: compra.despesas, itens } );

    for ( const [ indice, item ] of itens.entries() )
    {
      const [ produto ] = await sql`
        SELECT "estoque", "custoProd", "custoMedioProd" FROM "Produtos" WHERE "codProd" = ${ item.codProduto }
      `;
      const entrada = CalcularEntradaEstoque (
        { estoque: produto.estoque, custoProd: produto.custoProd, custoMedioProd: produto.custoMedioProd },
        item.quantidade,
        calculo.itens[ indice ].custoMedioProduto
      );

      await sql`
        UPDATE "Produtos"
        SET "estoque" = ${ entrada.estoque }, "custoMedioProd" = ${ entrada.custoMedioProd }, "custoProd" = ${ entrada.custoProd }
        WHERE "codProd" = ${ item.codProduto }
      `;
    }
  }

  // RN023 — parcela única à vista (PIX) que fecha no total calculado da compra de exemplo.
  const [ pix ] = await sql`
    SELECT "codFormaDePag" FROM "FormaDePagamento" WHERE "formaDePag" = 'PIX' LIMIT 1
  `;

  if ( pix )
  {
    await sql`
      INSERT INTO "CompraParcelas"
        ( "numero", "modelo", "serie", "codForn", "numParcela", "codFormaDePag", "valor", "dtVencimento" )
      VALUES
        ( ${ compra.numero }, ${ compra.modelo }, ${ compra.serie }, ${ fornecedor.codForn }, 1, ${ pix.codFormaDePag },
         '4000.00', '2026-10-20T10:00:00Z' )
      ON CONFLICT ( "numero", "modelo", "serie", "codForn", "numParcela" ) DO NOTHING
    `;
  }
}

// ============================================================
// T-042 — Seed de Contas a Receber
// Ordem: Clientes → FormaDePagamento → ContasAReceber
// ============================================================

async function seedContasAReceber(): Promise < void >
{
  const [ ana ] = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'ANA PAULA LIMA' LIMIT 1
  `;
  const [ carlos ] = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'CARLOS EDUARDO SANTOS' LIMIT 1
  `;
  const [ boleto ] = await sql`
    SELECT "codFormaDePag" FROM "FormaDePagamento" WHERE "formaDePag" = 'BOLETO BANCÁRIO' LIMIT 1
  `;
  const [ pix ] = await sql`
    SELECT "codFormaDePag" FROM "FormaDePagamento" WHERE "formaDePag" = 'PIX' LIMIT 1
  `;

  if ( !ana || !carlos || !boleto || !pix )
  {
    throw new Error ( 'Clientes/Formas de Pagamento de referência não encontrados — rode seedParceiros e seedFinanceiro primeiro.' );
  }

  const contas = [
    {
      numero:        '000000001',
      modelo:        '55',
      serie:         '01',
      parcela:       1,
      codCliente:    ana.codCliente,
      codFormaDePag: boleto.codFormaDePag,
      dtEmissao:     '2026-09-10',
      dtVencimento:  '2026-10-10T23:59:00Z',
      valor:         '380.00',
      juro:          '0.00',
      desconto:      '0.00',
      multa:         '0.00',
      valorBaixa:    '380.00',
      dtBaixa:       '2026-10-10T12:00:00Z',
      dtPagamento:   '2026-10-10T12:00:00Z',
    },
    // A conta a receber nasce já baixada (sem estado "em aberto").
    {
      numero:        '000000002',
      modelo:        '55',
      serie:         '01',
      parcela:       1,
      codCliente:    carlos.codCliente,
      codFormaDePag: pix.codFormaDePag,
      dtEmissao:     '2026-09-12',
      dtVencimento:  '2026-09-12T23:59:00Z',
      valor:         '210.00',
      juro:          '0.00',
      desconto:      '0.00',
      multa:         '0.00',
      valorBaixa:    '210.00',
      dtBaixa:       '2026-09-12T15:30:00Z',
      dtPagamento:   '2026-09-12T15:30:00Z',
    },
  ];

  for ( const conta of contas )
  {
    const existing = await sql`
      SELECT 1 FROM "ContasAReceber"
      WHERE "numero"  = ${ conta.numero }
      AND   "modelo"  = ${ conta.modelo }
      AND   "serie"   = ${ conta.serie }
      AND   "parcela" = ${ conta.parcela }
      LIMIT 1
    `;
    if ( existing.length === 0 )
    {
      await sql`
        INSERT INTO "ContasAReceber"
          ( "numero", "modelo", "serie", "parcela", "codCliente", "codFormaDePag",
           "dtEmissao", "dtVencimento", "valor", "juro", "desconto", "multa",
           "valorBaixa", "dtBaixa", "dtPagamento" )
        VALUES
          ( ${ conta.numero }, ${ conta.modelo }, ${ conta.serie }, ${ conta.parcela },
           ${ conta.codCliente }, ${ conta.codFormaDePag }, ${ conta.dtEmissao },
           ${ conta.dtVencimento }, ${ conta.valor }, ${ conta.juro }, ${ conta.desconto }, ${ conta.multa },
           ${ conta.valorBaixa }, ${ conta.dtBaixa }, ${ conta.dtPagamento } )
      `;
    }
  }
}

// ============================================================
// T-051 — Seed de recursos humanos e execução de OS
// Ordem: Cargos → Funcionarios → Servicos → Pecas
// ============================================================

async function seedRecursosHumanos(): Promise < void >
{
  const [ cidadeSP ] = await sql`SELECT "codCidade" FROM "Cidades" WHERE "cidade" = 'SÃO PAULO' LIMIT 1`;

  if ( !cidadeSP )
  {
    throw new Error ( 'Cidade de referência não encontrada — rode seedGeografico primeiro.' );
  }

  // Cargos
  const CARGOS = [ 'TÉCNICO', 'ATENDENTE', 'GERENTE' ];
  const codCargoMap: Record < string, number > = {};
  for ( const cargo of CARGOS )
  {
    const existing = await sql`SELECT "codCargo" FROM "Cargos" WHERE "cargo" = ${ cargo } LIMIT 1`;
    if ( existing.length > 0 )
    {
      codCargoMap [ cargo ] = existing [ 0 ].codCargo;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "Cargos" ( "cargo" )
        VALUES ( ${ cargo } )
        RETURNING "codCargo"
      `;
      codCargoMap [ cargo ] = inserted.codCargo;
    }
  }

  // Funcionários
  const FUNCIONARIOS = [
    { funcionario: 'ROBERTO ALVES SILVA', funcFone: '5511988881111', cargo: 'TÉCNICO' },
    { funcionario: 'MARIANA COSTA FERREIRA', funcFone: '5511988882222', cargo: 'TÉCNICO' },
    { funcionario: 'JULIANA PEREIRA DIAS', funcFone: '5511988883333', cargo: 'ATENDENTE' },
  ];
  const codFuncionarioMap: Record < string, number > = {};
  for ( const funcionario of FUNCIONARIOS )
  {
    const existing = await sql`
      SELECT "codFuncionario" FROM "Funcionarios" WHERE "funcionario" = ${ funcionario.funcionario } LIMIT 1
    `;
    if ( existing.length > 0 )
    {
      codFuncionarioMap [ funcionario.funcionario ] = existing [ 0 ].codFuncionario;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "Funcionarios" ( "codCidade", "codCargo", "funcionario", "funcFone" )
        VALUES ( ${ cidadeSP.codCidade }, ${ codCargoMap [ funcionario.cargo ] }, ${ funcionario.funcionario }, ${ funcionario.funcFone } )
        RETURNING "codFuncionario"
      `;
      codFuncionarioMap [ funcionario.funcionario ] = inserted.codFuncionario;
    }
  }

  // Serviços
  const SERVICOS = [
    { servico: 'FORMATAÇÃO E INSTALAÇÃO DE SISTEMA OPERACIONAL', valor: '120.00', funcionario: 'ROBERTO ALVES SILVA' },
    { servico: 'TROCA DE TELA DE NOTEBOOK', valor: '180.00', funcionario: 'ROBERTO ALVES SILVA' },
    { servico: 'LIMPEZA INTERNA E TROCA DE PASTA TÉRMICA', valor: '90.00', funcionario: 'MARIANA COSTA FERREIRA' },
  ];
  for ( const servico of SERVICOS )
  {
    const existing = await sql`SELECT "codServico" FROM "Servicos" WHERE "servico" = ${ servico.servico } LIMIT 1`;
    if ( existing.length === 0 )
    {
      await sql`
        INSERT INTO "Servicos" ( "servico", "valor", "codFuncionario" )
        VALUES ( ${ servico.servico }, ${ servico.valor }, ${ codFuncionarioMap [ servico.funcionario ] } )
      `;
    }
  }

  // Peças
  const PECAS = [ 'TELA NOTEBOOK 15.6"', 'BATERIA DE NOTEBOOK', 'MEMÓRIA RAM 8GB DDR4', 'PASTA TÉRMICA' ];
  for ( const peca of PECAS )
  {
    const existing = await sql`SELECT "codPeca" FROM "Pecas" WHERE "peca" = ${ peca } LIMIT 1`;
    if ( existing.length === 0 )
    {
      await sql`
        INSERT INTO "Pecas" ( "peca" )
        VALUES ( ${ peca } )
      `;
    }
  }
}

async function seedProcedimentos(): Promise < Record < string, number > >
{
  const codProcedimentoMap: Record < string, number > = {};
  for ( const procedimento of PROCEDIMENTOS_LISTA )
  {
    const existing = await sql`
      SELECT "codProcedimento" FROM "Procedimentos" WHERE "procedimento" = ${ procedimento } LIMIT 1
    `;
    if ( existing.length > 0 )
    {
      codProcedimentoMap [ procedimento ] = existing [ 0 ].codProcedimento;
    }
    else
    {
      const [ inserted ] = await sql`
        INSERT INTO "Procedimentos" ( "procedimento" )
        VALUES ( ${ procedimento } )
        RETURNING "codProcedimento"
      `;
      codProcedimentoMap [ procedimento ] = inserted.codProcedimento;
    }
  }
  return codProcedimentoMap;
}

/**
 * Duas OS em estágios diferentes do fluxo (RNF06 — Aparelho/Equipamento nascem
 * atomicamente com a OS, mesmo padrão de `AbrirOS()`). `numOdS` é inteiro gerado pelo
 * banco (UUID) — o seed usa valores fixos só para permitir a checagem de
 * idempotência (`existeOS1`/`existeOS2`), não para representar o formato real de
 * uma OS aberta pela aplicação (que nasce sem valor informado, via DEFAULT):
 * - OS_1: recém-aberta — checklist de procedimentos definida (RN009), mas ainda
 *   sem diagnóstico registrado (situação permanece 'Aberta').
 * - OS_2: fluxo completo — diagnóstico com checklist checada e orçamento de peça
 *   aprovado, execução com serviço prestado e peça efetivamente substituída
 *   (situação 'Em execução').
 */
async function seedOrdensServico ( codProcedimentoMap: Record < string, number > ): Promise < void >
{
  const [ ana ] = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'ANA PAULA LIMA' LIMIT 1
  `;
  const [ carlos ] = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'CARLOS EDUARDO SANTOS' LIMIT 1
  `;
  const [ servicoLimpeza ] = await sql`
    SELECT "codServico" FROM "Servicos" WHERE "servico" = 'LIMPEZA INTERNA E TROCA DE PASTA TÉRMICA' LIMIT 1
  `;
  const [ pecaMemoria ] = await sql`
    SELECT "codPeca" FROM "Pecas" WHERE "peca" = 'MEMÓRIA RAM 8GB DDR4' LIMIT 1
  `;

  if ( !ana || !carlos || !servicoLimpeza || !pecaMemoria )
  {
    throw new Error ( 'Clientes/Serviços/Peças de referência não encontrados — rode seedParceiros e seedRecursosHumanos primeiro.' );
  }

  const checklist = PROCEDIMENTOS_LISTA.slice ( 0, 3 ).map ( ( procedimento ) => codProcedimentoMap [ procedimento ] );

  // OS_1 — recém-aberta
  const existeOS1 = await sql`
    SELECT 1 FROM "OrdemDeServicos" WHERE "codCliente" = ${ ana.codCliente } AND "defeito" = 'NÃO LIGA' LIMIT 1
  `;
  if ( existeOS1.length === 0 )
  {
    const [ aparelho1 ] = await sql`
      INSERT INTO "Aparelhos" ( "aparelho", "serie", "modelo", "voltagem", "garantia" )
      VALUES ( 'NOTEBOOK', 'SN12345ABC', 'INSPIRON 15 3520', 'BIVOLT', '12 MESES' )
      RETURNING "codAparelho"
    `;
    const [ equipamento1 ] = await sql`
      INSERT INTO "Equipamentos"
        ( "equipamento", "grupoUser", "soEq", "socketEq", "memoriaRam", "tipoOffice",
         "placaMae", "bios", "capacidadeRam", "possuiSSD", "possuiHD", "capacidadeArmz", "usoArmz" )
      VALUES
        ( 'NOTEBOOK DELL INSPIRON 15', 'CASA', 'WIN11', 'BGA', '16GB', 'M365',
         'DELL 0XYZ123', 'DELL BIOS 2.14', '16GB', true, false, '512GB', '60%' )
      RETURNING "codEquipamento"
    `;

    const [ ordemServico1 ] = await sql`
      INSERT INTO "OrdemDeServicos"
        ( "codCliente", "atendente", "codAparelho", "acessorio", "defeito",
         "obsBalcao", "tipoOdS", "codEquipamento", "solicitante", "dtAtendimento" )
      VALUES
        ( ${ ana.codCliente }, 'JULIANA PEREIRA DIAS', ${ aparelho1.codAparelho }, 'CARREGADOR',
         'NÃO LIGA', 'CLIENTE RELATA QUE PAROU DE FUNCIONAR APÓS QUEDA DE ENERGIA', 'MANUTENÇÃO',
         ${ equipamento1.codEquipamento }, 'ANA PAULA LIMA', now() )
      RETURNING "numOdS"
    `;

    for ( let indice = 0; indice < checklist.length; indice++ )
    {
      await sql`
        INSERT INTO "ProcedimentosOdS" ( "numOdS", "codProcedimento", "ordem" )
        VALUES ( ${ ordemServico1.numOdS }, ${ checklist [ indice ] }, ${ indice + 1 } )
      `;
    }
  }

  // OS_2 — fluxo completo (diagnóstico + execução)
  const existeOS2 = await sql`
    SELECT 1 FROM "OrdemDeServicos" WHERE "codCliente" = ${ carlos.codCliente } AND "defeito" = 'LENTIDÃO EXCESSIVA' LIMIT 1
  `;
  if ( existeOS2.length === 0 )
  {
    const [ aparelho2 ] = await sql`
      INSERT INTO "Aparelhos" ( "aparelho", "serie", "modelo", "voltagem", "garantia" )
      VALUES ( 'DESKTOP', 'SN99887766', 'MASTER D570', '220V', '90 DIAS' )
      RETURNING "codAparelho"
    `;
    const [ equipamento2 ] = await sql`
      INSERT INTO "Equipamentos"
        ( "equipamento", "grupoUser", "soEq", "socketEq", "memoriaRam", "tipoOffice",
         "placaMae", "bios", "capacidadeRam", "possuiSSD", "possuiHD", "capacidadeArmz", "usoArmz" )
      VALUES
        ( 'DESKTOP POSITIVO MASTER D570', 'ESCRITÓRIO', 'WIN10', 'LGA1151', '8GB', 'M365',
         'POSITIVO H310', 'AMI BIOS 1.02', '8GB', true, true, '1TB', '80%' )
      RETURNING "codEquipamento"
    `;

    const [ ordemServico2 ] = await sql`
      INSERT INTO "OrdemDeServicos"
        ( "codCliente", "atendente", "codAparelho", "defeito", "obsBalcao", "tipoOdS",
         "codEquipamento", "situacao", "dtAtendimento", "dtExecucao", "historicoManutencao", "obsTecnica" )
      VALUES
        ( ${ carlos.codCliente }, 'JULIANA PEREIRA DIAS', ${ aparelho2.codAparelho },
         'LENTIDÃO EXCESSIVA', 'CLIENTE RELATA LENTIDÃO AO ABRIR PROGRAMAS', 'MANUTENÇÃO',
         ${ equipamento2.codEquipamento }, 'Em execução', now() - interval '2 days', now(),
         'MEMÓRIA RAM INSUFICIENTE PARA O USO RELATADO — RECOMENDADA TROCA/AMPLIAÇÃO.',
         'MEMÓRIA SUBSTITUÍDA E SISTEMA OTIMIZADO; DESEMPENHO NORMALIZADO NOS TESTES.' )
      RETURNING "numOdS"
    `;

    for ( let indice = 0; indice < checklist.length; indice++ )
    {
      const checagem = indice < 2;
      await sql`
        INSERT INTO "ProcedimentosOdS"
          ( "numOdS", "codProcedimento", "ordem", "posicao", "checagem", "obsProcedimento", "dthFim" )
        VALUES
          ( ${ ordemServico2.numOdS }, ${ checklist [ indice ] }, ${ indice + 1 }, 'INTERNO', ${ checagem },
           ${ checagem ? null : 'RESPOSTA INTERMITENTE — ENCAMINHADO PARA SUBSTITUIÇÃO FUTURA.' }, now() )
      `;
    }

    await sql`
      INSERT INTO "OrcamentoPecasOdS" ( "codPeca", "numOdS", "vlrPv", "aprovado" )
      VALUES ( ${ pecaMemoria.codPeca }, ${ ordemServico2.numOdS }, '180.00', true )
    `;

    await sql`
      INSERT INTO "ServicosOdS" ( "codServico", "numOdS", "qtdServico" )
      VALUES ( ${ servicoLimpeza.codServico }, ${ ordemServico2.numOdS }, 1 )
    `;

    await sql`
      INSERT INTO "SubstituirPecasOdS" ( "codPeca", "numOdS", "qtdPeca", "vlrUnitarioPeca" )
      VALUES ( ${ pecaMemoria.codPeca }, ${ ordemServico2.numOdS }, 1, 180.00 )
    `;
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

  console.log ( '  Parceiros (Fornecedores, Clientes, Veículos, Transportadoras)...' );
  await seedParceiros(estadoMap);
  console.log ( '  -> 2 fornecedores, 1 condição de pagamento, 2 clientes, 1 veículo, 1 transportadora.' );

  console.log ( '  Financeiro (Condições, Formas de Pagamento, Parcelas)...' );
  await seedFinanceiro();
  console.log ( '  -> 3 condições de pagamento, 4 formas de pagamento, 5 parcelas.' );

  console.log ( '  Contas a Pagar...' );
  await seedContasAPagar();
  console.log ( '  -> 3 contas a pagar.' );

  console.log ( '  Compras...' );
  await seedCompras();
  console.log ( '  -> 1 compra lançada com 2 itens.' );

  console.log ( '  Contas a Receber...' );
  await seedContasAReceber();
  console.log ( '  -> 2 contas a receber.' );

  console.log ( '  Recursos Humanos (Cargos, Funcionários, Serviços, Peças)...' );
  await seedRecursosHumanos();
  console.log ( '  -> 3 cargos, 3 funcionários, 3 serviços, 4 peças.' );

  console.log ( '  Procedimentos...' );
  const codProcedimentoMap = await seedProcedimentos();
  console.log ( `  -> ${PROCEDIMENTOS_LISTA.length} procedimentos.` );

  console.log ( '  Ordens de Serviço (Aparelhos, Equipamentos, OS)...' );
  await seedOrdensServico ( codProcedimentoMap );
  console.log ( '  -> 2 ordens de serviço (uma aberta, uma com diagnóstico e execução completos).' );

  console.log ( 'Seed concluído.' );
}

main()
  .catch ( ( e ) => {
    console.error ( 'Erro no seed:', e );
    process.exit ( 1 );
  } )
  .finally( () => sql.end() );
