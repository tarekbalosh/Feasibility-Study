/**
 * Custom API Error class
 * يتوافق مع هيكل الخطأ الموحد المعرّف في api-design.md
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Array<{ field: string; issue: string }>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // ——— Factory Methods ———

  static badRequest(message: string, details?: Array<{ field: string; issue: string }>) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static invalidInput(message: string, details?: Array<{ field: string; issue: string }>) {
    return new ApiError(400, "INVALID_INPUT_DATA", message, details);
  }

  static authRequired(message = "يجب تسجيل الدخول للوصول إلى هذا المورد.") {
    return new ApiError(401, "AUTH_REQUIRED", message);
  }

  static authExpired(message = "انتهت صلاحية رمز الدخول. يرجى تسجيل الدخول مجدداً.") {
    return new ApiError(401, "AUTH_EXPIRED", message);
  }

  static accessDenied(message = "ليس لديك صلاحية الوصول لهذا المورد.") {
    return new ApiError(403, "ACCESS_DENIED", message);
  }

  static insufficientLimits(message = "لقد استنفدت الحد المسموح لتوليد الدراسات هذا الشهر.") {
    return new ApiError(403, "INSUFFICIENT_LIMITS", message);
  }

  static notFound(message = "المورد المطلوب غير موجود.") {
    return new ApiError(404, "RESOURCE_NOT_FOUND", message);
  }

  static rateLimitExceeded(message = "تم تجاوز الحد الأقصى للطلبات. حاول مجدداً لاحقاً.") {
    return new ApiError(429, "RATE_LIMIT_EXCEEDED", message);
  }

  static aiServiceError(message = "فشل في الاتصال بخدمة الذكاء الاصطناعي.") {
    return new ApiError(500, "AI_SERVICE_ERROR", message);
  }

  static databaseError(message = "حدث خطأ في قاعدة البيانات.") {
    return new ApiError(500, "DATABASE_ERROR", message);
  }

  static internal(message = "حدث خطأ داخلي غير متوقع.") {
    return new ApiError(500, "SERVER_ERROR", message);
  }
}
