import axios from 'axios';

export class ApiError extends Error
{
  erros?: Record < string, string >;

  constructor ( mensagem: string, erros?: Record < string, string > )
  {
    super ( mensagem );
    this.name  = 'ApiError';
    this.erros = erros;
  }
}

const api = axios.create ({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

api.interceptors.response.use (
  ( resposta ) => resposta,
  ( error ) =>
  {
    const mensagem = error.response?.data?.mensagem ?? 'Erro de comunicação com o servidor.';
    const erros    = error.response?.data?.erros as Record < string, string > | undefined;
    return Promise.reject ( new ApiError ( mensagem, erros ) );
  },
);

export default api;
