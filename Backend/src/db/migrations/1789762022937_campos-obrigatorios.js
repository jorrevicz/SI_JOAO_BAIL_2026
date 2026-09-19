/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Torna obrigatórios (NOT NULL) campos que antes eram opcionais em várias entidades.
 * Registros existentes com valor nulo são preenchidos com um placeholder neutro antes
 * de aplicar a restrição, para não quebrar dados de teste já semeados.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = ( pgm ) => {
  pgm.sql ( `
    -- Clientes — tipo de pessoa, CEP e telefone
    UPDATE "Clientes" SET "tipoPessoa" = 'FISICA' WHERE "tipoPessoa" IS NULL;
    UPDATE "Clientes" SET "cepCl"      = '00000000' WHERE "cepCl" IS NULL;
    UPDATE "Clientes" SET "foneCl"     = '+00000000000' WHERE "foneCl" IS NULL;
    ALTER TABLE "Clientes"
      ALTER COLUMN "tipoPessoa" SET NOT NULL,
      ALTER COLUMN "cepCl"      SET NOT NULL,
      ALTER COLUMN "foneCl"     SET NOT NULL;

    -- Veículos — modelo, marca e código ANTT
    UPDATE "Veiculos" SET "modeloVeiculo" = 'NÃO INFORMADO' WHERE "modeloVeiculo" IS NULL;
    UPDATE "Veiculos" SET "marca"         = 'NÃO INFORMADA' WHERE "marca" IS NULL;
    UPDATE "Veiculos" SET "codAntt"       = '00000000' WHERE "codAntt" IS NULL;
    ALTER TABLE "Veiculos"
      ALTER COLUMN "modeloVeiculo" SET NOT NULL,
      ALTER COLUMN "marca"         SET NOT NULL,
      ALTER COLUMN "codAntt"       SET NOT NULL;

    -- Transportadoras — tipo de pessoa, CPF/CNPJ e inscrição estadual
    UPDATE "Transportadoras" SET "tipoPessoa"     = 'JURIDICA' WHERE "tipoPessoa" IS NULL;
    UPDATE "Transportadoras" SET "cpfCnpjTransp"  = '00000000000000' WHERE "cpfCnpjTransp" IS NULL;
    UPDATE "Transportadoras" SET "inscEstTransp"  = '000000000000' WHERE "inscEstTransp" IS NULL;
    ALTER TABLE "Transportadoras"
      ALTER COLUMN "tipoPessoa"    SET NOT NULL,
      ALTER COLUMN "cpfCnpjTransp" SET NOT NULL,
      ALTER COLUMN "inscEstTransp" SET NOT NULL;

    -- Fornecedores — tipo de pessoa, CEP, telefone, CPF/CNPJ e inscrição estadual
    UPDATE "Fornecedores" SET "tipoPessoa"     = 'JURIDICA' WHERE "tipoPessoa" IS NULL;
    UPDATE "Fornecedores" SET "cepForn"        = '00000000' WHERE "cepForn" IS NULL;
    UPDATE "Fornecedores" SET "foneForn"       = '+00000000000' WHERE "foneForn" IS NULL;
    UPDATE "Fornecedores" SET "cpfCnpjForn"    = '00000000000000' WHERE "cpfCnpjForn" IS NULL;
    UPDATE "Fornecedores" SET "inscEstSubTrib" = '000000000000' WHERE "inscEstSubTrib" IS NULL;
    ALTER TABLE "Fornecedores"
      ALTER COLUMN "tipoPessoa"     SET NOT NULL,
      ALTER COLUMN "cepForn"        SET NOT NULL,
      ALTER COLUMN "foneForn"       SET NOT NULL,
      ALTER COLUMN "cpfCnpjForn"    SET NOT NULL,
      ALTER COLUMN "inscEstSubTrib" SET NOT NULL;

    -- Produtos — unidade, peso bruto e peso líquido (estoque/custoMedioProd já são NOT NULL)
    UPDATE "Produtos" SET "undProduto" = 'UN' WHERE "undProduto" IS NULL;
    UPDATE "Produtos" SET "pesoBruto"  = 0    WHERE "pesoBruto"  IS NULL;
    UPDATE "Produtos" SET "pesoLiq"    = 0    WHERE "pesoLiq"    IS NULL;
    ALTER TABLE "Produtos"
      ALTER COLUMN "undProduto" SET NOT NULL,
      ALTER COLUMN "pesoBruto"  SET NOT NULL,
      ALTER COLUMN "pesoLiq"    SET NOT NULL;

    -- Cidades — DDD
    UPDATE "Cidades" SET "ddd" = '00' WHERE "ddd" IS NULL;
    ALTER TABLE "Cidades"
      ALTER COLUMN "ddd" SET NOT NULL;

    -- Países — DDI e moeda
    UPDATE "Paises" SET "ddi"   = '0' WHERE "ddi" IS NULL;
    UPDATE "Paises" SET "moeda" = 'XXX' WHERE "moeda" IS NULL;
    ALTER TABLE "Paises"
      ALTER COLUMN "ddi"   SET NOT NULL,
      ALTER COLUMN "moeda" SET NOT NULL;

    -- Forma de Pagamento — prazo de compensação
    UPDATE "FormaDePagamento" SET "prazoCompensacao" = 0 WHERE "prazoCompensacao" IS NULL;
    ALTER TABLE "FormaDePagamento"
      ALTER COLUMN "prazoCompensacao" SET NOT NULL;
  ` );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = ( pgm ) => {
  pgm.sql ( `
    ALTER TABLE "Clientes"
      ALTER COLUMN "tipoPessoa" DROP NOT NULL,
      ALTER COLUMN "cepCl"      DROP NOT NULL,
      ALTER COLUMN "foneCl"     DROP NOT NULL;

    ALTER TABLE "Veiculos"
      ALTER COLUMN "modeloVeiculo" DROP NOT NULL,
      ALTER COLUMN "marca"         DROP NOT NULL,
      ALTER COLUMN "codAntt"       DROP NOT NULL;

    ALTER TABLE "Transportadoras"
      ALTER COLUMN "tipoPessoa"    DROP NOT NULL,
      ALTER COLUMN "cpfCnpjTransp" DROP NOT NULL,
      ALTER COLUMN "inscEstTransp" DROP NOT NULL;

    ALTER TABLE "Fornecedores"
      ALTER COLUMN "tipoPessoa"     DROP NOT NULL,
      ALTER COLUMN "cepForn"        DROP NOT NULL,
      ALTER COLUMN "foneForn"       DROP NOT NULL,
      ALTER COLUMN "cpfCnpjForn"    DROP NOT NULL,
      ALTER COLUMN "inscEstSubTrib" DROP NOT NULL;

    ALTER TABLE "Produtos"
      ALTER COLUMN "undProduto" DROP NOT NULL,
      ALTER COLUMN "pesoBruto"  DROP NOT NULL,
      ALTER COLUMN "pesoLiq"    DROP NOT NULL;

    ALTER TABLE "Cidades"
      ALTER COLUMN "ddd" DROP NOT NULL;

    ALTER TABLE "Paises"
      ALTER COLUMN "ddi"   DROP NOT NULL,
      ALTER COLUMN "moeda" DROP NOT NULL;

    ALTER TABLE "FormaDePagamento"
      ALTER COLUMN "prazoCompensacao" DROP NOT NULL;
  ` );
};
