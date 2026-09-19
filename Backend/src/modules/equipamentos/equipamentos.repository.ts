import type postgres from 'postgres';
import sql from '../../lib/db';
import type Equipamentos from '../../db/types/public/Equipamentos';

export type CreateEquipamentoInput = {
    equipamento:    string;
    grupoUser?:     string | null;
    soEq:           string;
    socketEq:       string;
    memoriaRam:     string;
    tipoOffice:     string;
    placaMae:       string;
    bios:           string;
    capacidadeRam:  string;
    possuiSSD:      boolean;
    possuiHD:       boolean;
    capacidadeArmz: string;
    usoArmz:        string;
};

export class EquipamentosRepository
{
    async FindById
    (
        id: number,
        transaction?: postgres.TransactionSql

    ): Promise < Equipamentos | null >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Equipamentos[] >`
            SELECT *
            FROM "Equipamentos"
            WHERE "codEquipamento" = ${ id }
            AND "isActive" = true
        `;

        return row ?? null;
    };

    async Create
    (
        equipamento: CreateEquipamentoInput,
        codUser: number,
        transaction?: postgres.TransactionSql

    ): Promise < Equipamentos >
    {
        const client = transaction ?? sql;
        const [ row ] = await client < Equipamentos[] >`
            INSERT INTO "Equipamentos"
            (
                "equipamento",
                "grupoUser",
                "soEq",
                "socketEq",
                "memoriaRam",
                "tipoOffice",
                "placaMae",
                "bios",
                "capacidadeRam",
                "possuiSSD",
                "possuiHD",
                "capacidadeArmz",
                "usoArmz",
                "codUser"
            )
            VALUES
            (
                ${ equipamento.equipamento },
                ${ equipamento.grupoUser ?? null },
                ${ equipamento.soEq },
                ${ equipamento.socketEq },
                ${ equipamento.memoriaRam },
                ${ equipamento.tipoOffice },
                ${ equipamento.placaMae },
                ${ equipamento.bios },
                ${ equipamento.capacidadeRam },
                ${ equipamento.possuiSSD },
                ${ equipamento.possuiHD },
                ${ equipamento.capacidadeArmz },
                ${ equipamento.usoArmz },
                ${ codUser }
            )
            RETURNING *
        `;

        return row;
    };
}
