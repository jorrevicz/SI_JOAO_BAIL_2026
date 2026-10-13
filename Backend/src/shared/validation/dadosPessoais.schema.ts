import { z } from 'zod';

// Campos de dados pessoais comuns a Clientes e Fornecedores. O que vale para cada
// pessoa depende do tipoPessoa (ver validarDadosPessoais):
//  - FISICA:   apelido, rg, dtNascimento, genero
//  - JURIDICA: nomeFantasia, dtFundacao
// foneFixo e email valem para os dois tipos.

const dataIso = ( mensagem: string ) => z
    .string ( { message: mensagem } )
    .trim()
    .regex ( /^\d{4}-\d{2}-\d{2}$/, mensagem )
    .refine
    (
        ( valor ) =>
        {
            const data = new Date ( `${ valor }T00:00:00.000Z` );
            return !Number.isNaN ( data.getTime() ) && data.toISOString().startsWith ( valor );
        },
        mensagem
    )
    .refine
    (
        ( valor ) => valor <= new Date().toISOString().slice ( 0, 10 ),
        'A data não pode estar no futuro.'
    );

export const camposDadosPessoais =
{
    apelido: z
        .string()
        .trim()
        .max ( 60, 'O apelido deve ter no máximo 60 caracteres.' )
        .nullish(),
    rg: z
        .string()
        .trim()
        .max ( 20, 'O RG deve ter no máximo 20 caracteres.' )
        .nullish(),
    nomeFantasia: z
        .string()
        .trim()
        .max ( 60, 'O nome fantasia deve ter no máximo 60 caracteres.' )
        .nullish(),
    dtNascimento: dataIso ( 'A data de nascimento é inválida.' ).nullish(),
    dtFundacao:   dataIso ( 'A data de fundação é inválida.' ).nullish(),
    genero: z
        .enum ( [ 'MASCULINO', 'FEMININO', 'OUTRO' ], { message: 'Gênero inválido.' } )
        .nullish(),
    foneFixo: z
        .string()
        .trim()
        .regex ( /^[0-9]{10,15}$/, 'O telefone fixo deve conter apenas números, com DDI/DDD e o número (ex: 551133334444).' )
        .refine ( ( valor ) => !/^0+$/.test ( valor ), 'O telefone fixo não pode ser preenchido apenas com zeros.' )
        .nullish(),
    email: z
        .string ( { message: 'O e-mail é obrigatório.' } )
        .trim()
        .min ( 1, 'O e-mail é obrigatório.' )
        .max ( 254, 'O e-mail deve ter no máximo 254 caracteres.' )
        .regex ( /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'O e-mail é inválido.' ),
};

interface DadosPessoais
{
    tipoPessoa:    'FISICA' | 'JURIDICA';
    dtNascimento?: string | null;
    dtFundacao?:   string | null;
    genero?:       string | null;
}

// RN: pessoa física exige data de nascimento e gênero; pessoa jurídica exige data de
// fundação. Cruza campos com o tipoPessoa, por isso vive num superRefine (mesmo padrão
// de validarDatas em contas-pagamento.schema.ts).
export function validarDadosPessoais
(
    dados: DadosPessoais,
    ctx:   z.RefinementCtx
): void
{
    if ( dados.tipoPessoa === 'FISICA' )
    {
        if ( !dados.dtNascimento )
        {
            ctx.addIssue ( { code: 'custom', path: [ 'dtNascimento' ], message: 'A data de nascimento é obrigatória.' } );
        }

        if ( !dados.genero )
        {
            ctx.addIssue ( { code: 'custom', path: [ 'genero' ], message: 'O gênero é obrigatório.' } );
        }
    }
    else if ( !dados.dtFundacao )
    {
        ctx.addIssue ( { code: 'custom', path: [ 'dtFundacao' ], message: 'A data de fundação é obrigatória.' } );
    }
}

// Zera os campos que só fazem sentido no outro tipo de pessoa, para o banco não
// guardar (por exemplo) apelido de uma pessoa que passou a ser jurídica.
export function limparCamposDoOutroTipo < T extends DadosPessoais & { apelido?: string | null; nomeFantasia?: string | null; rg?: string | null } >
(
    dados: T
): T
{
    if ( dados.tipoPessoa === 'FISICA' )
    {
        return { ...dados, nomeFantasia: null, dtFundacao: null };
    }

    return { ...dados, apelido: null, rg: null, genero: null, dtNascimento: null };
}
