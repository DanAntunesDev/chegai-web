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
  PLAN_LIMIT_REACHED: 'O plano atual chegou no limite. Fale com o suporte para ampliar.',
  CUSTOMER_PHONE_TAKEN: 'Já existe um cliente com esse telefone.',
  CATEGORY_NAME_TAKEN: 'Já existe uma categoria com esse nome.',
  LAST_UNIT: 'A barbearia precisa ter pelo menos uma unidade.',
  WORKING_HOURS_OVERLAP: 'Há horários sobrepostos no mesmo dia.',
  UNIT_NOT_ASSIGNED: 'Esse profissional não atende nessa unidade.',
  SERVICE_NOT_FOUND: 'Serviço não encontrado.',
  STAFF_NOT_FOUND: 'Profissional não encontrado.',
};

export function serverFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED') {
    return {};
  }
  const details = Array.isArray(error.details) ? error.details : [];
  const result: Record<string, string> = {};
  for (const item of details as { path?: unknown; message?: unknown }[]) {
    if (typeof item.path === 'string' && typeof item.message === 'string') {
      const key = item.path.split('.')[0] ?? item.path;
      result[key] ??= translateIssue(item.message);
    }
  }
  return result;
}

function translateIssue(message: string): string {
  if (message.includes('Brazilian phone')) {
    return 'Telefone inválido. Use DDD + número.';
  }
  if (message.includes('lowercase letters')) {
    return 'Use letras minúsculas, números e hífen.';
  }
  return 'Valor inválido.';
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? error.message;
  }
  return 'Algo deu errado. Tente novamente.';
}
