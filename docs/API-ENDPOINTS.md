# Quran Yutla - API Endpoints Documentation

## Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://api.quranyutla.com`
- **Swagger Documentation**: `/api/docs`

---

## 1. Authentication Module (`/auth`)

### Public Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/auth/login` | تسجيل الدخول | `{ email, password, playerId? }` | `{ message, data: { user, accessToken, refreshToken } }` |
| POST | `/auth/sign-up` | تسجيل طالب جديد | `{ email, fullName, phoneNumber, password, dateOfBirth, gender, ageGroup, playerId? }` | `{ message, data: { user: { id, email, phoneNumber, studentCode } } }` |
| POST | `/auth/sign-up/parent` | تسجيل ولي أمر جديد | `{ email, fullName, phoneNumber, password, studentCode, playerId? }` | `{ message, data: { user: { id, email, phoneNumber } } }` |
| POST | `/auth/sign-up/teacher` | تسجيل معلم جديد | `{ email, fullName, phoneNumber, password, teacherType, playerId? }` | `{ message, data: { user: { id, email, phoneNumber } } }` |
| POST | `/auth/refresh-token` | تجديد Access Token | `{ refreshToken }` | `{ message, data: { accessToken, refreshToken } }` |
| POST | `/auth/verify-otp` | التحقق من البريد الإلكتروني | `{ email, code }` | `{ message, data: { user, accessToken, refreshToken } }` |
| POST | `/auth/resend-otp` | إعادة إرسال رمز التحقق | `{ email }` | `{ message }` |
| POST | `/auth/forget-password` | طلب إعادة تعيين كلمة المرور | `{ email }` | `{ message }` |
| POST | `/auth/update-password` | تحديث كلمة المرور (يتطلب reset token) | `{ newPassword }` | `{ message }` |

### Authenticated Endpoints

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/auth/get-me` | الحصول على معلومات المستخدم الحالي | ✅ Yes | - | `{ message, data: user }` |
| POST | `/auth/logout` | تسجيل الخروج | ✅ Yes | `{ refreshToken }` | `{ message }` |
| POST | `/auth/change-password` | تغيير كلمة المرور | ✅ Yes | `{ oldPassword, newPassword }` | `{ message }` |

**Teacher Types**:
- `QURAN_TEACHER` - معلم قرآن
- `TAJWEED_TEACHER` - معلم تجويد
- `MEMORIZATION_TEACHER` - معلم تحفيظ

**Age Groups**:
- `CHILD_5_TO_10` - أطفال 5-10 سنوات
- `TEEN_11_TO_17` - مراهقين 11-17 سنة
- `ADULT_18_PLUS` - بالغين 18+

**Notes**:
- Sign-up endpoints now send OTP to email automatically
- Use `/auth/verify-otp` to verify email after sign-up
- `/auth/update-password` requires a password reset token obtained from `/auth/forget-password` flow
- All sign-up endpoints return basic user info without tokens; users must verify email first

---

## 2. User Module (`/users`)

### Profile Management

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/users/profile` | الحصول على الملف الشخصي | ✅ Yes | Any | `{ message, data: user }` |
| PATCH | `/users/profile` | تحديث الملف الشخصي | ✅ Yes | Any | `{ message, data: user }` |
| PATCH | `/users/profile/image` | تحديث صورة الملف الشخصي | ✅ Yes | Any | `{ message, data: { profileImageUrl } }` |
| DELETE | `/users/profile` | حذف الحساب (Soft Delete) | ✅ Yes | Any | `{ message }` |

### User Relationships

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| POST | `/users/link-parent` | ربط طفل بولي الأمر باستخدام كود الطالب | ✅ Yes | PARENT | `{ message, data: child }` |
| POST | `/users/link-multiple-children` | ربط عدة أطفال بولي الأمر | ✅ Yes | PARENT | `{ message, data: { success[], failed[] } }` |
| GET | `/users/children` | الحصول على جميع الأبناء المرتبطين | ✅ Yes | PARENT | `{ message, data: children[] }` |
| POST | `/users/link-teacher` | ربط طالب بالمعلم | ✅ Yes | TEACHER | `{ message, data: student }` |
| GET | `/users/students` | الحصول على جميع الطلاب المرتبطين | ✅ Yes | TEACHER | `{ message, data: students[] }` |

### Admin User Management

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/users` | الحصول على جميع المستخدمين (مع Pagination) | ✅ Yes | ADMIN | `{ message, data: users[], metadata }` |
| GET | `/users/:id` | الحصول على مستخدم محدد | ✅ Yes | ADMIN | `{ message, data: user }` |
| PATCH | `/users/:id/roles` | تحديث أدوار المستخدم | ✅ Yes | ADMIN | `{ message, data: user }` |
| GET | `/users/admin/statistics` | إحصائيات المستخدمين (نشط، موقوف، أدوار...) | ✅ Yes | ADMIN | `{ message, data: { totalUsers, roleBreakdown, statusBreakdown, newRegistrationsLast30Days } }` |
| PATCH | `/users/:id/suspend` | إيقاف مستخدم مع حفظ سبب الإيقاف | ✅ Yes | ADMIN | `{ message, data: user }` |
| PATCH | `/users/:id/activate` | إعادة تفعيل مستخدم موقوف | ✅ Yes | ADMIN | `{ message, data: user }` |
| DELETE | `/users/:id/permanent` | حذف مستخدم بشكل نهائي (Admin) | ✅ Yes | ADMIN | `{ message, data: { deleted: true } }` |

**Link Parent Request**:
```json
{
  "studentCode": "STU123456"
}
```

**Link Multiple Children Request**:
```json
{
  "studentCodes": ["STU123456", "STU789012"]
}
```

**Link Teacher Request**:
```json
{
  "studentId": 5
}
```

**Update Profile Request**:
```json
{
  "fullName": "string",
  "phoneNumber": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "MALE | FEMALE",
  "ageGroup": "CHILD_5_TO_10 | TEEN_11_TO_17 | ADULT_18_PLUS",
  "country": "EGYPT | SAUDI_ARABIA | ...",
  "city": "string"
}
```

**Change Password Request**:
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Suspend User Request**:
```json
{
  "reason": "Repeated policy violations"
}
```

---

## 3. Plans Module (`/plans`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/plans` | الحصول على جميع الخطط النشطة (Filter by country) | ❌ No | GUEST | `{ message, data: plans[] }` |
| GET | `/plans/:id` | الحصول على خطة محددة | ❌ No | GUEST | `{ message, data: plan }` |
| GET | `/plans/admin/all` | الحصول على جميع الخطط بما فيها غير النشطة | ✅ Yes | ADMIN | `{ message, data: plans[] }` |
| POST | `/plans` | إنشاء خطة جديدة | ✅ Yes | ADMIN | `{ message, data: plan }` |
| PATCH | `/plans/:id` | تحديث خطة | ✅ Yes | ADMIN | `{ message, data: plan }` |
| PATCH | `/plans/:id/toggle-active` | تفعيل/تعطيل خطة | ✅ Yes | ADMIN | `{ message, data: plan }` |
| DELETE | `/plans/:id` | حذف خطة | ✅ Yes | ADMIN | `{ message }` |

**Query Parameters for GET /plans**:
```
?country=EGYPT | SAUDI_ARABIA | ...
```

**Plan Object**:
```json
{
  "id": "uuid",
  "name": "string",
  "nameAr": "string",
  "description": "string",
  "descriptionAr": "string",
  "price": "number",
  "currency": "USD | EGP | SAR",
  "durationInDays": "number",
  "sessionsCount": "number",
  "features": ["string"],
  "featuresAr": ["string"],
  "country": "EGYPT | SAUDI_ARABIA | ...",
  "isActive": "boolean"
}
```

---

## 4. Subscriptions Module (`/subscriptions`)

### Student Subscription Management

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| POST | `/subscriptions/initiate-payment` | بدء عملية الدفع (يُرجع رابط الدفع) | ✅ Yes | STUDENT | `{ message, data: { subscriptionId, paymentUrl, sessionId, amount } }` |
| POST | `/subscriptions/verify-payment` | التحقق من الدفع وتفعيل الاشتراك | ✅ Yes | STUDENT | `{ message, data: subscription }` |
| GET | `/subscriptions/me` | الحصول على الاشتراك النشط الحالي | ✅ Yes | STUDENT | `{ message, data: subscription }` |
| GET | `/subscriptions/me/history` | الحصول على سجل جميع الاشتراكات | ✅ Yes | STUDENT | `{ message, data: subscriptions[] }` |
| GET | `/subscriptions/me/check` | التحقق من إمكانية التسجيل | ✅ Yes | STUDENT | `{ message, data: { canRecord, remainingSessions, subscription } }` |
| PATCH | `/subscriptions/:id/cancel` | إلغاء الاشتراك | ✅ Yes | STUDENT | `{ message }` |

### Admin Subscription Management

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/subscriptions` | الحصول على جميع الاشتراكات (Admin) | ✅ Yes | ADMIN | `{ message, data: subscriptions[], metadata }` |
| GET | `/subscriptions/:id` | الحصول على اشتراك محدد (Admin) | ✅ Yes | ADMIN | `{ message, data: subscription }` |
| PATCH | `/subscriptions/:id/activate` | تفعيل اشتراك بعد الدفع | ✅ Yes | ADMIN | `{ message, data: subscription }` |
| PATCH | `/subscriptions/:id/suspend` | إيقاف اشتراك مؤقتاً | ✅ Yes | ADMIN | `{ message, data: subscription }` |
| PATCH | `/subscriptions/:id/resume` | استئناف اشتراك موقوف | ✅ Yes | ADMIN | `{ message, data: subscription }` |
| PATCH | `/subscriptions/:id/cancel` | إلغاء اشتراك (Admin) | ✅ Yes | ADMIN | `{ message, data: subscription }` |
| PATCH | `/subscriptions/:id/renew` | تجديد اشتراك يدوياً | ✅ Yes | ADMIN | `{ message, data: subscription }` |

### Payment Webhook

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| POST | `/subscriptions/webhook/paymob` | Paymob webhook callback | ❌ No (Webhook) | `{ success: true }` |

**Initiate Payment Request**:
```json
{
  "planId": "uuid"
}
```

**Verify Payment Request**:
```json
{
  "subscriptionId": "number",
  "transactionId": "string"
}
```

**Admin Action Request**:
```json
{
  "reason": "Payment verified manually"
}
```

**Subscription Object**:
```json
{
  "id": "number",
  "userId": "number",
  "planId": "number",
  "startDate": "date",
  "endDate": "date",
  "status": "PENDING | ACTIVE | EXPIRED | CANCELLED | SUSPENDED",
  "autoRenew": "boolean",
  "paymentMethod": "CARD | WALLET | ...",
  "paymentTransactionId": "string",
  "sessionsUsed": "number",
  "sessionsRemaining": "number",
  "plan": "Plan object",
  "user": "User object"
}
```

**Notes**:
- New payment flow: `initiate-payment` → User pays → `verify-payment`
- Subscriptions track session usage (sessionsUsed/sessionsRemaining)
- Status can be: PENDING, ACTIVE, EXPIRED, CANCELLED, or SUSPENDED
- Paymob webhook automatically verifies payments

---

## 5. Quran Module (`/quran`)

### Surahs

| Method | Endpoint | Description | Auth Required | Query Params | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/quran/surahs` | الحصول على جميع السور (114 سورة) | ❌ No | `language=ar` | `{ message, data: surahs[] }` |

### Juz (Ajza)

| Method | Endpoint | Description | Auth Required | Query Params | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/quran/juz/:juzNumber` | الحصول على جزء محدد (1-30) مع Pagination | ❌ No | `page, limit, language` | `{ message, data: ayahs[], metadata }` |
| GET | `/quran/juz/:juzNumber/complete` | الحصول على جزء كامل بدون Pagination | ❌ No | `language=ar` | `{ message, data: ayahs[] }` |

### Surahs with Ayahs

| Method | Endpoint | Description | Auth Required | Query Params | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/quran/surah/:surahNumber` | الحصول على سورة محددة مع Pagination | ❌ No | `page, limit, language` | `{ message, data: { surah, ayahs[] }, metadata }` |
| GET | `/quran/surah/:surahNumber/complete` | الحصول على سورة كاملة بدون Pagination | ❌ No | `language=ar` | `{ message, data: { surah, ayahs[] } }` |
| GET | `/quran/surah/:surahNumber/ayah/:ayahNumber` | الحصول على آية محددة | ❌ No | `language=ar` | `{ message, data: ayah }` |

### Ayahs & Pages

| Method | Endpoint | Description | Auth Required | Query Params | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/quran/ayah/:ayahId` | الحصول على آية محددة بالـ ID | ❌ No | `language=ar` | `{ message, data: ayah }` |
| GET | `/quran/page/:pageNumber` | الحصول على صفحة محددة (1-604) | ❌ No | `page, limit, language` | `{ message, data: ayahs[], metadata }` |

### Search

| Method | Endpoint | Description | Auth Required | Query Params | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/quran/search/:keyword` | البحث في القرآن مع Pagination | ❌ No | `page, limit, language` | `{ message, data: ayahs[], metadata }` |
| GET | `/quran/search/:keyword/complete` | البحث في القرآن بدون Pagination | ❌ No | `language=ar` | `{ message, data: ayahs[] }` |

**Surah Object**:
```json
{
  "id": "number",
  "surahNumber": "number",
  "surahNameArabic": "string",
  "surahNameEnglish": "string",
  "revelationType": "MECCAN | MEDINAN",
  "numberOfAyahs": "number"
}
```

**Ayah Object**:
```json
{
  "id": "uuid",
  "surahId": "number",
  "ayahNumber": "number",
  "absoluteAyahNumber": "number",
  "textUthmani": "string",
  "textImlaei": "string",
  "textEnglish": "string",
  "juzNumber": "number",
  "pageNumber": "number",
  "hizbNumber": "number",
  "manzilNumber": "number",
  "rukuNumber": "number"
}
```

**Notes**:
- All endpoints support pagination with `?page=1&limit=20`
- Use `/complete` endpoints to get full content without pagination
- Language parameter defaults to `ar` (Arabic)

---

## 6. Quran Audio Module (`/quran-audio`)

| Method | Endpoint | Description | Auth Required | Request Body | Response |
|--------|----------|-------------|---------------|--------------|----------|
| GET | `/quran-audio/reciters` | الحصول على جميع القراء | ❌ No | - | `{ message, data: reciters[] }` |
| POST | `/quran-audio/get-audio-links` | الحصول على روابط صوتية لمجموعة آيات | ❌ No | `{ reciterId, surahNumber, fromAyah, toAyah }` | `{ message, data: { audioUrls[] } }` |
| POST | `/quran-audio/get-single-ayah-audio` | الحصول على رابط صوتي لآية واحدة | ❌ No | `{ reciterId, surahNumber, ayahNumber }` | `{ message, data: { audioUrl } }` |
| POST | `/quran-audio/get-surah-audio` | الحصول على رابط صوتي لسورة كاملة | ❌ No | `{ reciterId, surahNumber }` | `{ message, data: { audioUrl } }` |

**Get Audio Links Request**:
```json
{
  "reciterId": "uuid",
  "surahNumber": 1,
  "fromAyah": 1,
  "toAyah": 7
}
```

**Get Single Ayah Audio Request**:
```json
{
  "reciterId": "uuid",
  "surahNumber": 1,
  "ayahNumber": 1
}
```

**Get Surah Audio Request**:
```json
{
  "reciterId": "uuid",
  "surahNumber": 1
}
```

**Reciter Object**:
```json
{
  "id": "uuid",
  "nameArabic": "string",
  "nameEnglish": "string",
  "recitationStyle": "HAFS | WARSH | ...",
  "country": "string"
} 
```

---

## 7. Recitations Module (`/recitations`)

### Student Recitations

| Method | Endpoint | Description | Auth Required | Role Required | Special Guard | Response |
|--------|----------|-------------|---------------|---------------|---------------|----------|
| POST | `/recitations/upload` | رفع تسجيل تلاوة | ✅ Yes | STUDENT | ActiveSubscription | `{ message, data: recitation }` |
| POST | `/recitations/record-direct` | تسجيل تلاوة مباشرة (audio blob) | ✅ Yes | STUDENT | ActiveSubscription | `{ message, data: recitation }` |
| GET | `/recitations/me` | الحصول على تسجيلات الطالب | ✅ Yes | STUDENT | - | `{ message, data: recitations[], metadata }` |
| GET | `/recitations/me/statistics` | إحصائيات تسجيلات الطالب | ✅ Yes | STUDENT | - | `{ message, data: statistics }` |
| GET | `/recitations/:id` | الحصول على تسجيل محدد (own only) | ✅ Yes | STUDENT | - | `{ message, data: recitation }` |
| DELETE | `/recitations/:id` | حذف تسجيل (own only) | ✅ Yes | STUDENT | - | `{ message }` |

### Parent Reports

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/recitations/parent/children` | نظرة عامة على جميع الأبناء | ✅ Yes | PARENT | `{ message, data: children[] }` |
| GET | `/recitations/parent/children/:childId/recitations` | تسجيلات ابن محدد | ✅ Yes | PARENT | `{ message, data: recitations[], metadata }` |
| GET | `/recitations/parent/children/:childId/statistics` | إحصائيات ابن محدد | ✅ Yes | PARENT | `{ message, data: statistics }` |

### Teacher Reports & Evaluation

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/recitations/teacher/students` | نظرة عامة على جميع الطلاب | ✅ Yes | TEACHER | `{ message, data: students[] }` |
| GET | `/recitations/teacher/students/:studentId/recitations` | تسجيلات طالب محدد | ✅ Yes | TEACHER | `{ message, data: recitations[], metadata }` |
| GET | `/recitations/teacher/students/:studentId/statistics` | إحصائيات طالب محدد | ✅ Yes | TEACHER | `{ message, data: statistics }` |
| GET | `/recitations/teacher/:recitationId` | الحصول على تسجيل للتقييم | ✅ Yes | TEACHER | `{ message, data: recitation }` |
| POST | `/recitations/teacher/:recitationId/evaluate` | إضافة تقييم يدوي | ✅ Yes | TEACHER | `{ message, data: recitation }` |
| PATCH | `/recitations/teacher/:recitationId/evaluate` | تحديث التقييم اليدوي | ✅ Yes | TEACHER | `{ message, data: recitation }` |

### Admin Access

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/recitations/admin/:id` | الحصول على تسجيل محدد (Admin/Teacher) | ✅ Yes | ADMIN, TEACHER | `{ message, data: recitation }` |

### AI Webhook (Internal)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| POST | `/recitations/webhook/ai-evaluation` | استقبال نتائج التقييم من AI | ✅ Webhook Secret | `{ success: true, message }` |

**Upload Recitation Request** (multipart/form-data):
```
audio: File (required, max 100MB, formats: MP3, WAV, M4A)
surahId: number (required, 1-114)
fromAyah: number (required)
toAyah: number (required)
notes: string (optional)
```

**Direct Recording Request** (multipart/form-data):
```
audioBlob: Blob (required, max 100MB, formats: WebM, MP4, WAV)
surahId: number (required, 1-114)
fromAyah: number (required)
toAyah: number (required)
notes: string (optional)
audioFormat: string (optional, e.g., 'webm', 'mp4', 'wav')
```

**Teacher Evaluation Request**:
```json
{
  "score": 85.5,
  "notes": "أداء ممتاز مع بعض الأخطاء البسيطة في التجويد"
}
```

**AI Webhook Request** (Authorization: Bearer {webhookSecret}):
```json
{
  "jobId": "uuid",
  "status": "completed | error",
  "score": 85.5,
  "message": "Evaluation completed successfully",
  "evaluationData": {
    "tajweedScore": 90,
    "pronunciationScore": 80,
    "errors": ["خطأ في المد", "خطأ في الغنة"]
  }
}
```

**Recitation Object**:
```json
{
  "id": 1,
  "userId": 5,
  "surahId": 1,
  "fromAyah": 1,
  "toAyah": 7,
  "audioUrl": "https://storage.example.com/recitations/user-5/recitation-1.mp3",
  "audioKey": "recitations/user-5/recitation-1.mp3",
  "duration": 180,
  "status": "pending | processing | completed | failed",
  "aiEvaluationScore": 85.5,
  "evaluationData": {},
  "aiJobId": "uuid",
  "teacherEvaluationScore": 90.0,
  "teacherNotes": "أداء ممتاز",
  "evaluatedByTeacherId": 3,
  "teacherEvaluatedAt": "2024-01-15T10:30:00Z",
  "notes": "My first recitation",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "user": {},
  "surah": {}
}
```

**Notes**:
- Both upload endpoints require an active subscription (ActiveSubscriptionGuard)
- Teachers can only access students linked to them
- Parents can only access their linked children
- AI evaluation happens asynchronously via webhook
- Teacher evaluation is manual and optional

---

## 8. Notifications Module (`/notifications`)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| POST | `/notifications` | إنشاء إشعار بناءً على معايير Query | ✅ Yes | `{ message, data: notification }` |
| GET | `/notifications` | الحصول على قائمة الإشعارات | ✅ Yes | `{ message, data: notifications[], metadata }` |
| GET | `/notifications/me` | الحصول على إشعارات المستخدم الحالي | ✅ Yes | `{ message, data: notifications[], metadata }` |
| GET | `/notifications/:id` | الحصول على تفاصيل إشعار محدد | ✅ Yes | `{ message, data: notification }` |
| PATCH | `/notifications/:id/read` | تعليم إشعار كمقروء | ✅ Yes | `{ message }` |
| PATCH | `/notifications/mark-all-read` | تعليم جميع الإشعارات كمقروءة | ✅ Yes | `{ message }` |

**Create Notification Query**:
```
?userId=5&roleId=1&gender=MALE&ageGroup=CHILD_5_TO_10
```

**Create Notification Body**:
```json
{
  "title": "New Feature",
  "titleAr": "ميزة جديدة",
  "message": "Check out our new feature",
  "messageAr": "تحقق من ميزتنا الجديدة",
  "type": "GENERAL | RECITATION_EVALUATED | SUBSCRIPTION_EXPIRING | ...",
  "data": {}
}
```

**Get My Notifications Query**:
```
?limit=20&page=1
```

**Mark All Read Query**:
```
?limit=50
```

**Notification Object**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "string",
  "titleAr": "string",
  "message": "string",
  "messageAr": "string",
  "type": "RECITATION_EVALUATED | SUBSCRIPTION_EXPIRING | GENERAL | ...",
  "isRead": "boolean",
  "data": "object",
  "createdAt": "date"
}
```

---

## 9. FAQ Module (`/faq`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/faq` | الحصول على جميع الأسئلة الشائعة | ✅ Yes | Any | `{ message, data: faqs[] }` |
| GET | `/faq/:id` | الحصول على سؤال محدد | ✅ Yes | Any | `{ message, data: faq }` |
| POST | `/faq` | إنشاء سؤال جديد | ✅ Yes | ADMIN | `{ message, data: faq }` |
| PATCH | `/faq/:id` | تحديث سؤال | ✅ Yes | ADMIN | `{ message, data: faq }` |
| DELETE | `/faq/:id` | حذف سؤال | ✅ Yes | ADMIN | `{ message }` |

**FAQ Object**:
```json
{
  "id": "uuid",
  "question": "string",
  "questionAr": "string",
  "answer": "string",
  "answerAr": "string",
  "category": "GENERAL | SUBSCRIPTION | TECHNICAL | ...",
  "order": "number",
  "isActive": "boolean"
}
```

---

## 10. App Settings Module (`/app-settings`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/app-settings` | الحصول على إعدادات التطبيق العامة | ❌ No | GUEST | `{ message, data: settings }` |
| GET | `/app-settings/application` | الحصول على إعدادات التطبيق (مصادقة) | ✅ Yes | Any | `{ message, data: settings }` |
| PATCH | `/app-settings/application` | تحديث إعدادات التطبيق | ✅ Yes | ADMIN | `{ message, data: settings }` |

**Settings Object**:
```json
{
  "maintenanceMode": "boolean",
  "maintenanceMessage": "string",
  "maintenanceMessageAr": "string",
  "forceUpdate": "boolean",
  "minimumAppVersion": "string",
  "termsAndConditionsUrl": "string",
  "privacyPolicyUrl": "string",
  "contactEmail": "string",
  "contactPhone": "string",
  "socialMedia": {
    "facebook": "string",
    "twitter": "string",
    "instagram": "string",
    "youtube": "string"
  }
}
```

---

## 11. App Version Module (`/app-version`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/app-version/check` | التحقق من إصدار التطبيق | ❌ No | GUEST | `{ message, data: { updateRequired, latestVersion, downloadUrl } }` |
| PUT | `/app-version/:id` | تحديث معلومات الإصدار | ❌ No | GUEST | `{ message, data: version }` |

**Check Version Query**:
```
?platform=ios|android&currentVersion=1.0.0
```

**Version Object**:
```json
{
  "id": "uuid",
  "version": "string",
  "platform": "IOS | ANDROID",
  "isForceUpdate": "boolean",
  "releaseNotes": "string",
  "releaseNotesAr": "string",
  "downloadUrl": "string",
  "releaseDate": "date"
}
```

---

## Summary of Key Changes

### 🆕 New Features
1. **Email Verification Flow** - OTP-based email verification integrated into auth flow
2. **Direct Recording** - `/recitations/record-direct` for audio blob uploads
3. **Payment Integration** - Full Paymob payment flow with initiate/verify endpoints
4. **Subscription Management** - Enhanced with suspend/resume/renew capabilities
5. **Session Tracking** - Subscriptions now track sessions used/remaining
6. **User Relationships** - Parent-child and teacher-student linking endpoints
7. **Teacher Evaluation** - Teachers can manually evaluate student recitations
8. **User Statistics** - Admin endpoint for user analytics
9. **User Suspension** - Admins can suspend/activate user accounts
10. **Multiple Children Linking** - Parents can link multiple children at once
11. **Complete Quran Endpoints** - New `/complete` endpoints for pagination-free data
12. **Audio APIs** - New POST-based audio endpoints for ayah ranges

### 🔄 Updated Features
- Auth endpoints reorganized (verify-otp, resend-otp, update-password)
- Recitation endpoints use `/me` instead of `/my-recitations`
- Notifications removed OneSignal-specific endpoints
- Plans now support country filtering
- Subscription status includes PENDING and SUSPENDED
- All endpoints use versioning (`version: '1'`)

### ⚠️ Important Notes
- **ActiveSubscriptionGuard** - Required for uploading/recording recitations
- **Webhook Authentication** - AI webhook uses Bearer token authentication
- **Session Limits** - Subscriptions enforce session limits per plan
- **Audio Formats** - Direct recording supports WebM, MP4, WAV formats
- **File Size Limits** - Max 100MB for audio uploads

---

## Response Format

جميع الـ Endpoints تستخدم نفس تنسيق الاستجابة:

### Success Response
```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": { ... },
  "metadata": {
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

---

## Authentication

معظم الـ Endpoints تتطلب JWT Token في الـ Header:

```
Authorization: Bearer <access_token>
```

### Refresh Token Flow
1. عند انتهاء صلاحية الـ Access Token (401 Unauthorized)
2. استخدم `/auth/refresh-token` مع الـ Refresh Token
3. احصل على Access Token جديد
4. أعد المحاولة

---

## Pagination

الـ Endpoints التي تدعم Pagination تقبل Query Parameters:

```
?page=1&limit=10&sortBy=createdAt&sortOrder=DESC
```

---

## File Upload

الـ Endpoints التي تتطلب رفع ملفات تستخدم `multipart/form-data`:

- `/users/profile/image` - صورة الملف الشخصي
- `/recitations/upload` - تسجيل التلاوة

**Supported Formats**:
- Images: JPG, PNG, WEBP (max 5MB)
- Audio: MP3, WAV, M4A (max 50MB)

---

## Rate Limiting

- **Public Endpoints**: 100 requests/minute
- **Authenticated Endpoints**: 200 requests/minute
- **Admin Endpoints**: Unlimited

---

## Roles System

| Role | Description | Access Level |
|------|-------------|--------------|
| GUEST | زائر غير مسجل | Public endpoints only |
| STUDENT | طالب مسجل | Student endpoints + profile |
| PARENT | ولي أمر | View child progress |
| TEACHER | معلم | Evaluate recitations |
| ADMIN | مدير النظام | All endpoints |

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Contact

- **Email**: yutlaquran@gmail.com
- **GitHub**: https://github.com/Halimmsbah/Quran_Yutla
- **API Base URL**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api/docs

---

**Last Updated**: January 10, 2026
**API Version**: 1.0.0
**Total Endpoints**: 80+
