# Quran Yutla - API Endpoints Documentation

## Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://api.yutlaquran.com`
- **Swagger Documentation**: `/api/docs`

---

## 1. Authentication Module (`/auth`)

### Public Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/auth/sign-up/student` | تسجيل طالب جديد | `{ email, fullName, phoneNumber, password, dateOfBirth, gender, ageGroup, playerId? }` | `{ message, data: { user, accessToken, refreshToken, studentCode } }` |
| POST | `/auth/sign-up/parent` | تسجيل ولي أمر جديد | `{ email, fullName, phoneNumber, password, studentCode, playerId? }` | `{ message, data: { user, accessToken, refreshToken } }` |
| POST | `/auth/sign-up/teacher` | تسجيل معلم جديد | `{ email, fullName, phoneNumber, password, teacherType, playerId? }` | `{ message, data: { user, accessToken, refreshToken } }` |
| POST | `/auth/login` | تسجيل الدخول | `{ email, password, playerId? }` | `{ message, data: { user, accessToken, refreshToken } }` |
| POST | `/auth/refresh-token` | تجديد Access Token | `{ refreshToken }` | `{ message, data: { accessToken } }` |
| POST | `/auth/forgot-password` | طلب إعادة تعيين كلمة المرور | `{ email }` | `{ message }` |
| POST | `/auth/reset-password` | إعادة تعيين كلمة المرور | `{ token, newPassword }` | `{ message }` |
| POST | `/auth/logout` | تسجيل الخروج | `{ refreshToken }` | `{ message }` |

**Teacher Types**:
- `QURAN_TEACHER` - معلم قرآن
- `TAJWEED_TEACHER` - معلم تجويد
- `MEMORIZATION_TEACHER` - معلم تحفيظ

**Age Groups**:
- `CHILD_5_TO_10` - أطفال 5-10 سنوات
- `TEEN_11_TO_17` - مراهقين 11-17 سنة
- `ADULT_18_PLUS` - بالغين 18+

---

## 2. Email Verification Module (`/email-verification`)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| POST | `/email-verification/send` | إرسال رمز التحقق | ✅ Yes | `{ message }` |
| POST | `/email-verification/verify` | التحقق من البريد الإلكتروني | ✅ Yes | `{ message, data: { user } }` |

**Request Body for Verify**:
```json
{
  "code": "123456"
}
```

---

## 3. User Module (`/users`)

### User Management

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/users/profile` | الحصول على الملف الشخصي | ✅ Yes | Any | `{ message, data: user }` |
| PATCH | `/users/profile` | تحديث الملف الشخصي | ✅ Yes | Any | `{ message, data: user }` |
| PATCH | `/users/profile/image` | تحديث صورة الملف الشخصي | ✅ Yes | Any | `{ message, data: { profileImageUrl } }` |
| PATCH | `/users/change-password` | تغيير كلمة المرور | ✅ Yes | Any | `{ message }` |
| DELETE | `/users/profile` | حذف الحساب (Soft Delete) | ✅ Yes | Any | `{ message }` |

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

## 4. Plans Module (`/plans`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/plans` | الحصول على جميع الخطط | ❌ No | GUEST | `{ message, data: plans[] }` |
| GET | `/plans/:id` | الحصول على خطة محددة | ❌ No | GUEST | `{ message, data: plan }` |
| POST | `/plans` | إنشاء خطة جديدة | ✅ Yes | ADMIN | `{ message, data: plan }` |
| PATCH | `/plans/:id` | تحديث خطة | ✅ Yes | ADMIN | `{ message, data: plan }` |
| DELETE | `/plans/:id` | حذف خطة | ✅ Yes | ADMIN | `{ message }` |

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
  "features": ["string"],
  "featuresAr": ["string"],
  "isActive": "boolean"
}
```

---

## 5. Subscriptions Module (`/subscriptions`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/subscriptions/my-subscription` | الحصول على اشتراك المستخدم الحالي | ✅ Yes | Any | `{ message, data: subscription }` |
| POST | `/subscriptions/subscribe` | الاشتراك في خطة | ✅ Yes | STUDENT | `{ message, data: subscription }` |
| POST | `/subscriptions/cancel` | إلغاء الاشتراك | ✅ Yes | STUDENT | `{ message }` |
| GET | `/subscriptions` | الحصول على جميع الاشتراكات (Admin) | ✅ Yes | ADMIN | `{ message, data: subscriptions[], metadata }` |
| GET | `/subscriptions/:id` | الحصول على اشتراك محدد (Admin) | ✅ Yes | ADMIN | `{ message, data: subscription }` |

**Subscribe Request**:
```json
{
  "planId": "uuid",
  "paymentMethod": "CREDIT_CARD | PAYPAL | ...",
  "paymentTransactionId": "string"
}
```

**Subscription Object**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "planId": "uuid",
  "startDate": "date",
  "endDate": "date",
  "status": "ACTIVE | EXPIRED | CANCELLED",
  "autoRenew": "boolean",
  "paymentMethod": "string",
  "paymentTransactionId": "string"
}
```

---

## 6. Quran Module (`/quran`)

### Surahs

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| GET | `/quran/surahs` | الحصول على جميع السور | ❌ No | `{ message, data: surahs[] }` |
| GET | `/quran/surahs/:id` | الحصول على سورة محددة | ❌ No | `{ message, data: surah }` |

### Ayahs

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| GET | `/quran/ayahs` | الحصول على آيات (مع Filter) | ❌ No | `{ message, data: ayahs[], metadata }` |
| GET | `/quran/ayahs/:id` | الحصول على آية محددة | ❌ No | `{ message, data: ayah }` |
| GET | `/quran/ayahs/by-surah/:surahId` | الحصول على آيات سورة معينة | ❌ No | `{ message, data: ayahs[] }` |
| GET | `/quran/ayahs/by-juz/:juzNumber` | الحصول على آيات جزء معين | ❌ No | `{ message, data: ayahs[] }` |
| GET | `/quran/ayahs/by-page/:pageNumber` | الحصول على آيات صفحة معينة | ❌ No | `{ message, data: ayahs[] }` |

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

---

## 7. Quran Audio Module (`/quran-audio`)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| GET | `/quran-audio/reciters` | الحصول على جميع القراء | ❌ No | `{ message, data: reciters[] }` |
| GET | `/quran-audio/reciters/:id` | الحصول على قارئ محدد | ❌ No | `{ message, data: reciter }` |
| GET | `/quran-audio/reciters/:reciterId/surahs/:surahNumber` | الحصول على رابط تسجيل سورة | ❌ No | `{ message, data: { audioUrl } }` |

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

## 8. Recitations Module (`/recitations`)

### Student Recitations

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| POST | `/recitations/upload` | رفع تسجيل تلاوة | ✅ Yes | STUDENT | `{ message, data: recitation }` |
| POST | `/recitations/direct` | تسجيل تلاوة مباشرة | ✅ Yes | STUDENT | `{ message, data: recitation }` |
| GET | `/recitations/my-recitations` | الحصول على تسجيلات الطالب | ✅ Yes | STUDENT | `{ message, data: recitations[], metadata }` |
| GET | `/recitations/:id` | الحصول على تسجيل محدد | ✅ Yes | Any | `{ message, data: recitation }` |
| DELETE | `/recitations/:id` | حذف تسجيل | ✅ Yes | STUDENT | `{ message }` |
| GET | `/recitations/statistics` | إحصائيات التسجيلات | ✅ Yes | STUDENT | `{ message, data: statistics }` |

### Teacher Evaluation (Manual)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/recitations/teacher/:recitationId` | الحصول على تسجيل للتقييم | ✅ Yes | TEACHER | `{ message, data: recitation }` |
| POST | `/recitations/teacher/:recitationId/evaluate` | إضافة تقييم يدوي | ✅ Yes | TEACHER | `{ message, data: recitation }` |
| PATCH | `/recitations/teacher/:recitationId/evaluate` | تحديث التقييم اليدوي | ✅ Yes | TEACHER | `{ message, data: recitation }` |

### Teacher & Parent Reports

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/recitations/teacher/students` | تسجيلات جميع الطلاب | ✅ Yes | TEACHER | `{ message, data: recitations[], metadata }` |
| GET | `/recitations/teacher/student/:studentId` | تسجيلات طالب محدد | ✅ Yes | TEACHER | `{ message, data: recitations[], metadata }` |
| GET | `/recitations/parent/children` | تسجيلات الأبناء | ✅ Yes | PARENT | `{ message, data: recitations[], metadata }` |
| GET | `/recitations/parent/child/:childId` | تسجيلات ابن محدد | ✅ Yes | PARENT | `{ message, data: recitations[], metadata }` |

### AI Webhook (Internal)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| POST | `/recitations/ai-webhook` | استقبال نتائج التقييم من AI | ✅ Webhook Secret | `{ success: true, message }` |

**Upload Recitation Request** (multipart/form-data):
```
audio: File (required, max 100MB)
surahId: number (required, 1-114)
fromAyah: number (required)
toAyah: number (required)
```

**Direct Recording Request** (multipart/form-data):
```
audioBlob: Blob (required, max 100MB)
surahId: number (required, 1-114)
fromAyah: number (required)
toAyah: number (required)
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
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "user": {},
  "surah": {}
}
```

---

## 9. Notifications Module (`/notifications`)

| Method | Endpoint | Description | Auth Required | Response |
|--------|----------|-------------|---------------|----------|
| GET | `/notifications` | الحصول على إشعارات المستخدم | ✅ Yes | `{ message, data: notifications[], metadata }` |
| GET | `/notifications/unread-count` | عدد الإشعارات غير المقروءة | ✅ Yes | `{ message, data: { count } }` |
| PATCH | `/notifications/:id/read` | تعليم إشعار كمقروء | ✅ Yes | `{ message, data: notification }` |
| PATCH | `/notifications/mark-all-read` | تعليم جميع الإشعارات كمقروءة | ✅ Yes | `{ message }` |
| DELETE | `/notifications/:id` | حذف إشعار | ✅ Yes | `{ message }` |
| POST | `/notifications/register-player` | تسجيل Player ID لـ OneSignal | ✅ Yes | `{ message }` |

**Register Player Request**:
```json
{
  "playerId": "string"
}
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
  "type": "RECITATION_EVALUATED | SUBSCRIPTION_EXPIRING | ...",
  "isRead": "boolean",
  "data": "object",
  "createdAt": "date"
}
```

---

## 10. FAQ Module (`/faq`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/faq` | الحصول على جميع الأسئلة الشائعة | ❌ No | GUEST | `{ message, data: faqs[] }` |
| GET | `/faq/:id` | الحصول على سؤال محدد | ❌ No | GUEST | `{ message, data: faq }` |
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

## 11. App Settings Module (`/app-settings`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/app-settings` | الحصول على إعدادات التطبيق | ❌ No | GUEST | `{ message, data: settings }` |
| PATCH | `/app-settings` | تحديث إعدادات التطبيق | ✅ Yes | ADMIN | `{ message, data: settings }` |

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

## 12. App Version Module (`/app-version`)

| Method | Endpoint | Description | Auth Required | Role Required | Response |
|--------|----------|-------------|---------------|---------------|----------|
| GET | `/app-version/check` | التحقق من إصدار التطبيق | ❌ No | GUEST | `{ message, data: { updateRequired, latestVersion, downloadUrl } }` |
| POST | `/app-version` | إضافة إصدار جديد | ✅ Yes | ADMIN | `{ message, data: version }` |
| GET | `/app-version/latest` | الحصول على أحدث إصدار | ❌ No | GUEST | `{ message, data: version }` |

**Check Version Query**:
```
?platform=ios&currentVersion=1.0.0
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

**Last Updated**: December 5, 2024
**API Version**: 1.0.0
**Total Endpoints**: 50+
