# وثيقة تصميم واجهة برمجة التطبيقات (API Design Document)
## منصة SaaS الذكية لإنشاء دراسات الجدوى بالذكاء الاصطناعي (Feasibility Suite)

---

### 1. قائمة مسارات واجهة التطبيق (API Endpoints List)

تتبع واجهة التطبيق معيار **REST API** وتصدر استجاباتها بصيغة **JSON**. جميع المسارات تبدأ بـ `/api/v1`.

| تصنيف المسار | الطريقة (Method) | المسار (Path) | الوصف | يتطلب توثيق؟ (Auth) |
| :--- | :--- | :--- | :--- | :--- |
| **المصادقة** | `POST` | `/auth/signup` | إنشاء حساب مستخدم جديد | لا |
| | `POST` | `/auth/login` | تسجيل الدخول وتوليد رمز JWT | لا |
| | `GET` | `/auth/me` | استرجاع معلومات الحساب الحالية | نعم (Bearer Token) |
| **المشاريع ودراسات الجدوى** | `GET` | `/projects` | جلب جميع المشاريع الخاصة بالمستخدم | نعم (Bearer Token) |
| | `POST` | `/projects` | إنشاء دراسة جدوى جديدة وتوليد بياناتها بالـ AI | نعم (Bearer Token) |
| | `GET` | `/projects/:id` | جلب تفاصيل دراسة جدوى محددة بالمعرف | نعم (Bearer Token) |
| | `PUT` | `/projects/:id` | تحديث بيانات أو نصوص دراسة الجدوى | نعم (Bearer Token) |
| | `DELETE` | `/projects/:id` | حذف دراسة الجدوى نهائياً | نعم (Bearer Token) |
| **المشاركة العامة** | `POST` | `/projects/:id/share` | تفعيل/إلغاء رابط المشاركة العام للدراسة | نعم (Bearer Token) |
| | `GET` | `/shared/projects/:shareToken` | عرض دراسة الجدوى العامة للقراءة فقط | لا |
| **الاشتراكات والمدفوعات** | `POST` | `/payments/checkout` | إنشاء جلسة دفع آمنة عبر Stripe | نعم (Bearer Token) |
| | `POST` | `/payments/webhook` | معالجة إشعارات الدفع الفورية من Stripe | لا (توقيع Stripe) |

---

### 2. نماذج الطلب والاستجابة (Request/Response Examples)

#### 2.1 إنشاء حساب مستخدم جديد (`POST /auth/signup`)

* **طلب (Request Payload):**
```json
{
  "name": "سارة أحمد",
  "email": "sara@example.com",
  "password": "StrongPassword123!"
}
```

* **استجابة ناجحة (Response - `201 Created`):**
```json
{
  "success": true,
  "message": "تم تسجيل الحساب بنجاح. يرجى مراجعة بريدك الإلكتروني لتنشيط الحساب.",
  "data": {
    "userId": "usr_90a8b7c6d5",
    "name": "سارة أحمد",
    "email": "sara@example.com",
    "isVerified": false,
    "createdAt": "2026-06-12T03:50:00Z"
  }
}
```

---

#### 2.2 تسجيل الدخول (`POST /auth/login`)

* **طلب (Request Payload):**
```json
{
  "email": "sara@example.com",
  "password": "StrongPassword123!"
}
```

* **استجابة ناجحة (Response - `200 OK`):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c3JfOTBhOGI3YzZkNSIsIm5hbWUiOiLYs9inMemory...",
  "data": {
    "userId": "usr_90a8b7c6d5",
    "name": "سارة أحمد",
    "email": "sara@example.com",
    "subscriptionStatus": "free"
  }
}
```

---

#### 2.3 إنشاء دراسة جدوى جديدة (`POST /projects`)

* **طلب (Request Payload):**
```json
{
  "name": "متجر زهور الربيع الإلكتروني",
  "industry": "e-commerce",
  "location": "الرياض، السعودية",
  "currency": "SAR",
  "targetCapital": 50000,
  "durationYears": 3,
  "description": "متجر يبيع الورد الطبيعي المنسق عبر الإنترنت مع توصيل سريع في نفس اليوم وتصميم هدايا مخصصة.",
  "financialInputs": {
    "rent": 0,
    "salaries": 4000,
    "marketing": 1500,
    "supplies": 2000,
    "averageOrderValue": 150,
    "estimatedOrdersPerMonth": 120
  }
}
```

* **استجابة ناجحة (Response - `201 Created`):**
```json
{
  "success": true,
  "data": {
    "projectId": "proj_1a2b3c4d5e",
    "name": "متجر زهور الربيع الإلكتروني",
    "industry": "e-commerce",
    "location": "الرياض، السعودية",
    "currency": "SAR",
    "status": "completed",
    "aiOutput": {
      "marketAnalysis": "يتميز قطاع التجارة الإلكترونية للزهور في الرياض بنمو مرتفع يبلغ 15% سنوياً...",
      "competitors": [
        {"name": "متجر وردي", "strengths": "تغطية واسعة", "weaknesses": "أسعار مرتفعة"},
        {"name": "بستان الهدايا", "strengths": "تغليف مميز", "weaknesses": "تأخير في التوصيل"}
      ],
      "swotAnalysis": {
        "strengths": "تكلفة تأسيسية منخفضة لعدم وجود متجر فيزيائي.",
        "weaknesses": "الاعتماد الكامل على شركات التوصيل الخارجية.",
        "opportunities": "شراكات مع شركات تنظيم الحفلات والمناسبات.",
        "threats": "دخول منافسين جدد بسهولة إلى السوق الرقمي."
      }
    },
    "financialOutput": {
      "monthlyFixedCosts": 5500,
      "monthlyExpectedRevenue": 18000,
      "monthlyNetProfit": 12500,
      "breakEvenPointMonthly": 37,
      "paybackPeriodMonths": 4,
      "irr": 45.2,
      "npv": 154000
    },
    "createdAt": "2026-06-12T04:00:00Z"
  }
}
```

---

#### 2.4 تفعيل رابط المشاركة العام (`POST /projects/:id/share`)

* **طلب (Request Payload):**
```json
{
  "isShared": true
}
```

* **استجابة ناجحة (Response - `200 OK`):**
```json
{
  "success": true,
  "message": "تم تفعيل رابط المشاركة بنجاح.",
  "data": {
    "projectId": "proj_1a2b3c4d5e",
    "isShared": true,
    "shareToken": "sha_7f8g9h0j1k2l3m4n5o",
    "shareUrl": "https://feasibility-suite.com/shared/projects/sha_7f8g9h0j1k2l3m4n5o"
  }
}
```

---

### 3. رموز أخطاء النظام (System Error Codes)

تتبع المنصة المعايير الموحدة للـ **HTTP Status Codes** لإبلاغ العميل بنتيجة العملية، ويكون هيكل الخطأ الموحد كالتالي:

#### هيكل الخطأ البرمجي الموحد (Error Body Format):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT_DATA",
    "message": "البيانات المدخلة غير صحيحة، يرجى التحقق من القيم وإعادة المحاولة.",
    "details": [
      {
        "field": "targetCapital",
        "issue": "يجب أن تكون القيمة أكبر من صفر."
      }
    ]
  }
}
```

#### قائمة رموز الأخطاء المستعملة (HTTP & Application Error Codes):

| HTTP Status | كود التطبيق الداخلي (Code) | السيناريو والمسبب |
| :--- | :--- | :--- |
| **`400 Bad Request`** | `INVALID_INPUT_DATA` | إدخال بيانات خاطئة أو غير مستوفية للشروط المطلوبة (Validation Error). |
| | `BAD_REQUEST` | صياغة الطلب أو الـ Body خاطئة هيكلياً. |
| **`401 Unauthorized`**| `AUTH_EXPIRED` | رمز الـ JWT الممرر منتهي الصلاحية. |
| | `AUTH_REQUIRED` | لم يتم تمرير الـ JWT token في الترويسة (Header). |
| **`403 Forbidden`** | `INSUFFICIENT_LIMITS` | انتهاء ليميت خطة المستخدم المتاحة لتوليد الدراسات. |
| | `ACCESS_DENIED` | محاولة المستخدم الوصول لدراسة جدوى لا يملك صلاحية عليها. |
| **`404 Not Found`** | `RESOURCE_NOT_FOUND` | دراسة الجدوى أو المستخدم المطلوب غير موجود في قاعدة البيانات. |
| **`429 Too Many Requests`**| `RATE_LIMIT_EXCEEDED`| تخطي الحد الأقصى لعدد الطلبات المسموح بها في الدقيقة لحماية الخادم. |
| **`500 Internal Server`**| `AI_SERVICE_ERROR` | فشل في الاتصال بخوادم OpenAI وتوليد النصوص بالذكاء الاصطناعي. |
| | `DATABASE_ERROR` | مشكلة أو عطل في قاعدة البيانات أثناء التخزين أو الاستعلام. |
| | `SERVER_ERROR` | خطأ داخلي غير متوقع في الخادم الرئيسي. |
