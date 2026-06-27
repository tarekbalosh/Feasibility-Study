# نظام التصميم (Design System Specification)
## منصة Feasibility Suite - واجهة Tailwind CSS الموحدة

---

يمثل هذا المستند المرجع الفني والتصميمي لجميع عناصر الواجهة البرمجية لمنصة **Feasibility Suite**. يهدف النظام إلى ضمان هوية بصرية متميزة ومتسقة وتوفير تجربة مستخدم سلسة وراقية تدعم اللغة العربية (RTL).

---

### 1. نظام الألوان (Color System)

تم اختيار لوحة الألوان بعناية لتعكس الاستقرار المالي (الأخضر الزمردي) والمهنية العالية والثقة (الأزرق النيلي الداكن):

#### أ. الألوان الأساسية والثانوية (Primary & Secondary)
* **اللون الأساسي (Primary - Indigo):** يعبر عن الاحترافية والتقنية.
  * `Primary Main` (الرئيسي): `#4F46E5` (Tailwind: `indigo-600`)
  * `Primary Hover` (التفاعل): `#4338CA` (Tailwind: `indigo-700`)
  * `Primary Light` (الخلفيات): `#EEF2FF` (Tailwind: `indigo-50`)
* **اللون الثانوي (Secondary - Emerald):** يعبر عن المال والنمو والأرباح.
  * `Secondary Main`: `#10B981` (Tailwind: `emerald-500`)
  * `Secondary Hover`: `#059669` (Tailwind: `emerald-600`)
  * `Secondary Light`: `#ECFDF5` (Tailwind: `emerald-50`)

#### ب. الألوان المحايدة والخلفيات (Neutral Colors)
* `Background Page` (خلفية الصفحة): `#F8FAFC` (Tailwind: `slate-50`)
* `Card Background` (خلفية البطاقة): `#FFFFFF` (Tailwind: `white`)
* `Text Primary` (النص الرئيسي): `#0F172A` (Tailwind: `slate-900`)
* `Text Secondary` (النص الثانوي): `#475569` (Tailwind: `slate-600`)
* `Borders` (الحدود): `#E2E8F0` (Tailwind: `slate-200`)

#### ج. الألوان الدلالية (Semantic Colors)
* **النجاح (Success):** `#22C55E` (`green-500`) - للرسائل الإيجابية والأرباح المحققة.
* **الخطأ والخطورة (Danger):** `#EF4444` (`red-500`) - لحقول الإدخال الخاطئة والتنبيهات.
* **التحذير (Warning):** `#F59E0B` (`amber-500`) - للإرشادات الهامة.
* **المعلومات (Info):** `#3B82F6` (`blue-500`) - للملاحظات والشرح التوضيحي.

---

### 2. نظام الخطوط والكتابة (Typography Scale)

* **الخط الأساسي للموقع (Font Family):** **Cairo** أو **Tajawal** (من Google Fonts) كخط أساسي للغة العربية لضمان وضوح الحروف في الشاشات الصغيرة والكبيرة.
* **الخط البديل (Fallback):** `sans-serif`.

| الفئة (Category) | حجم الخط (Size) | الوزن (Weight) | ارتفاع السطر (Leading) | فئة Tailwind المقابلة |
| :--- | :--- | :--- | :--- | :--- |
| **العنوان الرئيسي (H1)** | 36px (2.25rem) | Bold (700) | `leading-tight` | `text-3xl md:text-4xl font-bold` |
| **عنوان قسم (H2)** | 24px (1.5rem) | Semi-Bold (600)| `leading-snug` | `text-xl md:text-2xl font-semibold` |
| **عنوان فرعي (H3)** | 18px (1.125rem) | Medium (500) | `leading-normal` | `text-lg font-medium` |
| **النص الأساسي (Body)**| 16px (1rem) | Regular (400) | `leading-relaxed`| `text-base font-normal` |
| **النص الصغير / تسمية**| 14px (0.875rem) | Regular (400) | `leading-normal` | `text-sm` |
| **النص الدقيق (Caption)**| 12px (0.75rem) | Medium (500) | `leading-none` | `text-xs` |

---

### 3. نظام المسافات والهوامش (Spacing System - 4px Base)

يتبع نظام المسافات مضاعفات الرقم 4 بكسل لضمان التناسق الهندسي للشبكة الرأسية والأفقية:
* **4px (0.25rem):** للـ Spacings الصغيرة جداً مثل الهامش بين الأيقونة والنص (`gap-1` / `p-1`).
* **8px (0.5rem):** للهوامش الداخلية للأزرار والعناصر الصغيرة (`p-2` / `gap-2`).
* **16px (1rem):** المسافة القياسية للمحيط الداخلي للبطاقات وحقول الإدخال (`p-4` / `m-4`).
* **24px (1.5rem):** للهوامش الكبيرة بين أجزاء البطاقة الواحدة (`p-6`).
* **48px (3rem):** للفصل بين الأقسام الرئيسية في الصفحة (`py-12` / `my-12`).
* **80px (5rem):** للفصل بين كتل الصفحة الكبرى كـ Hero والـ Footer (`py-20`).

---

### 4. مكونات تيلويند المتكررة والقابلة لإعادة الاستخدام (Reusable Tailwind Components)

#### أ. الأزرار (Buttons)
```html
<!-- الزر الرئيسي (Primary Button) -->
<button class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
  ابدأ الآن مجاناً
</button>

<!-- الزر الثانوي (Secondary Button) -->
<button class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2">
  شاهد العرض التوضيحي
</button>

<!-- زر الحدود المفرغ (Outline Button) -->
<button class="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 rounded-lg transition-colors duration-150">
  تصدير التقرير
</button>
```

#### ب. البطاقات (Cards)
```html
<!-- بطاقة ميزات أو معلومات قياسية -->
<div class="p-6 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-3">
  <div class="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
    <!-- Icon SVG here -->
  </div>
  <h3 class="text-lg font-semibold text-slate-900">حساب الأرباح التلقائي</h3>
  <p class="text-sm text-slate-600 leading-relaxed">احتسب فترة استرداد رأس مال مشروعك ونقاط التعادل ديناميكياً بضغطة زر واحدة.</p>
</div>
```

#### ج. الشارات التوضيحية (Badges)
```html
<!-- شارة التوصية للأكثر شعبية -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
  الأكثر شعبية
</span>

<!-- شارة الحالة المجانية -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
  نسخة تجريبية
</span>
```

#### د. حقول الإدخال (Inputs)
```html
<div class="flex flex-col gap-1.5 w-full">
  <label class="text-sm font-medium text-slate-700">البريد الإلكتروني</label>
  <input type="email" placeholder="example@domain.com" class="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-150" />
</div>
```

#### هـ. التنبيهات (Alerts)
```html
<div class="p-4 bg-red-50 border-r-4 border-red-500 rounded-lg flex items-start gap-3">
  <div class="text-red-500"><!-- Icon --></div>
  <div class="flex flex-col gap-1">
    <h4 class="text-sm font-semibold text-red-900">خطأ في البيانات المالية</h4>
    <p class="text-xs text-red-700">تجاوزت التكاليف التشغيلية حجم رأس المال الأولي. يرجى مراجعة الأرقام.</p>
  </div>
</div>
```

---

### 5. نقاط الاستجابة للتصميم المتجاوب (Responsive Breakpoints)

يتبع التصميم استراتيجية **Mobile-First** (تصميم الموبايل أولاً ثم الصعود للأكبر) بالاعتماد على نقاط التغيير القياسية لـ Tailwind CSS لضمان توافقية 100%:

| الشارة (Breakpoint) | المقاس الأدنى (Min Width) | الاستخدام الأساسي في المنصة |
| :--- | :--- | :--- |
| **`sm`** | 640px | الهواتف الكبيرة وعرض البطاقات في عمودين متجاورين. |
| **`md`** | 768px | الأجهزة اللوحية (Tablets)، وتفعيل القوائم الجانبية المفتوحة للمشروع. |
| **`lg`** | 1024px | شاشات الحواسيب المحمولة (Laptops)، وتحول القائمة العلوية من Hamburger إلى روابط كاملة. |
| **`xl`** | 1280px | الشاشات العريضة للحواسيب المكتبية (Desktop)، وتثبيت أقصى عرض لمحتوى الصفحة (`max-w-7xl`). |
