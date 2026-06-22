import 'dotenv/config';
import sql from '../lib/db';

// ============================================================
// T-021 — Seed geográfico
// Ordem de dependência: Paises → Estados → Cidades
// ============================================================

const BRASIL = { pais: 'Brasil', sigla: 'BRA', ddi: '+55', moeda: 'BRL' };

const ESTADOS = [
  { uf: 'AC', estado: 'Acre' },
  { uf: 'AL', estado: 'Alagoas' },
  { uf: 'AP', estado: 'Amapá' },
  { uf: 'AM', estado: 'Amazonas' },
  { uf: 'BA', estado: 'Bahia' },
  { uf: 'CE', estado: 'Ceará' },
  { uf: 'DF', estado: 'Distrito Federal' },
  { uf: 'ES', estado: 'Espírito Santo' },
  { uf: 'GO', estado: 'Goiás' },
  { uf: 'MA', estado: 'Maranhão' },
  { uf: 'MT', estado: 'Mato Grosso' },
  { uf: 'MS', estado: 'Mato Grosso do Sul' },
  { uf: 'MG', estado: 'Minas Gerais' },
  { uf: 'PA', estado: 'Pará' },
  { uf: 'PB', estado: 'Paraíba' },
  { uf: 'PR', estado: 'Paraná' },
  { uf: 'PE', estado: 'Pernambuco' },
  { uf: 'PI', estado: 'Piauí' },
  { uf: 'RJ', estado: 'Rio de Janeiro' },
  { uf: 'RN', estado: 'Rio Grande do Norte' },
  { uf: 'RS', estado: 'Rio Grande do Sul' },
  { uf: 'RO', estado: 'Rondônia' },
  { uf: 'RR', estado: 'Roraima' },
  { uf: 'SC', estado: 'Santa Catarina' },
  { uf: 'SP', estado: 'São Paulo' },
  { uf: 'SE', estado: 'Sergipe' },
  { uf: 'TO', estado: 'Tocantins' },
];

// Amostra representativa de cidades por UF (com DDD)
const CIDADES_POR_UF: Record<string, { cidade: string; ddd: string }[]> = {
  SP: [
    { cidade: 'São Paulo', ddd: '11' },
    { cidade: 'Campinas', ddd: '19' },
    { cidade: 'Ribeirão Preto', ddd: '16' },
    { cidade: 'Santos', ddd: '13' },
  ],
  RJ: [
    { cidade: 'Rio de Janeiro', ddd: '21' },
    { cidade: 'Niterói', ddd: '21' },
    { cidade: 'Petrópolis', ddd: '24' },
  ],
  MG: [
    { cidade: 'Belo Horizonte', ddd: '31' },
    { cidade: 'Uberlândia', ddd: '34' },
    { cidade: 'Contagem', ddd: '31' },
  ],
  RS: [
    { cidade: 'Porto Alegre', ddd: '51' },
    { cidade: 'Caxias do Sul', ddd: '54' },
    { cidade: 'Pelotas', ddd: '53' },
  ],
  PR: [
    { cidade: 'Curitiba', ddd: '41' },
    { cidade: 'Londrina', ddd: '43' },
    { cidade: 'Maringá', ddd: '44' },
  ],
  SC: [
    { cidade: 'Florianópolis', ddd: '48' },
    { cidade: 'Joinville', ddd: '47' },
    { cidade: 'Blumenau', ddd: '47' },
  ],
  BA: [
    { cidade: 'Salvador', ddd: '71' },
    { cidade: 'Feira de Santana', ddd: '75' },
    { cidade: 'Vitória da Conquista', ddd: '77' },
  ],
  PE: [
    { cidade: 'Recife', ddd: '81' },
    { cidade: 'Caruaru', ddd: '81' },
    { cidade: 'Olinda', ddd: '81' },
  ],
  CE: [
    { cidade: 'Fortaleza', ddd: '85' },
    { cidade: 'Caucaia', ddd: '85' },
    { cidade: 'Juazeiro do Norte', ddd: '88' },
  ],
  GO: [
    { cidade: 'Goiânia', ddd: '62' },
    { cidade: 'Aparecida de Goiânia', ddd: '62' },
    { cidade: 'Anápolis', ddd: '62' },
  ],
  DF: [{ cidade: 'Brasília', ddd: '61' }],
  AM: [
    { cidade: 'Manaus', ddd: '92' },
    { cidade: 'Parintins', ddd: '92' },
  ],
  PA: [
    { cidade: 'Belém', ddd: '91' },
    { cidade: 'Ananindeua', ddd: '91' },
  ],
};

// ============================================================
// T-022 — Seed de catálogo e parceiros
// Ordem: Categorias → Produtos → Fornecedores →
//        CondicaoDePagamento → Clientes → Veiculos → Transportadoras
// Nota: NCM_SH removido do escopo do projeto
// ============================================================

const CATEGORIAS_LISTA = [
  { categoria: 'Notebooks e Ultrabooks' },
  { categoria: 'Desktops e Workstations' },
  { categoria: 'Periféricos' },
  { categoria: 'Componentes' },
  { categoria: 'Cabos e Acessórios' },
  { categoria: 'Software e Licenças' },
];

async function seedGeografico(): Promise<Record<string, number>> {
  // Paises tem unique index em sigla — usa ON CONFLICT
  const [brasil] = await sql`
    INSERT INTO "Paises" ("pais", "sigla", "ddi", "moeda")
    VALUES (${BRASIL.pais}, ${BRASIL.sigla}, ${BRASIL.ddi}, ${BRASIL.moeda})
    ON CONFLICT ("sigla") DO UPDATE SET "pais" = EXCLUDED."pais"
    RETURNING "codPais"
  `;
  const codPais: number = brasil.codPais;

  const estadoMap: Record<string, number> = {};
  for (const est of ESTADOS)
  {
    const existing = await sql`
      SELECT "codEstado" FROM "Estados"
      WHERE "uf" = ${est.uf} AND "codPais" = ${codPais}
      LIMIT 1
    `;
    if (existing.length > 0)
    {
      estadoMap[est.uf] = existing[0].codEstado;
    }
    else
    {
      const [inserted] = await sql`
        INSERT INTO "Estados" ("codPais", "uf", "estado")
        VALUES (${codPais}, ${est.uf}, ${est.estado})
        RETURNING "codEstado"
      `;
      estadoMap[est.uf] = inserted.codEstado;
    }
  }

  for (const [uf, cidades] of Object.entries(CIDADES_POR_UF))
  {
    const codEstado = estadoMap[uf];
    if (!codEstado) continue;
    for (const { cidade, ddd } of cidades)
    {
      const existing = await sql`
        SELECT "codCidade" FROM "Cidades"
        WHERE "cidade" = ${cidade} AND "codEstado" = ${codEstado}
        LIMIT 1
      `;
      if (existing.length === 0)
      {
        await sql`
          INSERT INTO "Cidades" ("codEstado", "cidade", "ddd")
          VALUES (${codEstado}, ${cidade}, ${ddd})
        `;
      }
    }
  }

  return estadoMap;
}

async function seedCatalogo(estadoMap: Record<string, number>): Promise<Record<string, number>>
{
  const catMap: Record<string, number> = {};
  for (const cat of CATEGORIAS_LISTA)
  {
    const existing = await sql`
      SELECT "codCategoria" FROM "Categorias"
      WHERE "categoria" = ${cat.categoria}
      LIMIT 1
    `;
    if (existing.length > 0)
    {
      catMap[cat.categoria] = existing[0].codCategoria;
    }
    else
    {
      const [inserted] = await sql`
        INSERT INTO "Categorias" ("categoria")
        VALUES (${cat.categoria})
        RETURNING "codCategoria"
      `;
      catMap[cat.categoria] = inserted.codCategoria;
    }
  }

  const produtos = [
    { produto: 'Notebook Dell Inspiron 15 Core i5 16GB 512GB SSD', undProduto: 'UN', codCategoria: catMap['Notebooks e Ultrabooks'] },
    { produto: 'Desktop Positivo Master D570 Core i3 8GB 240GB SSD', undProduto: 'UN', codCategoria: catMap['Desktops e Workstations'] },
    { produto: 'Mouse Logitech MX Master 3S Sem Fio', undProduto: 'UN', codCategoria: catMap['Periféricos'] },
    { produto: 'SSD Kingston A400 480GB SATA III', undProduto: 'UN', codCategoria: catMap['Componentes'] },
    { produto: 'Cabo HDMI 2.0 4K 1,8m', undProduto: 'UN', codCategoria: catMap['Cabos e Acessórios'] },
  ];

  for (const prod of produtos)
  {
    const existing = await sql`
      SELECT "codProd" FROM "Produtos"
      WHERE "produto" = ${prod.produto}
      LIMIT 1
    `;
    if (existing.length === 0)
    {
      await sql`
        INSERT INTO "Produtos" ("produto", "undProduto", "codCategoria")
        VALUES (${prod.produto}, ${prod.undProduto}, ${prod.codCategoria})
      `;
    }
  }

  void estadoMap;
  return catMap;
}

async function seedParceiros(estadoMap: Record<string, number>): Promise<void>
{
  const [cidadeSP] = await sql`SELECT "codCidade" FROM "Cidades" WHERE "cidade" = 'São Paulo' LIMIT 1`;
  const [cidadeRJ] = await sql`SELECT "codCidade" FROM "Cidades" WHERE "cidade" = 'Rio de Janeiro' LIMIT 1`;
  const [cidadeCWB] = await sql`SELECT "codCidade" FROM "Cidades" WHERE "cidade" = 'Curitiba' LIMIT 1`;

  if (!cidadeSP || !cidadeRJ || !cidadeCWB)
  {
    throw new Error('Cidades de referência não encontradas — rode seedGeografico primeiro.');
  }

  // Fornecedores — dados sem máscara (CPF/CNPJ, CEP, fone em dígitos puros)
  let forn1Cod: number;
  const existForn1 = await sql`
    SELECT "codForn" FROM "Fornecedores" WHERE "cpfCnpjForn" = '12345678000190' LIMIT 1
  `;
  if (existForn1.length > 0)
  {
    forn1Cod = existForn1[0].codForn;
  }
  else
  {
    const [inserted] = await sql`
      INSERT INTO "Fornecedores"
        ("fornecedor", "nomeFantasia", "codCidade", "enderecoForn", "bairroForn",
         "cepForn", "foneForn", "cpfCnpjForn", "inscEstSubTrib")
      VALUES
        ('TechDistrib Informática Ltda', 'TechDistrib', ${cidadeSP.codCidade},
         'Av. Paulista, 726', 'Bela Vista', '01310100', '+551133331111',
         '12345678000190', '111111111111')
      RETURNING "codForn"
    `;
    forn1Cod = inserted.codForn;
  }

  const existForn2 = await sql`
    SELECT "codForn" FROM "Fornecedores" WHERE "cpfCnpjForn" = '98765432000110' LIMIT 1
  `;
  if (existForn2.length === 0)
  {
    await sql`
      INSERT INTO "Fornecedores"
        ("fornecedor", "nomeFantasia", "codCidade", "enderecoForn", "bairroForn",
         "cepForn", "foneForn", "cpfCnpjForn")
      VALUES
        ('InfoSul Distribuidora de TI Eireli', 'InfoSul TI', ${cidadeCWB.codCidade},
         'Rua XV de Novembro, 1000', 'Centro', '80060000', '+554122229999',
         '98765432000110')
    `;
  }

  // Condição de pagamento
  let codCondDePag: number;
  const existCond = await sql`
    SELECT "codCondDePag" FROM "CondicaoDePagamento" WHERE "descricao" = 'À Vista' LIMIT 1
  `;
  if (existCond.length > 0)
 {
    codCondDePag = existCond[0].codCondDePag;
  }
  else
  {
    const [inserted] = await sql`
      INSERT INTO "CondicaoDePagamento" ("descricao")
      VALUES ('À Vista')
      RETURNING "codCondDePag"
    `;
    codCondDePag = inserted.codCondDePag;
  }

  // Clientes — dados sem máscara
  const existCl1 = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'Ana Paula Lima' LIMIT 1
  `;
  if (existCl1.length === 0)
  {
    await sql`
      INSERT INTO "Clientes"
        ("cliente", "codCidade", "codCondDePag", "enderecoCl", "bairroCl", "cepCl", "foneCl")
      VALUES
        ('Ana Paula Lima', ${cidadeRJ.codCidade}, ${codCondDePag},
         'Rua das Flores, 45', 'Tijuca', '20511120', '+5521988887777')
    `;
  }

  const existCl2 = await sql`
    SELECT "codCliente" FROM "Clientes" WHERE "cliente" = 'Carlos Eduardo Santos' LIMIT 1
  `;
  if (existCl2.length === 0)
 {
    await sql`
      INSERT INTO "Clientes"
        ("cliente", "codCidade", "codCondDePag", "enderecoCl", "bairroCl", "cepCl", "foneCl")
      VALUES
        ('Carlos Eduardo Santos', ${cidadeSP.codCidade}, ${codCondDePag},
         'Av. Paulista, 1500', 'Bela Vista', '01310100', '+5511977776666')
    `;
  }

  // Veículo
  let codVeiculo: number;
  const existVeic = await sql`
    SELECT "codVeiculo" FROM "Veiculos" WHERE "placaVeiculo" = 'ABC1234' LIMIT 1
  `;
  if (existVeic.length > 0)
  {
    codVeiculo = existVeic[0].codVeiculo;
  }
  else
  {
    const [inserted] = await sql`
      INSERT INTO "Veiculos" ("placaVeiculo", "codAntt", "codEstado")
      VALUES ('ABC1234', 'RNTRC00001', ${estadoMap['SP']})
      RETURNING "codVeiculo"
    `;
    codVeiculo = inserted.codVeiculo;
  }

  // Transportadora
  const existTransp = await sql`
    SELECT "codTransp" FROM "Transportadoras" WHERE "cpfCnpjTransp" = '55555555000155' LIMIT 1
  `;
  if (existTransp.length === 0)
 {
    await sql`
      INSERT INTO "Transportadoras"
        ("transportadora", "codCidade", "codVeiculo", "enderecoTransp",
         "cpfCnpjTransp", "inscEstTransp")
      VALUES
        ('Expresso Rápido Cargas Ltda', ${cidadeSP.codCidade}, ${codVeiculo},
         'Rua dos Caminhões, 300', '55555555000155', '222222222222')
    `;
  }

  // Vínculo Produto ↔ Fornecedor
  const [prod1] = await sql`
    SELECT "codProd" FROM "Produtos"
    WHERE "produto" = 'Notebook Dell Inspiron 15 Core i5 16GB 512GB SSD'
    LIMIT 1
  `;
  if (prod1)
    {
    const existVinculo = await sql`
      SELECT 1 FROM "ProdutoFornecedor"
      WHERE "codProd" = ${prod1.codProd} AND "codForn" = ${forn1Cod}
      LIMIT 1
    `;
    if (existVinculo.length === 0)
    {
      await sql`
        INSERT INTO "ProdutoFornecedor" ("codProd", "codForn")
        VALUES (${prod1.codProd}, ${forn1Cod})
      `;
    }
  }
}

async function main()
{
  console.log('Iniciando seed...');

  console.log('  Geográfico (Países, Estados, Cidades)...');
  const estadoMap = await seedGeografico();
  console.log(`  -> 1 país, ${Object.keys(estadoMap).length} estados, cidades de ${Object.keys(CIDADES_POR_UF).length} UFs.`);

  console.log('  Catálogo (Categorias, Produtos)...');
  await seedCatalogo(estadoMap);
  console.log(`  -> ${CATEGORIAS_LISTA.length} categorias, 5 produtos.`);

  console.log('  Parceiros (Fornecedores, Clientes, Veículos, Transportadoras)...');
  await seedParceiros(estadoMap);
  console.log('  -> 2 fornecedores, 1 condição de pagamento, 2 clientes, 1 veículo, 1 transportadora.');

  console.log('Seed concluído.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => sql.end());
