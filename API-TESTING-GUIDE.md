# 📋 دليل اختبار APIs - مشروع Al-Azhar Backend

## 🔗 Base URL
```
Development: http://localhost:3000/v1
Production: https://your-domain.com/v1
```

## 📌 Swagger Documentation
```
http://localhost:3000/api
```

---

## ✅ **1. Authentication APIs** `/auth`

### 1.1 تسجيل حساب جديد
```http
POST /auth/sign-up
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password123!",
  "fullName": "أحمد محمد",
  "phoneNumber": "+201234567890",
  "country": "Egypt",
  "gender": "male",
  "ageGroup": "child"
}
```
**Expected Response:** `200 OK` - OTP sent to email

### 1.2 تأكيد البريد الإلكتروني
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "student@example.com",
  "otp": "123456"
}
```
**Expected Response:** `200 OK` - Email verified

### 1.3 تسجيل الدخول
```http
POST /auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "Password123!"
}
```
**Expected Response:** `200 OK` - Returns access_token & refresh_token

### 1.4 جلب معلومات المستخدم الحالي
```http
GET /auth/get-me
Authorization: Bearer <access_token>
```
**Expected Response:** `200 OK` - User info

### 1.5 تحديث Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```
**Expected Response:** `200 OK` - New tokens

### 1.6 نسيت كلمة المرور
```http
POST /auth/forget-password
Content-Type: application/json

{
  "email": "student@example.com"
}
```
**Expected Response:** `200 OK` - OTP sent

### 1.7 تسجيل الخروج
```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```
**Expected Response:** `200 OK`

---

## 📦 **2. Plans APIs** `/plans`

### 2.1 جلب جميع الباقات النشطة
```http
GET /plans
```
**Expected Response:** `200 OK` - List of active plans

### 2.2 جلب الباقات حسب الدولة
```http
GET /plans?country=Egypt
```
**Expected Response:** `200 OK` - Plans filtered by country

### 2.3 جلب باقة واحدة
```http
GET /plans/1
```
**Expected Response:** `200 OK` - Plan details

### 2.4 إنشاء باقة جديدة (Admin فقط)
```http
POST /plans
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "nameEn": "Basic Plan",
  "nameAr": "الباقة الأساسية",
  "sessionDuration": 30,
  "sessionCount": 12,
  "basePrice": 29.99,
  "countryPricing": {
    "Egypt": 500,
    "Saudi Arabia": 200
  },
  "discountPercentage": 10,
  "isActive": true,
  "isPopular": false
}
```
**Expected Response:** `201 CREATED`

### 2.5 تحديث باقة (Admin فقط)
```http
PATCH /plans/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "discountPercentage": 15
}
```
**Expected Response:** `200 OK`

### 2.6 حذف باقة (Admin فقط)
```http
DELETE /plans/1
Authorization: Bearer <admin_token>
```
**Expected Response:** `200 OK`

---

## 📝 **3. Subscriptions APIs** `/subscriptions`

### 3.1 إنشاء اشتراك (Student فقط)
```http
POST /subscriptions/subscribe
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "planId": 1,
  "paymentMethod": "visa",
  "autoRenew": true
}
```
**Expected Response:** `201 CREATED`

### 3.2 جلب الاشتراك النشط للطالب
```http
GET /subscriptions/me
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK` - Active subscription

### 3.3 جلب تاريخ الاشتراكات
```http
GET /subscriptions/me/history
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK` - Subscription history

### 3.4 فحص إمكانية التسجيل
```http
GET /subscriptions/me/check
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK` - {canRecord: true, remainingSessions: 8}

### 3.5 إلغاء الاشتراك
```http
PATCH /subscriptions/me/cancel
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "reason": "Too expensive",
  "immediate": false
}
```
**Expected Response:** `200 OK`

### 3.6 تفعيل اشتراك (Admin فقط)
```http
PATCH /subscriptions/1/activate
Authorization: Bearer <admin_token>
```
**Expected Response:** `200 OK`

---

## 🎤 **4. Recitations APIs** `/recitations`

### 4.1 رفع تلاوة (Student فقط)
```http
POST /recitations/upload
Authorization: Bearer <student_token>
Content-Type: multipart/form-data

audio: <file.mp3>
surahId: 1
fromAyah: 1
toAyah: 7
notes: "First attempt"
```
**Expected Response:** `201 CREATED`

### 4.2 جلب تلاوات الطالب
```http
GET /recitations/me?page=1&limit=10
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK` - Paginated recitations

### 4.3 فلترة حسب السورة
```http
GET /recitations/me?surahId=1
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK`

### 4.4 فلترة حسب الحالة
```http
GET /recitations/me?status=completed
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK`

### 4.5 جلب إحصائيات التلاوات
```http
GET /recitations/me/statistics
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK` - Statistics

### 4.6 جلب تلاوة واحدة
```http
GET /recitations/123
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK` - Recitation details

### 4.7 حذف تلاوة
```http
DELETE /recitations/123
Authorization: Bearer <student_token>
```
**Expected Response:** `200 OK`

### 4.8 جلب تلاوة (Admin/Teacher)
```http
GET /recitations/admin/123
Authorization: Bearer <admin_or_teacher_token>
```
**Expected Response:** `200 OK`

---

## 🕌 **5. Quran APIs** `/quran`

### 5.1 جلب جميع السور
```http
GET /quran/surahs
```
**Expected Response:** `200 OK` - 114 Surahs

### 5.2 جلب سورة محددة
```http
GET /quran/surah/1?page=1&limit=10
```
**Expected Response:** `200 OK` - Surah Al-Fatiha (paginated)

### 5.3 جلب سورة كاملة
```http
GET /quran/surah/1/complete?language=ar
```
**Expected Response:** `200 OK` - Full Surah

### 5.4 جلب آية محددة
```http
GET /quran/ayah/1?language=ar
```
**Expected Response:** `200 OK` - Ayah details

### 5.5 جلب آية من سورة
```http
GET /quran/surah/1/ayah/1?language=ar
```
**Expected Response:** `200 OK`

### 5.6 جلب جزء
```http
GET /quran/juz/1?page=1&limit=20
```
**Expected Response:** `200 OK` - Juz 1 (paginated)

### 5.7 البحث في القرآن
```http
GET /quran/search/الحمد?page=1&limit=10
```
**Expected Response:** `200 OK` - Search results

---

## 🔊 **6. Quran Audio APIs** `/quran-audio`

### 6.1 جلب قائمة المشايخ
```http
GET /quran-audio/reciters?page=1&limit=10
```
**Expected Response:** `200 OK` - List of 6 reciters

### 6.2 جلب صوت آية واحدة
```http
POST /quran-audio/get-single-ayah-audio
Content-Type: application/json

{
  "surahNumber": 1,
  "ayahNumber": 1,
  "reciter": "ar.alafasy"
}
```
**Expected Response:** `200 OK` - Audio URL

### 6.3 جلب صوت مجموعة آيات
```http
POST /quran-audio/get-audio-links
Content-Type: application/json

{
  "surahNumber": 1,
  "startAyah": 1,
  "endAyah": 7,
  "reciter": "ar.husary"
}
```
**Expected Response:** `200 OK` - Array of audio URLs

### 6.4 جلب صوت سورة كاملة
```http
POST /quran-audio/get-surah-audio
Content-Type: application/json

{
  "surahNumber": 1,
  "reciter": "ar.minshawi"
}
```
**Expected Response:** `200 OK` - Full surah audio links

**المشايخ المتاحين:**
- `ar.abdulbasitmurattal` - عبد الباسط عبد الصمد
- `ar.husary` - محمود خليل الحصري (مرتل)
- `ar.husarymujawwad` - الحصري (مجود)
- `ar.muhammadjibreel` - محمد جبريل
- `ar.minshawi` - محمد صديق المنشاوي (مرتل)
- `ar.minshawimujawwad` - المنشاوي (مجود)

---

## 👥 **7. User APIs** `/user`

### 7.1 جلب جميع المستخدمين
```http
GET /user?page=1&limit=10
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 7.2 جلب مستخدم واحد
```http
GET /user/123
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 7.3 حذف مستخدم
```http
DELETE /user/123
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

---

## 📢 **8. Notifications APIs** `/notifications`

### 8.1 جلب إشعارات المستخدم
```http
GET /notifications/me?limit=20&page=1
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 8.2 تحديد إشعار كمقروء
```http
PATCH /notifications/123/read
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 8.3 تحديد جميع الإشعارات كمقروءة
```http
PATCH /notifications/mark-all-read?limit=50
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 8.4 إنشاء إشعار (Admin)
```http
POST /notifications
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "عنوان الإشعار",
  "body": "محتوى الإشعار",
  "type": "info"
}
```
**Expected Response:** `201 CREATED`

---

## ❓ **9. FAQ APIs** `/faq`

### 9.1 جلب جميع الأسئلة
```http
GET /faq
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 9.2 جلب سؤال واحد
```http
GET /faq/1
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 9.3 إنشاء سؤال جديد (Admin)
```http
POST /faq
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "questionEn": "How to subscribe?",
  "questionAr": "كيف أشترك؟",
  "answerEn": "Go to plans page...",
  "answerAr": "اذهب لصفحة الباقات..."
}
```
**Expected Response:** `201 CREATED`

### 9.4 تحديث سؤال (Admin)
```http
PATCH /faq/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "answerAr": "محتوى جديد"
}
```
**Expected Response:** `200 OK`

### 9.5 حذف سؤال (Admin)
```http
DELETE /faq/1
Authorization: Bearer <admin_token>
```
**Expected Response:** `200 OK`

---

## ⚙️ **10. App Settings APIs** `/app-settings`

### 10.1 جلب الإعدادات
```http
GET /app-settings/application
Authorization: Bearer <token>
```
**Expected Response:** `200 OK`

### 10.2 تحديث الإعدادات (Admin)
```http
PATCH /app-settings/application
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "maintenanceMode": false,
  "termsAndConditions": "شروط الاستخدام...",
  "privacyPolicy": "سياسة الخصوصية..."
}
```
**Expected Response:** `200 OK`

---

## 📱 **11. App Version APIs** `/app-version`

### 11.1 التحقق من الإصدار
```http
GET /app-version/check
```
**Expected Response:** `200 OK` - Current version

### 11.2 تحديث الإصدار
```http
PUT /app-version/update
Content-Type: application/json

{
  "version": "1.0.1",
  "forceUpdate": false
}
```
**Expected Response:** `200 OK`

---

## 🧪 **12. Testing Checklist**

### ✅ Authentication Flow
- [ ] تسجيل حساب جديد
- [ ] تأكيد OTP
- [ ] تسجيل دخول
- [ ] جلب معلومات المستخدم
- [ ] Refresh Token
- [ ] تسجيل خروج
- [ ] نسيت كلمة المرور

### ✅ Plans & Subscriptions
- [ ] جلب الباقات
- [ ] فلترة حسب الدولة
- [ ] إنشاء اشتراك
- [ ] فحص الجلسات المتبقية
- [ ] إلغاء اشتراك

### ✅ Recitations
- [ ] رفع تلاوة مع ملف صوتي
- [ ] جلب التلاوات (paginated)
- [ ] فلترة حسب السورة/الحالة
- [ ] حذف تلاوة

### ✅ Quran & Audio
- [ ] جلب السور
- [ ] جلب آيات سورة
- [ ] البحث في القرآن
- [ ] جلب قائمة المشايخ
- [ ] جلب صوت آية
- [ ] جلب صوت مجموعة آيات
- [ ] جلب صوت سورة كاملة

### ✅ Notifications
- [ ] جلب إشعارات المستخدم
- [ ] تحديد كمقروء
- [ ] تحديد الكل كمقروء

### ✅ Admin Functions
- [ ] إنشاء باقة
- [ ] تفعيل اشتراك
- [ ] إنشاء FAQ
- [ ] تحديث الإعدادات

---

## 🔒 **13. Authorization Matrix**

| Endpoint | Guest | Student | Teacher | Parent | Admin |
|----------|-------|---------|---------|--------|-------|
| GET /plans | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /plans | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /subscriptions/subscribe | ❌ | ✅ | ❌ | ❌ | ❌ |
| POST /recitations/upload | ❌ | ✅ | ❌ | ❌ | ❌ |
| GET /recitations/admin/:id | ❌ | ❌ | ✅ | ❌ | ✅ |
| GET /quran/* | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /quran-audio/* | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /faq | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## ⚠️ **14. Common Error Responses**

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Email is required"]
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "Forbidden - Admin role required"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Resource not found"
}

// 409 Conflict
{
  "statusCode": 409,
  "message": "User already has active subscription"
}
```

---

## 📊 **15. Expected Response Format**

جميع الـ responses تتبع هذا الشكل:

```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

---

## 🚀 **16. Quick Start Testing**

### استخدام Postman:
1. افتح Postman
2. استورد Collection من Swagger: `http://localhost:3000/api-json`
3. ضبط Environment Variables:
   - `base_url`: `http://localhost:3000/v1`
   - `access_token`: (بعد Login)
   - `refresh_token`: (بعد Login)

### استخدام cURL:
```bash
# Login
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Get Plans
curl -X GET http://localhost:3000/v1/plans

# Upload Recitation
curl -X POST http://localhost:3000/v1/recitations/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@recitation.mp3" \
  -F "surahId=1" \
  -F "fromAyah=1" \
  -F "toAyah=7"
```

---

## ✅ **Status: API Coverage**

✅ Authentication - 100%
✅ Plans - 100%
✅ Subscriptions - 100%
✅ Recitations - 100%
✅ Quran - 100%
✅ Quran Audio - 100%
✅ Users - 100%
✅ Notifications - 100%
✅ FAQ - 100%
✅ App Settings - 100%
✅ App Version - 100%

**Total APIs Documented: ~50+ endpoints**
