# مواصفات مكونات واجهة الأداة (Tool UI Components Specification)
## منصة Feasibility Suite - مكتبة مكونات المعالج

---

تستعرض هذه الوثيقة التفاصيل الهيكلية والرموز البرمجية الجاهزة (بواسطة Tailwind CSS) لمكونات واجهة أداة إنشاء دراسات الجدوى لضمان سهولة وسرعة تطويرها من قِبل مهندسي الواجهات الأمامية.

---

### 1. مكون شريط الخطوات (Progress Stepper Component)

مكون بصري مرن يعبر عن حالة تقدم العميل ويوزع أفقياً مع خطوط رابطة بين الدوائر الرقمية:

```html
<div class="w-full py-6">
  <div class="flex items-center justify-between w-full max-w-3xl mx-auto font-sans" dir="rtl">
    <!-- الخطوة 1: مكتملة -->
    <div class="flex items-center text-emerald-600 relative">
      <div class="rounded-full transition duration-500 ease-in-out h-10 w-10 py-3 border-2 border-emerald-500 bg-emerald-500 text-white flex items-center justify-center font-bold">
        ✓
      </div>
      <div class="absolute top-0 -mr-6 text-center mt-12 w-24 text-xs font-semibold uppercase text-emerald-600">
        المشروع
      </div>
    </div>
    
    <!-- خط الربط المكتمل -->
    <div class="flex-auto border-t-2 transition duration-500 ease-in-out border-emerald-500"></div>
    
    <!-- الخطوة 2: نشطة حالياً -->
    <div class="flex items-center text-indigo-600 relative">
      <div class="rounded-full transition duration-500 ease-in-out h-10 w-10 py-3 border-2 border-indigo-600 bg-indigo-50 flex items-center justify-center font-bold shadow-sm shadow-indigo-100 animate-pulse">
        2
      </div>
      <div class="absolute top-0 -mr-6 text-center mt-12 w-24 text-xs font-bold uppercase text-indigo-600">
        البيانات المالية
      </div>
    </div>
    
    <!-- خط الربط غير المكتمل -->
    <div class="flex-auto border-t-2 transition duration-500 ease-in-out border-slate-200"></div>
    
    <!-- الخطوة 3: قيد الانتظار -->
    <div class="flex items-center text-slate-400 relative">
      <div class="rounded-full transition duration-500 ease-in-out h-10 w-10 py-3 border-2 border-slate-200 bg-white flex items-center justify-center font-bold">
        3
      </div>
      <div class="absolute top-0 -mr-6 text-center mt-12 w-24 text-xs font-semibold uppercase text-slate-400">
        التحليل المالي
      </div>
    </div>
    
    <!-- خط الربط غير المكتمل -->
    <div class="flex-auto border-t-2 transition duration-500 ease-in-out border-slate-200"></div>
    
    <!-- الخطوة 4: قيد الانتظار -->
    <div class="flex items-center text-slate-400 relative">
      <div class="rounded-full transition duration-500 ease-in-out h-10 w-10 py-3 border-2 border-slate-200 bg-white flex items-center justify-center font-bold">
        4
      </div>
      <div class="absolute top-0 -mr-6 text-center mt-12 w-24 text-xs font-semibold uppercase text-slate-400">
        التقرير والـ AI
      </div>
    </div>
    
    <!-- خط الربط غير المكتمل -->
    <div class="flex-auto border-t-2 transition duration-500 ease-in-out border-slate-200"></div>
    
    <!-- الخطوة 5: قيد الانتظار -->
    <div class="flex items-center text-slate-400 relative">
      <div class="rounded-full transition duration-500 ease-in-out h-10 w-10 py-3 border-2 border-slate-200 bg-white flex items-center justify-center font-bold">
        5
      </div>
      <div class="absolute top-0 -mr-6 text-center mt-12 w-24 text-xs font-semibold uppercase text-slate-400">
        التصدير
      </div>
    </div>
  </div>
</div>
```

---

### 2. مكون إدخال المبالغ وتنسيق الأرقام (Financial Input Component)

حقل مخصص لجمع القيم المالية، يحتوي على رمز العملة مدمجاً في جهة اليسار (أو اليمين حسب اتجاه الكتابة) ليعرف العميل الفئة المالية المحددة بوضوح:

```html
<div class="flex flex-col gap-1.5 w-full max-w-md" dir="rtl">
  <label class="text-sm font-semibold text-slate-700">رأس المال التأسيسي المستهدف</label>
  <div class="relative rounded-lg shadow-sm">
    <!-- حقل الإدخال الرقمي -->
    <input 
      type="text" 
      name="capital" 
      id="capital" 
      placeholder="0.00" 
      class="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-left font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all duration-150"
    />
    <!-- شارة العملة المدمجة بالطرف الأيسر لحقل الإدخال -->
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-l border-slate-200 bg-slate-50 rounded-l-lg px-3 text-slate-500 font-medium text-sm">
      SAR
    </div>
  </div>
  <p class="text-xs text-slate-400">أدخل القيمة الإجمالية شاملة التراخيص والتجهيزات الأولية.</p>
</div>
```

---

### 3. مكون شاشة الانتظار وتوليد الـ AI (AI Loading State Component)

شاشة انتظار تظهر في منتصف الصفحة وتحتوي على مؤشر دوار مع نصوص متفاعلة لإبقاء المستخدم على اطلاع:

```html
<div class="w-full max-w-lg mx-auto p-8 bg-white border border-slate-100 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center gap-6" dir="rtl">
  <!-- المؤشر الدوار المزدوج -->
  <div class="relative flex items-center justify-center h-20 w-20">
    <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
    <div class="absolute animate-ping rounded-full h-10 w-10 bg-indigo-50 opacity-75"></div>
  </div>
  
  <div class="flex flex-col gap-2">
    <h3 class="text-lg font-bold text-slate-900 animate-pulse">جاري صياغة دراسة الجدوى...</h3>
    <!-- نص متغير بالـ JavaScript -->
    <p id="loading-status-text" class="text-sm text-slate-500 h-6 transition-all duration-300">
      الذكاء الاصطناعي يقوم الآن بمسح قطاع السوق المستهدف وتحديد المنافسين...
    </p>
  </div>
  
  <!-- شريط التقدم الخطي التقريبي -->
  <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
    <div class="bg-indigo-600 h-2 rounded-full animate-pulse" style="width: 65%"></div>
  </div>
  <span class="text-xs text-slate-400 font-mono">الزمن المقدر المتبقي: 12 ثانية</span>
</div>
```

---

### 4. مكون عرض النتائج والمؤشرات المالية (Results Display Component)

مكون يعرض المؤشرات المالية الثلاثة الكبرى ببطاقات ملونة تعكس قيمة الأرقام المحتسبة:

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto" dir="rtl">
  <!-- بطاقة فترة استرداد رأس المال -->
  <div class="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-sm flex flex-col gap-1">
    <span class="text-xs uppercase font-medium tracking-wide text-indigo-100">فترة الاسترداد التقديرية</span>
    <h2 class="text-3xl font-black font-mono">14 شهر</h2>
    <p class="text-xs text-indigo-100 mt-2">الوقت المتوقع لاستعادة كامل رأس المال التأسيسي.</p>
  </div>
  
  <!-- بطاقة نقطة التعادل الشهرية -->
  <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col gap-1">
    <span class="text-xs uppercase font-semibold text-slate-500">نقطة التعادل (Break-even)</span>
    <h2 class="text-3xl font-black text-slate-900 font-mono">8,500 <span class="text-sm font-bold text-slate-500">SAR</span></h2>
    <p class="text-xs text-slate-400 mt-2">المبيعات الشهرية المطلوبة لتغطية المصاريف التشغيلية.</p>
  </div>
  
  <!-- بطاقة معدل العائد الداخلي (IRR) -->
  <div class="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm flex flex-col gap-1">
    <span class="text-xs uppercase font-bold text-emerald-800">معدل العائد الداخلي (IRR)</span>
    <h2 class="text-3xl font-black text-emerald-600 font-mono">38.4%</h2>
    <p class="text-xs text-emerald-700 mt-2">مؤشر جاذبية المشروع ومقارنته بالفرص البديلة.</p>
  </div>
</div>
```

---

### 5. مكون أزرار التصدير والمشاركة (Export Buttons Component)

أزرار كبيرة بتصميم بارز لتسهيل تصدير وحفظ ومشاركة دراسة الجدوى الناتجة:

```html
<div class="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto" dir="rtl">
  <!-- زر تحميل PDF رئيسي -->
  <button class="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-100 transition-all duration-200">
    <!-- PDF SVG Icon -->
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    تحميل الدراسة كملف PDF
  </button>
  
  <!-- زر تصدير Excel ثانوي -->
  <button class="flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all duration-200">
    <!-- Excel SVG Icon -->
    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    تصدير الجداول لـ Excel
  </button>
  
  <!-- زر مشاركة الرابط المفرغ -->
  <button class="flex items-center justify-center gap-3 w-full md:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 rounded-xl transition-all duration-150">
    <!-- Share SVG Icon -->
    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 10.742l4.778-2.39m0 5.296l-4.778-2.39M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    رابط مشاركة مباشر
  </button>
</div>
```
