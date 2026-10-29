import { describe, it, expect, afterAll } from 'vitest';
import sql from '../../lib/db';
import withTestTransaction from '../helpers/db-helper';
import { CategoriasRepository } from '../../modules/categorias/categorias.repository';

const repo = new CategoriasRepository();

describe ( 'CategoriasRepository (rollback)', () =>
{
    afterAll ( async () =>
    {
        await sql.end();
    });

    it ( 'Create insere e FindById recupera dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create
            (
                { categoria: 'Categoria Teste' },
                1,
                transaction
            );

            expect ( nova.codCategoria ).toBeDefined();

            const achada = await repo.FindById ( nova.codCategoria, transaction );
            expect ( achada?.categoria ).toBe ( 'Categoria Teste' );
        });
    });

    it ( 'Update altera o nome da categoria dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create
            (
                { categoria: 'Original' },
                1,
                transaction
            );

            const atualizada = await repo.Update
            (
                nova.codCategoria,
                { categoria: 'Atualizada', isActive: true },
                1,
                transaction
            );

            expect ( atualizada?.categoria ).toBe ( 'Atualizada' );
        });
    });

    it ( 'Delete faz soft delete (isActive=false) dentro da transação', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create
            (
                { categoria: 'Para Excluir' },
                1,
                transaction
            );

            await repo.Delete ( nova.codCategoria, 1, transaction );

            const achada = await repo.FindById ( nova.codCategoria, transaction );
            expect ( achada?.isActive ).toBe ( false );

            const [ linhaCrua ] = await transaction < { isActive: boolean }[] >`
                SELECT "isActive" FROM "Categorias" WHERE "codCategoria" = ${ nova.codCategoria }
            `;

            expect ( linhaCrua ).toBeDefined();
            expect ( linhaCrua.isActive ).toBe ( false );
        });
    });

    it ( 'HasDependents retorna false quando não há produtos vinculados', async () =>
    {
        await withTestTransaction ( async ( transaction ) =>
        {
            const nova = await repo.Create
            (
                { categoria: 'Sem Produtos' },
                1,
                transaction
            );

            const temDependentes = await repo.HasDependents ( nova.codCategoria, transaction );
            expect ( temDependentes ).toBe ( false );
        });
    });
});
