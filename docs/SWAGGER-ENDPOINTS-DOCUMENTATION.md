# توثيق شامل لجميع نقاط النهاية (API Endpoints) - منصة قرآن يُتلى

## 📖 معلومات عامة

- **رابط Swagger**: `http://localhost:3777/api/docs`
- **نظام المصادقة**: Bearer Token (JWT)
- **الإصدار**: v1
- **الـ Base URL**: `http://localhost:3777/api/v1`

---

## 🔐 1. Authentication (المصادقة)

### 1.1 تسجيل الدخول
- **Endpoint**: `POST /api/v1/auth/login`
- **الوصف**: تسجيل دخول المستخدم (طالب، معلم، ولي أمر، أو مدير)
- **الصلاحيات**: متاح للجميع (Public)
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: يعيد Access Token و Refresh Token

### 1.2 تسجيل طالب جديد
- **Endpoint**: `POST /api/v1/auth/sign-up`
- **الوصف**: تسجيل حساب جديد للطالب
- **الصلاحيات**: متاح للجميع (Public)
- **Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "password123",
    "phoneNumber": "+201234567890",
    "firstName": "أحمد",
    "lastName": "محمد",
    "dateOfBirth": "2010-01-01",
    "gender": "male",
    "country": "egypt"
  }
  ```
- **Response**: يعيد بيانات المستخدم و Student Code

### 1.3 تسجيل ولي أمر
- **Endpoint**: `POST /api/v1/auth/sign-up/parent`
- **الوصف**: تسجيل حساب جديد لولي الأمر باستخدام كود الطالب
- **الصلاحيات**: متاح للجميع (Public)
- **Body**:
  ```json
  {
    "email": "parent@example.com",
    "password": "password123",
    "phoneNumber": "+201234567890",
    "firstName": "محمد",
    "lastName": "أحمد",
    "studentCode": "STD-123456"
  }
  ```

### 1.4 تسجيل معلم
- **Endpoint**: `POST /api/v1/auth/sign-up/teacher`
- **الوصف**: تسجيل حساب جديد للمعلم
- **الصلاحيات**: متاح للجميع (Public)
- **Body**:
  ```json
  {
    "email": "teacher@example.com",
    "password": "password123",
    "phoneNumber": "+201234567890",
    "firstName": "عبدالله",
    "lastName": "حسن",
    "qualifications": "شهادة في علوم القرآن",
    "experience": "5 سنوات"
  }
  ```

### 1.5 الحصول على بيانات المستخدم الحالي
- **Endpoint**: `GET /api/v1/auth/get-me`
- **الوصف**: استرجاع بيانات المستخدم الحالي
- **الصلاحيات**: يتطلب تسجيل دخول (أي دور)
- **Headers**: `Authorization: Bearer {token}`

### 1.6 تحديث Token
- **Endpoint**: `POST /api/v1/auth/refresh-token`
- **الوصف**: تحديث Access Token باستخدام Refresh Token
- **الصلاحيات**: متاح للجميع
- **Body**:
  ```json
  {
    "refreshToken": "refresh_token_here"
  }
  ```

### 1.7 تسجيل الخروج
- **Endpoint**: `POST /api/v1/auth/logout`
- **الوصف**: تسجيل خروج المستخدم وإبطال Refresh Token
- **الصلاحيات**: يتطلب تسجيل دخول
- **Headers**: `Authorization: Bearer {token}`

### 1.8 التحقق من البريد الإلكتروني (OTP)
- **Endpoint**: `POST /api/v1/auth/verify-otp`
- **الوصف**: التحقق من رمز OTP المرسل للبريد الإلكتروني
- **الصلاحيات**: متاح للجميع
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```

### 1.9 إعادة إرسال OTP
- **Endpoint**: `POST /api/v1/auth/resend-otp`
- **الوصف**: إعادة إرسال رمز التحقق OTP
- **الصلاحيات**: متاح للجميع
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 1.10 نسيت كلمة المرور (الخطوة 1)
- **Endpoint**: `POST /api/v1/auth/forget-password`
- **الوصف**: إرسال رمز التحقق لاستعادة كلمة المرور
- **الصلاحيات**: متاح للجميع
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```

### 1.11 تحديث كلمة المرور (الخطوة النهائية)
- **Endpoint**: `POST /api/v1/auth/update-password`
- **الوصف**: تحديث كلمة المرور بعد التحقق من OTP
- **الصلاحيات**: يتطلب Password Reset Token
- **Headers**: `Authorization: Bearer {password_reset_token}`
- **Body**:
  ```json
  {
    "newPassword": "newPassword123"
  }
  ```

### 1.12 تغيير كلمة المرور
- **Endpoint**: `POST /api/v1/auth/change-password`
- **الوصف**: تغيير كلمة المرور للمستخدم المسجل
- **الصلاحيات**: يتطلب تسجيل دخول
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "oldPassword": "oldPassword123",
    "newPassword": "newPassword123"
  }
  ```

---

## 👥 2. Users (المستخدمين)

### 2.1 الحصول على قائمة المستخدمين
- **Endpoint**: `GET /api/v1/user`
- **الوصف**: الحصول على قائمة المستخدمين مع pagination وفلترة
- **الصلاحيات**: متاح للجميع المسجلين
- **Query Parameters**:
  - `page`: رقم الصفحة (افتراضي: 1)
  - `limit`: عدد النتائج (افتراضي: 10)
  - `role`: الدور (student, teacher, parent, admin)
  - `search`: البحث بالاسم أو البريد

### 2.2 إحصائيات المستخدمين (Admin)
- **Endpoint**: `GET /api/v1/user/admin/statistics`
- **الوصف**: الحصول على إحصائيات شاملة للمستخدمين
- **الصلاحيات**: Admin فقط
- **Response**:
  ```json
  {
    "totalUsers": 1000,
    "activeUsers": 850,
    "students": 700,
    "teachers": 50,
    "parents": 200,
    "admins": 5
  }
  ```

### 2.3 إيقاف حساب مستخدم (Admin)
- **Endpoint**: `PATCH /api/v1/user/:id/suspend`
- **الوصف**: إيقاف حساب مستخدم مؤقتاً
- **الصلاحيات**: Admin فقط
- **Body**:
  ```json
  {
    "reason": "انتهاك شروط الاستخدام"
  }
  ```

### 2.4 تفعيل حساب موقوف (Admin)
- **Endpoint**: `PATCH /api/v1/user/:id/activate`
- **الوصف**: إعادة تفعيل حساب مستخدم موقوف
- **الصلاحيات**: Admin فقط

### 2.5 حذف حساب نهائياً (Admin)
- **Endpoint**: `DELETE /api/v1/user/:id/permanent`
- **الوصف**: حذف حساب مستخدم نهائياً من النظام
- **الصلاحيات**: Admin فقط

### 2.6 الحصول على بيانات مستخدم محدد
- **Endpoint**: `GET /api/v1/user/:id`
- **الوصف**: الحصول على بيانات مستخدم بواسطة ID
- **الصلاحيات**: يتطلب تسجيل دخول

### 2.7 حذف حساب (Soft Delete)
- **Endpoint**: `DELETE /api/v1/user/:id`
- **الوصف**: حذف حساب المستخدم (soft delete)
- **الصلاحيات**: يتطلب تسجيل دخول

### 2.8 ربط طفل بولي الأمر
- **Endpoint**: `POST /api/v1/user/link-parent`
- **الوصف**: ربط طفل واحد بولي الأمر باستخدام كود الطالب
- **الصلاحيات**: Parent فقط
- **Body**:
  ```json
  {
    "studentCode": "STD-123456"
  }
  ```

### 2.9 ربط عدة أطفال بولي الأمر
- **Endpoint**: `POST /api/v1/user/link-multiple-children`
- **الوصف**: ربط عدة أطفال بولي الأمر باستخدام أكواد الطلاب
- **الصلاحيات**: Parent فقط
- **Body**:
  ```json
  {
    "studentCodes": ["STD-123456", "STD-789012"]
  }
  ```

### 2.10 قائمة أطفال ولي الأمر
- **Endpoint**: `GET /api/v1/user/children`
- **الوصف**: الحصول على قائمة جميع الأطفال المربوطين بولي الأمر
- **الصلاحيات**: Parent فقط

### 2.11 ربط طالب بالمعلم
- **Endpoint**: `POST /api/v1/user/link-teacher`
- **الوصف**: ربط طالب بالمعلم
- **الصلاحيات**: Teacher فقط
- **Body**:
  ```json
  {
    "studentId": 123
  }
  ```

### 2.12 قائمة طلاب المعلم
- **Endpoint**: `GET /api/v1/user/students`
- **الوصف**: الحصول على قائمة جميع الطلاب المربوطين بالمعلم
- **الصلاحيات**: Teacher فقط

---

## 📿 3. Quran (القرآن الكريم)

### 3.1 جميع السور
- **Endpoint**: `GET /api/v1/quran/surahs`
- **الوصف**: الحصول على قائمة جميع السور (114 سورة)
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `language`: اللغة (ar أو en، افتراضي: ar)

### 3.2 جزء محدد
- **Endpoint**: `GET /api/v1/quran/juz/:juzNumber`
- **الوصف**: الحصول على جزء محدد (1-30) مع pagination
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `page`: رقم الصفحة
  - `limit`: عدد الآيات
  - `language`: اللغة

### 3.3 سورة محددة
- **Endpoint**: `GET /api/v1/quran/surah/:surahNumber`
- **الوصف**: الحصول على سورة محددة (1-114) مع pagination
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `page`: رقم الصفحة
  - `limit`: عدد الآيات
  - `language`: اللغة

### 3.4 آية محددة من سورة
- **Endpoint**: `GET /api/v1/quran/surah/:surahNumber/ayah/:ayahNumber`
- **الوصف**: الحصول على آية محددة من سورة محددة
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `language`: اللغة

### 3.5 آية محددة برقم عام
- **Endpoint**: `GET /api/v1/quran/ayah/:ayahNumber`
- **الوصف**: الحصول على آية محددة برقمها العام (1-6236)
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `language`: اللغة

### 3.6 صفحة محددة
- **Endpoint**: `GET /api/v1/quran/page/:pageNumber`
- **الوصف**: الحصول على صفحة محددة (1-604)
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `language`: اللغة

### 3.7 البحث في القرآن
- **Endpoint**: `GET /api/v1/quran/search/:keyword`
- **الوصف**: البحث عن كلمة أو نص في القرآن الكريم
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `page`: رقم الصفحة
  - `limit`: عدد النتائج
  - `language`: اللغة

### 3.8 جزء كامل بدون pagination
- **Endpoint**: `GET /api/v1/quran/juz/:juzNumber/complete`
- **الوصف**: الحصول على جزء كامل بدون pagination
- **الصلاحيات**: متاح للجميع (Public)

### 3.9 سورة كاملة بدون pagination
- **Endpoint**: `GET /api/v1/quran/surah/:surahNumber/complete`
- **الوصف**: الحصول على سورة كاملة بدون pagination
- **الصلاحيات**: متاح للجميع (Public)

### 3.10 بحث كامل بدون pagination
- **Endpoint**: `GET /api/v1/quran/search/:keyword/complete`
- **الوصف**: البحث الكامل بدون pagination
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `language`: اللغة
  - `surah`: تحديد سورة معينة للبحث فيها

---

## 🎵 4. Quran Audio (الصوتيات)

### 4.1 روابط الصوتيات لنطاق آيات
- **Endpoint**: `POST /api/v1/quran-audio/get-audio-links`
- **الوصف**: الحصول على روابط تسجيلات صوتية لنطاق من الآيات
- **الصلاحيات**: متاح للجميع (Public)
- **Body**:
  ```json
  {
    "reciter": "ar.alafasy",
    "surahNumber": 1,
    "fromAyah": 1,
    "toAyah": 7
  }
  ```

### 4.2 صوت آية واحدة
- **Endpoint**: `POST /api/v1/quran-audio/get-single-ayah-audio`
- **الوصف**: الحصول على رابط تسجيل صوتي لآية واحدة
- **الصلاحيات**: متاح للجميع (Public)
- **Body**:
  ```json
  {
    "reciter": "ar.alafasy",
    "surahNumber": 1,
    "ayahNumber": 1
  }
  ```

### 4.3 قائمة القراء (المشايخ)
- **Endpoint**: `GET /api/v1/quran-audio/reciters`
- **الوصف**: الحصول على قائمة القراء المتاحين
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `page`: رقم الصفحة
  - `limit`: عدد النتائج

### 4.4 صوت سورة كاملة
- **Endpoint**: `POST /api/v1/quran-audio/get-surah-audio`
- **الوصف**: الحصول على رابط تسجيل صوتي لسورة كاملة
- **الصلاحيات**: متاح للجميع (Public)
- **Body**:
  ```json
  {
    "reciter": "ar.alafasy",
    "surahNumber": 1
  }
  ```

---

## 💳 5. Plans (الباقات)

### 5.1 إنشاء باقة جديدة (Admin)
- **Endpoint**: `POST /api/v1/plans`
- **الوصف**: إنشاء باقة اشتراك جديدة
- **الصلاحيات**: Admin فقط
- **Body**:
  ```json
  {
    "nameAr": "الباقة الأساسية",
    "nameEn": "Basic Plan",
    "descriptionAr": "باقة للمبتدئين",
    "descriptionEn": "Plan for beginners",
    "priceEGP": 100,
    "priceSAR": 50,
    "priceUSD": 10,
    "duration": 30,
    "sessionsPerMonth": 10,
    "sessionDuration": 30,
    "features": ["AI Evaluation", "Teacher Support"],
    "country": "egypt",
    "isActive": true
  }
  ```

### 5.2 جميع الباقات النشطة
- **Endpoint**: `GET /api/v1/plans`
- **الوصف**: الحصول على جميع الباقات النشطة
- **الصلاحيات**: متاح للجميع (Public)
- **Query Parameters**:
  - `country`: فلترة حسب الدولة (egypt, saudi_arabia, other)

### 5.3 جميع الباقات بما فيها غير النشطة (Admin)
- **Endpoint**: `GET /api/v1/plans/admin/all`
- **الوصف**: الحصول على جميع الباقات للمدير
- **الصلاحيات**: Admin فقط

### 5.4 باقة محددة
- **Endpoint**: `GET /api/v1/plans/:id`
- **الوصف**: الحصول على تفاصيل باقة محددة
- **الصلاحيات**: متاح للجميع (Public)

### 5.5 تحديث باقة (Admin)
- **Endpoint**: `PATCH /api/v1/plans/:id`
- **الوصف**: تحديث بيانات باقة
- **الصلاحيات**: Admin فقط

### 5.6 تبديل حالة الباقة (Admin)
- **Endpoint**: `PATCH /api/v1/plans/:id/toggle-active`
- **الوصف**: تفعيل أو إلغاء تفعيل باقة
- **الصلاحيات**: Admin فقط

### 5.7 حذف باقة (Admin)
- **Endpoint**: `DELETE /api/v1/plans/:id`
- **الوصف**: حذف باقة
- **الصلاحيات**: Admin فقط

---

## 🔄 6. Subscriptions (الاشتراكات)

### 6.1 بدء عملية الدفع
- **Endpoint**: `POST /api/v1/subscriptions/initiate-payment`
- **الوصف**: بدء عملية دفع اشتراك جديد (يعيد رابط الدفع)
- **الصلاحيات**: Student فقط
- **Body**:
  ```json
  {
    "planId": 1
  }
  ```
- **Response**:
  ```json
  {
    "subscriptionId": 123,
    "paymentUrl": "https://payment.gateway.com/checkout/session_123",
    "sessionId": "session_123",
    "amount": 100
  }
  ```

### 6.2 التحقق من الدفع
- **Endpoint**: `POST /api/v1/subscriptions/verify-payment`
- **الوصف**: التحقق من الدفع وتفعيل الاشتراك
- **الصلاحيات**: Student فقط
- **Body**:
  ```json
  {
    "subscriptionId": 123,
    "transactionId": "txn_123456"
  }
  ```

### 6.3 Webhook من Paymob
- **Endpoint**: `POST /api/v1/subscriptions/webhook/paymob`
- **الوصف**: نقطة نهاية لاستقبال إشعارات الدفع من Paymob
- **الصلاحيات**: Public (مع توقيع webhook)

### 6.4 اشتراك مباشر (Deprecated)
- **Endpoint**: `POST /api/v1/subscriptions/subscribe`
- **الوصف**: إنشاء اشتراك مباشر (غير مستخدم حالياً)
- **الصلاحيات**: Student فقط
- **ملاحظة**: استخدم `/initiate-payment` بدلاً منه

### 6.5 اشتراك المستخدم الحالي
- **Endpoint**: `GET /api/v1/subscriptions/me`
- **الوصف**: الحصول على الاشتراك النشط للمستخدم الحالي
- **الصلاحيات**: Student فقط

### 6.6 سجل الاشتراكات
- **Endpoint**: `GET /api/v1/subscriptions/me/history`
- **الوصف**: الحصول على جميع اشتراكات المستخدم السابقة والحالية
- **الصلاحيات**: Student فقط

### 6.7 فحص إمكانية التسجيل
- **Endpoint**: `GET /api/v1/subscriptions/me/check`
- **الوصف**: فحص إمكانية تسجيل تلاوة جديدة
- **الصلاحيات**: Student فقط
- **Response**:
  ```json
  {
    "canRecord": true,
    "remainingSessions": 8,
    "sessionDuration": 30
  }
  ```

### 6.8 إلغاء الاشتراك
- **Endpoint**: `PATCH /api/v1/subscriptions/me/cancel`
- **الوصف**: إلغاء الاشتراك الحالي
- **الصلاحيات**: Student فقط
- **Body**:
  ```json
  {
    "reason": "سبب الإلغاء"
  }
  ```

### 6.9 تفعيل اشتراك (Admin)
- **Endpoint**: `PATCH /api/v1/subscriptions/:id/activate`
- **الوصف**: تفعيل اشتراك يدوياً
- **الصلاحيات**: Admin فقط

### 6.10 تفاصيل اشتراك محدد (Admin)
- **Endpoint**: `GET /api/v1/subscriptions/:id`
- **الوصف**: الحصول على تفاصيل اشتراك محدد
- **الصلاحيات**: Admin فقط

### 6.11 إيقاف اشتراك (Admin)
- **Endpoint**: `PATCH /api/v1/subscriptions/:id/suspend`
- **الوصف**: إيقاف اشتراك مؤقتاً
- **الصلاحيات**: Admin فقط
- **Body**:
  ```json
  {
    "reason": "سبب الإيقاف"
  }
  ```

### 6.12 استئناف اشتراك موقوف (Admin)
- **Endpoint**: `PATCH /api/v1/subscriptions/:id/resume`
- **الوصف**: إعادة تفعيل اشتراك موقوف
- **الصلاحيات**: Admin فقط

### 6.13 إلغاء اشتراك بواسطة المدير (Admin)
- **Endpoint**: `PATCH /api/v1/subscriptions/:id/cancel-by-admin`
- **الوصف**: إلغاء اشتراك بواسطة المدير
- **الصلاحيات**: Admin فقط
- **Body**:
  ```json
  {
    "reason": "سبب الإلغاء"
  }
  ```

### 6.14 تجديد اشتراك يدوياً (Admin)
- **Endpoint**: `PATCH /api/v1/subscriptions/:id/renew`
- **الوصف**: تجديد اشتراك لشهر إضافي يدوياً
- **الصلاحيات**: Admin فقط

---

## 🎙️ 7. Recitations (التلاوات)

### 7.1 رفع تسجيل تلاوة
- **Endpoint**: `POST /api/v1/recitations/upload`
- **الوصف**: رفع ملف صوتي لتلاوة
- **الصلاحيات**: Student فقط (يتطلب اشتراك نشط)
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `audio`: ملف صوتي (MP3, WAV, M4A - حجم أقصى 100MB)
  - `surahId`: رقم السورة (1-114)
  - `fromAyah`: رقم الآية الأولى
  - `toAyah`: رقم الآية الأخيرة
  - `notes`: ملاحظات اختيارية

### 7.2 تسجيل تلاوة مباشرة
- **Endpoint**: `POST /api/v1/recitations/record-direct`
- **الوصف**: رفع تسجيل مباشر من التطبيق
- **الصلاحيات**: Student فقط (يتطلب اشتراك نشط)
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `audioBlob`: ملف صوتي من MediaRecorder
  - `surahId`: رقم السورة
  - `fromAyah`: رقم الآية الأولى
  - `toAyah`: رقم الآية الأخيرة
  - `notes`: ملاحظات
  - `audioFormat`: نوع الملف (webm, mp4, wav)

### 7.3 تلاواتي
- **Endpoint**: `GET /api/v1/recitations/me`
- **الوصف**: الحصول على قائمة تلاواتي مع pagination
- **الصلاحيات**: Student فقط
- **Query Parameters**:
  - `page`: رقم الصفحة
  - `limit`: عدد النتائج
  - `status`: حالة التلاوة (pending, completed, failed)
  - `surahId`: فلترة حسب السورة

### 7.4 إحصائيات تلاواتي
- **Endpoint**: `GET /api/v1/recitations/me/statistics`
- **الوصف**: الحصول على إحصائيات تلاواتي
- **الصلاحيات**: Student فقط
- **Response**:
  ```json
  {
    "totalRecitations": 50,
    "completedRecitations": 45,
    "averageScore": 85.5,
    "totalDuration": 18000,
    "recitationsBySurah": {
      "1": 5,
      "2": 3
    }
  }
  ```

### 7.5 نظرة عامة على أطفال ولي الأمر
- **Endpoint**: `GET /api/v1/recitations/parent/children`
- **الوصف**: نظرة عامة على جميع الأطفال وتلاواتهم
- **الصلاحيات**: Parent فقط

### 7.6 تلاوات طفل محدد
- **Endpoint**: `GET /api/v1/recitations/parent/children/:childId/recitations`
- **الوصف**: الحصول على تلاوات طفل محدد
- **الصلاحيات**: Parent فقط

### 7.7 إحصائيات طفل محدد
- **Endpoint**: `GET /api/v1/recitations/parent/children/:childId/statistics`
- **الوصف**: الحصول على إحصائيات طفل محدد
- **الصلاحيات**: Parent فقط

### 7.8 نظرة عامة على طلاب المعلم
- **Endpoint**: `GET /api/v1/recitations/teacher/students`
- **الوصف**: نظرة عامة على جميع الطلاب وتلاواتهم
- **الصلاحيات**: Teacher فقط

### 7.9 تلاوات طالب محدد
- **Endpoint**: `GET /api/v1/recitations/teacher/students/:studentId/recitations`
- **الوصف**: الحصول على تلاوات طالب محدد
- **الصلاحيات**: Teacher فقط

### 7.10 إحصائيات طالب محدد
- **Endpoint**: `GET /api/v1/recitations/teacher/students/:studentId/statistics`
- **الوصف**: الحصول على إحصائيات طالب محدد
- **الصلاحيات**: Teacher فقط

### 7.11 تلاوة محددة
- **Endpoint**: `GET /api/v1/recitations/:id`
- **الوصف**: الحصول على تفاصيل تلاوة محددة
- **الصلاحيات**: Student فقط (تلاوته فقط)

### 7.12 حذف تلاوة
- **Endpoint**: `DELETE /api/v1/recitations/:id`
- **الوصف**: حذف تلاوة
- **الصلاحيات**: Student فقط (تلاوته فقط)

### 7.13 تلاوة محددة (Admin/Teacher)
- **Endpoint**: `GET /api/v1/recitations/admin/:id`
- **الوصف**: الحصول على تلاوة لأي طالب
- **الصلاحيات**: Admin أو Teacher

### 7.14 Webhook من AI للتقييم
- **Endpoint**: `POST /api/v1/recitations/webhook/ai-evaluation`
- **الوصف**: استقبال نتائج التقييم من خدمة AI
- **الصلاحيات**: Public (مع webhook secret)
- **Headers**: `Authorization: Bearer {webhook_secret}`

### 7.15 تلاوة للمعلم
- **Endpoint**: `GET /api/v1/recitations/teacher/:recitationId`
- **الوصف**: الحصول على تلاوة للتقييم اليدوي
- **الصلاحيات**: Teacher فقط

### 7.16 إضافة تقييم المعلم
- **Endpoint**: `POST /api/v1/recitations/teacher/:recitationId/evaluate`
- **الوصف**: إضافة تقييم يدوي من المعلم
- **الصلاحيات**: Teacher فقط
- **Body**:
  ```json
  {
    "score": 85,
    "notes": "أداء جيد، يحتاج تحسين في الترتيل"
  }
  ```

### 7.17 تحديث تقييم المعلم
- **Endpoint**: `PATCH /api/v1/recitations/teacher/:recitationId/evaluate`
- **الوصف**: تحديث تقييم المعلم الموجود
- **الصلاحيات**: Teacher فقط (المعلم الذي أضاف التقييم)

---

## 🔔 8. Notifications (الإشعارات)

### 8.1 إنشاء إشعار
- **Endpoint**: `POST /api/v1/notifications`
- **الوصف**: إنشاء إشعار جديد للمستخدمين
- **الصلاحيات**: يتطلب تسجيل دخول
- **Query Parameters**:
  - `userId`: إرسال لمستخدم محدد
  - `role`: إرسال لدور معين
  - `all`: إرسال للجميع
- **Body**:
  ```json
  {
    "title": "عنوان الإشعار",
    "body": "محتوى الإشعار",
    "type": "info"
  }
  ```

### 8.2 جميع الإشعارات
- **Endpoint**: `GET /api/v1/notifications`
- **الوصف**: الحصول على جميع الإشعارات
- **الصلاحيات**: يتطلب تسجيل دخول
- **Query Parameters**:
  - `page`: رقم الصفحة
  - `limit`: عدد النتائج
  - `unread`: عرض غير المقروءة فقط

### 8.3 تحديد إشعار كمقروء
- **Endpoint**: `PATCH /api/v1/notifications/:id/read`
- **الوصف**: تحديد إشعار محدد كمقروء
- **الصلاحيات**: يتطلب تسجيل دخول

### 8.4 تحديد جميع الإشعارات كمقروءة
- **Endpoint**: `PATCH /api/v1/notifications/mark-all-read`
- **الوصف**: تحديد جميع الإشعارات كمقروءة
- **الصلاحيات**: يتطلب تسجيل دخول
- **Query Parameters**:
  - `limit`: عدد الإشعارات (اختياري)

### 8.5 إشعاراتي
- **Endpoint**: `GET /api/v1/notifications/me`
- **الوصف**: الحصول على إشعاراتي فقط
- **الصلاحيات**: يتطلب تسجيل دخول
- **Query Parameters**:
  - `limit`: عدد النتائج (افتراضي: 20)
  - `page`: رقم الصفحة (افتراضي: 1)

### 8.6 إشعار محدد
- **Endpoint**: `GET /api/v1/notifications/:id`
- **الوصف**: الحصول على تفاصيل إشعار محدد
- **الصلاحيات**: يتطلب تسجيل دخول

---

## ❓ 9. FAQ (الأسئلة الشائعة)

### 9.1 إنشاء سؤال جديد (Admin)
- **Endpoint**: `POST /api/v1/faq`
- **الوصف**: إضافة سؤال وجواب جديد
- **الصلاحيات**: Admin فقط
- **Body**:
  ```json
  {
    "questionAr": "ما هي مدة الاشتراك؟",
    "questionEn": "What is the subscription duration?",
    "answerAr": "مدة الاشتراك شهر واحد",
    "answerEn": "Subscription duration is one month",
    "category": "subscriptions",
    "order": 1
  }
  ```

### 9.2 جميع الأسئلة
- **Endpoint**: `GET /api/v1/faq`
- **الوصف**: الحصول على جميع الأسئلة الشائعة
- **الصلاحيات**: يتطلب تسجيل دخول

### 9.3 سؤال محدد
- **Endpoint**: `GET /api/v1/faq/:id`
- **الوصف**: الحصول على سؤال محدد
- **الصلاحيات**: يتطلب تسجيل دخول

### 9.4 تحديث سؤال (Admin)
- **Endpoint**: `PATCH /api/v1/faq/:id`
- **الوصف**: تحديث سؤال وجواب
- **الصلاحيات**: Admin فقط

### 9.5 حذف سؤال (Admin)
- **Endpoint**: `DELETE /api/v1/faq/:id`
- **الوصف**: حذف سؤال
- **الصلاحيات**: Admin فقط

---

## ⚙️ 10. App Settings (إعدادات التطبيق)

### 10.1 جميع الإعدادات
- **Endpoint**: `GET /api/v1/app-settings`
- **الوصف**: الحصول على جميع إعدادات التطبيق
- **الصلاحيات**: متاح للجميع (Public)

### 10.2 إعدادات التطبيق
- **Endpoint**: `GET /api/v1/app-settings/application`
- **الوصف**: الحصول على إعدادات التطبيق
- **الصلاحيات**: يتطلب تسجيل دخول

### 10.3 تحديث الإعدادات (Admin)
- **Endpoint**: `PATCH /api/v1/app-settings/application`
- **الوصف**: تحديث إعدادات التطبيق
- **الصلاحيات**: Admin فقط
- **Body**:
  ```json
  {
    "maintenanceMode": false,
    "maintenanceMessage": "النظام قيد الصيانة",
    "allowRegistration": true,
    "minAppVersion": "1.0.0"
  }
  ```

---

## 📱 11. App Version (إصدار التطبيق)

### 11.1 فحص الإصدار
- **Endpoint**: `GET /api/v1/app-version/check`
- **الوصف**: فحص إصدار التطبيق الحالي
- **الصلاحيات**: متاح للجميع (Public)
- **Response**:
  ```json
  {
    "currentVersion": "1.0.0",
    "minVersion": "1.0.0",
    "latestVersion": "1.2.0",
    "forceUpdate": false,
    "updateUrl": "https://example.com/download"
  }
  ```

### 11.2 تحديث الإصدار
- **Endpoint**: `PUT /api/v1/app-version/update`
- **الوصف**: تحديث معلومات إصدار التطبيق
- **الصلاحيات**: Admin فقط
- **Body**:
  ```json
  {
    "version": "1.2.0",
    "minVersion": "1.0.0",
    "forceUpdate": false,
    "updateUrl": "https://example.com/download"
  }
  ```

---

## 🔒 ملخص الصلاحيات

| الدور | الوصف | الوصول |
|-------|-------|--------|
| **Public** | متاح للجميع بدون تسجيل دخول | القرآن، الصوتيات، الباقات، التسجيل، تسجيل الدخول |
| **Student** | الطالب | التلاوات، الاشتراكات، البروفايل |
| **Parent** | ولي الأمر | مراقبة الأطفال، إحصائياتهم، ربط الأطفال |
| **Teacher** | المعلم | مراقبة الطلاب، التقييم اليدوي، إحصائيات الطلاب |
| **Admin** | المدير | جميع الصلاحيات، إدارة المستخدمين، الباقات، الإعدادات |

---

## 🔑 استخدام Bearer Token

جميع endpoints المحمية تتطلب إرسال Bearer Token في header:

```
Authorization: Bearer {your_access_token}
```

### مثال باستخدام cURL:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3777/api/v1/auth/get-me
```

---

## 📊 أمثلة Response

### Success Response:
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // البيانات المطلوبة
  }
}
```

### Error Response:
```json
{
  "statusCode": 400,
  "message": "Error message in Arabic or English",
  "error": "Bad Request"
}
```

---

## 🌐 Pagination

معظم endpoints التي تعيد قوائم تدعم pagination:

**Query Parameters:**
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد النتائج في الصفحة (افتراضي: 10)

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## 🔔 ملاحظات هامة

1. **Rate Limiting**: بعض endpoints محمية بـ rate limiting لمنع إساءة الاستخدام
2. **File Upload**: الحجم الأقصى للملفات الصوتية 100MB
3. **Supported Audio Formats**: MP3, WAV, M4A, WebM, MP4
4. **Token Expiry**: 
   - Access Token: 24 ساعة
   - Refresh Token: 30 يوم
5. **Webhook Security**: جميع webhooks محمية بـ secret token

---

## 📞 Support

للمزيد من المعلومات أو الدعم:
- الوثائق التفصيلية: `/docs/API-ENDPOINTS.md`
- Swagger UI: `http://localhost:3777/api/docs`
- Developer Documentation: `/docs/DEVELOPER-DOCUMENTATION.md`
