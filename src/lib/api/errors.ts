export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static async from(response: Response): Promise<ApiError> {
    const body = (await response.json().catch(() => null)) as Partial<ErrorBody> | null;
    return new ApiError(
      response.status,
      typeof body?.code === 'string' ? body.code : 'HTTP_ERROR',
      typeof body?.message === 'string' ? body.message : response.statusText,
      body?.details,
    );
  }
}

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'E-mail ou senha incorretos.',
  TOTP_REQUIRED: 'Digite o código do seu aplicativo autenticador.',
  INVALID_TOTP: 'Código inválido. Confira o horário do celular e tente de novo.',
  TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
  SLUG_TAKEN: 'Esse endereço já está em uso por outra barbearia.',
  PERMISSION_DENIED: 'Você não tem permissão para isso.',
  PLATFORM_ADMIN_REQUIRED: 'Área restrita à administração da plataforma.',
  MFA_REQUIRED: 'Ative a verificação em duas etapas para continuar.',
  TENANT_BLOCKED: 'Acesso suspenso por pendência financeira.',
  VALIDATION_FAILED: 'Confira os campos destacados.',
  NETWORK_ERROR: 'Não foi possível falar com o servidor. Verifique sua conexão.',
};

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? error.message;
  }
  return 'Algo deu errado. Tente novamente.';
}
