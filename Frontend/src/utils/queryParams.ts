type Params = Record < string, string | number | null | undefined >;

export function buildQueryString ( params: Params ): string
{
  const entries = Object.entries ( params ).filter ( ( [ , value ] ) => value != null && value !== '' );

  if ( !entries.length )
  {
    return '';
  }

  return '?' + entries
    .map (
      ( [ key, value ] ) => `${ key }=${ encodeURIComponent ( String ( value ) ) }`
    )
    .join ( '&' );
}
