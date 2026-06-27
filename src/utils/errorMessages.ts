/**
 * Map an Axios or generic error to a user‑friendly Arabic message.
 * The function accepts the raw error object (AxiosError, fetch error, etc.)
 * and returns a string that can be displayed in a toast.
 */
export const mapError = (error: any): string => {
  // Axios error shape
  if (error?.response) {
    const status = error.response.status as number;
    switch (status) {
      case 400:
        return 'الطلب غير صالح';
      case 401:
        return 'غير مصرح. الرجاء تسجيل الدخول';
      case 403:
        return 'ليس لديك الصلاحية للقيام بهذا الإجراء';
      case 404:
        return 'المورد غير موجود';
      case 409:
        return 'تعارض في العملية (مثل وجود مستخدم مسبقاً)';
      case 422:
        return 'قيمة غير صالحة في أحد الحقول';
      case 500:
        return 'خطأ داخلي في الخادم، يرجى المحاولة لاحقاً';
      case 502:
      case 503:
      case 504:
        return 'الخدمة غير متوفرة حالياً، حاول مرة أخرى لاحقاً';
      default:
        return `خطأ غير معروف (رمز ${status})`;
    }
  }

  // Network error – no response received
  if (error?.isAxiosError && !error.response) {
    return 'فشل الاتصال بالإنترنت؛ يرجى التحقق من الشبكة';
  }

  // Fallback generic message
  return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى';
};
