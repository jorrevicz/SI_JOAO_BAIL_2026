import type postgres from 'postgres';
import sql from '../../lib/db';
import type Aparelhos from '../../db/types/public/Aparelhos';

export type CreateAparelhoInput = {
    aparelho?: string | null;
    serie?:    string | null;
    modelo:    string;
    voltagem:  string;
    garantia:  string;
};

export class AparelhosRepository
{
    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Aparelhos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Aparelhos[] >`
            SELECT *
            FROM "Aparelhos"
            WHERE "codAparelho" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        aparelho: CreateAparelhoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Aparelhos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Aparelhos[] >`
            INSERT INTO "Aparelhos"
            (
                "aparelho",
                "serie",
                "modelo",
                "voltagem",
                "garantia",
                "codUser"
            )
            VALUES
            (
                ${ aparelho.aparelho ?? null },
                ${ aparelho.serie ?? null },
                ${ aparelho.modelo },
                ${ aparelho.voltagem },
                ${ aparelho.garantia },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };
}
