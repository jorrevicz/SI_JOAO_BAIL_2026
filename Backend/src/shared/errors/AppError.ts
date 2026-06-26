export class AppError extends Error 
{
  constructor
  (
    public readonly mensagem: string,
    public readonly status: number = 400,
  ) 
  {
    super ( mensagem );
    this.name = 'AppError';
  }
}
