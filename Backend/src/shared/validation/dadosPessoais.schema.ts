import { z } from 'zod';

// Campos de dados pessoais comuns a Clientes, Fornecedores e Transportadoras. O que vale
// para cada pessoa depende do tipoPessoa (ver limparCamposDoOutroTipo):
//  - FISICA:   apelido, rg, dtNascimento, genero
//  - JURIDICA: nomeFantasia, dtFundacao
// Todos esses campos são anuláveis — nenhum é obrigatório para o seu tipo de pessoa; quando
// informados, só o formato é validado. foneFixo e email valem para os dois tipos.

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
