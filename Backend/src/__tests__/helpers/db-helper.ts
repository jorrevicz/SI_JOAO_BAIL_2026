import sql from '../../lib/db';
import type postgres from 'postgres';

class TestRollBack extends Error
{
    constructor()
    {
        super ( 'testRollBack' );
    }
}

export default async function withTestTransaction < T > 
(
    callback: ( transaction: postgres.TransactionSql ) => Promise < T >,

): Promise < T >
{
    let result!: T;
    try 
    {
        await sql.begin ( async ( transaction ) => {
            
            result = await callback ( transaction );
            throw new TestRollBack()
        });
    }
    catch ( err )
    {
        if ( ! ( err instanceof TestRollBack ) )
        {
            throw  err;
        } 
    }
    
    return result;
}