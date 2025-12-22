# رحلة المستخدم الكاملة - من التسجيل إلى التسميع

## السيناريو الكامل: من صفر إلى تسجيل تسميع ✅

---

## المرحلة 1️⃣: التسجيل كطالب (Guest)

### الخطوة 1: إنشاء حساب جديد
**Endpoint:** `POST /api/v1/auth/register`

```json
Request:
{
  "email": "ahmed.student@example.com",
  "password": "Ahmed@12345",
  "firstName": "أحمد",
  "lastName": "محمد",
  "phoneNumber": "+201234567890",
  "gender": "male",
  "dateOfBirth": "2010-05-15",
  "role": "student"
}

Response (201 Created):
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully. Please verify your email.",
  "data": {
    "id": 123,
    "email": "ahmed.student@example.com",
    "firstName": "أحمد",
    "lastName": "محمد",
    "role": "student",
    "isEmailVerified": false,
    "createdAt": "2025-12-10T10:00:00.000Z"
  }
}
```

**ملاحظة:** الحساب تم إنشاؤه لكن البريد غير مفعّل (`isEmailVerified: false`)

---

### الخطوة 2: تفعيل البريد الإلكتروني
**سيصل للبريد رسالة بها رمز التفعيل (OTP)**

**Endpoint:** `POST /api/v1/email-verification/verify`

```json
Request:
{
  "email": "ahmed.student@example.com",
  "otp": "123456"
}

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully",
  "data": {
    "verified": true
  }
}
```

**الآن البريد مفعّل ✅**

---

### الخطوة 3: تسجيل الدخول
**Endpoint:** `POST /api/v1/auth/login`

```json
Request:
{
  "email": "ahmed.student@example.com",
  "password": "Ahmed@12345"
}

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 123,
      "email": "ahmed.student@example.com",
      "firstName": "أحمد",
      "lastName": "محمد",
      "role": "student",
      "isEmailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**احفظ الـ accessToken - ستحتاجه في كل طلب!**

---

## المرحلة 2️⃣: الاشتراك في باقة

### الخطوة 4: عرض الباقات المتاحة
**Endpoint:** `GET /api/v1/plans`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "الباقة الأساسية",
      "nameEn": "Basic Plan",
      "description": "5 جلسات تسميع شهرياً",
      "price": 50,
      "currency": "EGP",
      "durationDays": 30,
      "sessionsPerMonth": 5,
      "features": ["5 جلسات", "تقييم آلي", "دعم فني"],
      "isActive": true
    },
    {
      "id": 2,
      "name": "الباقة المتقدمة",
      "nameEn": "Advanced Plan",
      "description": "15 جلسة تسميع شهرياً",
      "price": 120,
      "currency": "EGP",
      "durationDays": 30,
      "sessionsPerMonth": 15,
      "features": ["15 جلسة", "تقييم معلم", "دعم أولوية"],
      "isActive": true
    }
  ]
}
```

---

### الخطوة 5: بدء عملية الدفع
**Endpoint:** `POST /api/v1/subscriptions/initiate-payment`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
Request:
{
  "planId": 1,
  "autoRenew": false,
  "successUrl": "myapp://payment/success",
  "failureUrl": "myapp://payment/failed"
}

Response (201 Created):
{
  "success": true,
  "statusCode": 201,
  "message": "تم بدء عملية الدفع بنجاح. يرجى إتمام الدفع.",
  "data": {
    "subscriptionId": 456,
    "paymentUrl": "https://payment.gateway.com/checkout?session=abc123",
    "sessionId": "session_456_1702234800000",
    "amount": 50
  }
}
```

**الآن لديك:**
- Subscription بحالة `pending_payment`
- رابط الدفع `paymentUrl`

---

### الخطوة 6: الدفع بالفيزا 💳

**المستخدم ينتقل لصفحة الدفع:**

```javascript
// في الـ Frontend
window.location.href = paymentUrl;
// أو
window.open(paymentUrl, '_blank');
```

**في صفحة الدفع:**
1. المستخدم يدخل بيانات الكارت:
   - رقم الكارت: 4242 4242 4242 4242
   - تاريخ الانتهاء: 12/25
   - CVV: 123
   
2. يضغط "ادفع الآن"

3. البنك يوافق على الدفع ✅

4. Payment Gateway يُرجع المستخدم لـ `successUrl` مع transaction ID

**مثال الـ Callback:**
```
myapp://payment/success?transaction_id=txn_1234567890&subscription_id=456&status=success
```

---

### الخطوة 7: تأكيد الدفع وتفعيل الاشتراك
**Endpoint:** `POST /api/v1/subscriptions/verify-payment`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
Request:
{
  "transactionId": "txn_1234567890",
  "subscriptionId": 456,
  "status": "success"
}

Response (200 OK):
{
  "success": true,
  "statusCode": 200,
  "message": "تم تفعيل الاشتراك بنجاح",
  "data": {
    "id": 456,
    "userId": 123,
    "planId": 1,
    "status": "active",
    "startDate": "2025-12-10T10:00:00.000Z",
    "endDate": "2026-01-09T10:00:00.000Z",
    "remainingSessions": 5,
    "totalSessions": 5,
    "transactionId": "txn_1234567890",
    "lastPaymentDate": "2025-12-10T10:00:00.000Z",
    "autoRenew": false
  }
}
```

**الآن لديك اشتراك نشط بـ 5 جلسات! ✅**

---

## المرحلة 3️⃣: التحضير للتسميع

### الخطوة 8: اختيار السورة والآيات
**يمكنك عرض السور المتاحة:**

**Endpoint:** `GET /api/v1/quran/surahs`

```json
Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nameArabic": "الفاتحة",
      "nameEnglish": "Al-Fatihah",
      "totalAyahs": 7,
      "revelationType": "meccan"
    },
    {
      "id": 2,
      "nameArabic": "البقرة",
      "nameEnglish": "Al-Baqarah",
      "totalAyahs": 286,
      "revelationType": "medinan"
    }
    // ... باقي السور
  ]
}
```

**اختر مثلاً:**
- السورة: الفاتحة (id: 1)
- من آية: 1
- إلى آية: 7

---

## المرحلة 4️⃣: تسجيل التسميع 🎤

### السيناريو A: التسجيل المباشر (الطريقة الجديدة) ⭐

#### الخطوة 9أ: فتح صفحة التسجيل في التطبيق

**في الـ Frontend:**

```javascript
// 1. طلب إذن الميكروفون
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// 2. تجهيز MediaRecorder
const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
  ? 'audio/webm;codecs=opus' 
  : 'audio/webm';

const mediaRecorder = new MediaRecorder(stream, { mimeType });
const audioChunks = [];

mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data);
};

// 3. بدء التسجيل
mediaRecorder.start();
console.log('🎤 ابدأ القراءة الآن...');

// المستخدم يقرأ: بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ...

// 4. إيقاف التسجيل بعد الانتهاء
mediaRecorder.stop();
```

---

#### الخطوة 10أ: رفع التسجيل مباشرة

**Endpoint:** `POST /api/v1/recitations/record-direct`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**JavaScript Code:**
```javascript
mediaRecorder.onstop = async () => {
  // إنشاء audio blob
  const audioBlob = new Blob(audioChunks, { type: mimeType });
  
  // إنشاء FormData
  const formData = new FormData();
  formData.append('audioBlob', audioBlob, 'recitation.webm');
  formData.append('surahId', '1');
  formData.append('fromAyah', '1');
  formData.append('toAyah', '7');
  formData.append('audioFormat', 'webm');
  formData.append('notes', 'تسميع سورة الفاتحة - أول محاولة');
  
  // رفع التسجيل
  const response = await fetch('/api/v1/recitations/record-direct', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    body: formData
  });
  
  const result = await response.json();
  console.log('✅ تم رفع التسميع:', result);
};
```

**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "تم تسجيل ورفع التسميع المباشر بنجاح",
  "data": {
    "id": 789,
    "userId": 123,
    "surahId": 1,
    "fromAyah": 1,
    "toAyah": 7,
    "audioUrl": "https://s3.amazonaws.com/bucket/recitations/user-123/rec-789.webm",
    "audioKey": "recitations/user-123/rec-789.webm",
    "duration": 45,
    "fileSize": 720000,
    "notes": "تسميع سورة الفاتحة - أول محاولة",
    "status": "pending",
    "evaluationScore": null,
    "evaluationData": null,
    "createdAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

### السيناريو B: رفع ملف موجود (الطريقة التقليدية)

#### الخطوة 9ب: تسجيل صوت خارج التطبيق
- سجّل صوتك باستخدام أي تطبيق (Voice Recorder، تطبيق الهاتف، إلخ)
- احفظ الملف بصيغة MP3 أو M4A أو WAV

#### الخطوة 10ب: رفع الملف

**Endpoint:** `POST /api/v1/recitations/upload`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**Form Data:**
```
audio: [ملف صوتي - recitation.mp3]
surahId: 1
fromAyah: 1
toAyah: 7
notes: تسميع سورة الفاتحة
```

**cURL Example:**
```bash
curl -X POST https://api.example.com/api/v1/recitations/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "audio=@recitation.mp3" \
  -F "surahId=1" \
  -F "fromAyah=1" \
  -F "toAyah=7" \
  -F "notes=تسميع سورة الفاتحة"
```

**Response:** نفس الـ response السابق

---

## المرحلة 5️⃣: متابعة التسميع

### الخطوة 11: عرض تسميعاتي

**Endpoint:** `GET /api/v1/recitations/me?page=1&limit=10`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```json
Response (200 OK):
{
  "success": true,
  "data": [
    {
      "id": 789,
      "surahId": 1,
      "fromAyah": 1,
      "toAyah": 7,
      "audioUrl": "https://s3.amazonaws.com/bucket/recitations/user-123/rec-789.webm",
      "status": "pending",
      "evaluationScore": null,
      "createdAt": "2025-12-10T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### الخطوة 12: التحقق من الجلسات المتبقية

**Endpoint:** `GET /api/v1/subscriptions/my-subscription`

```json
Response (200 OK):
{
  "success": true,
  "data": {
    "id": 456,
    "remainingSessions": 4,  // كان 5، نقص واحد بعد التسميع
    "totalSessions": 5,
    "status": "active",
    "endDate": "2026-01-09T10:00:00.000Z"
  }
}
```

**لاحظ:** الجلسات المتبقية أصبحت 4 (نقصت واحدة) ✅

---

### الخطوة 13: عرض الإحصائيات

**Endpoint:** `GET /api/v1/recitations/me/statistics`

```json
Response (200 OK):
{
  "success": true,
  "data": {
    "totalRecitations": 1,
    "completedRecitations": 0,
    "pendingRecitations": 1,
    "averageScore": 0
  }
}
```

---

## المرحلة 6️⃣: استلام التقييم (من المعلم/النظام)

### الخطوة 14: بعد مراجعة المعلم

**عندما يقوم المعلم/النظام بتقييم التسميع، سيتحدث الـ status:**

**Endpoint:** `GET /api/v1/recitations/:id`

```json
Response (200 OK):
{
  "success": true,
  "data": {
    "id": 789,
    "surahId": 1,
    "fromAyah": 1,
    "toAyah": 7,
    "status": "completed",  // تغيرت من pending
    "evaluationScore": 85,  // الدرجة
    "evaluationData": {     // تفاصيل التقييم
      "tajweed": 90,
      "memorization": 85,
      "pronunciation": 80,
      "notes": "ممتاز، مع مراعاة المدود"
    },
    "createdAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

## ملخص الرحلة الكاملة 📋

```
┌─────────────────────────────────────┐
│  1. التسجيل (Register)              │
│     POST /auth/register             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. تفعيل البريد (Verify Email)     │
│     POST /email-verification/verify │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. تسجيل الدخول (Login)            │
│     POST /auth/login                │
│     ✅ احصل على Access Token        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. عرض الباقات (Plans)             │
│     GET /plans                      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. بدء الدفع (Initiate Payment)    │
│     POST /subscriptions/            │
│          initiate-payment           │
│     ✅ احصل على رابط الدفع          │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  6. الدفع بالفيزا 💳                │
│     - ادخل بيانات الكارت             │
│     - البنك يوافق                    │
│     - رجوع للتطبيق                  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  7. تأكيد الدفع (Verify Payment)    │
│     POST /subscriptions/            │
│          verify-payment             │
│     ✅ الاشتراك أصبح نشط             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  8. اختيار السورة والآيات           │
│     GET /quran/surahs               │
└──────────────┬──────────────────────┘
               ↓
      ┌────────┴────────┐
      ↓                 ↓
┌──────────────┐  ┌──────────────┐
│ 9أ. تسجيل    │  │ 9ب. رفع ملف │
│    مباشر     │  │    موجود     │
│  (WebM)     │  │   (MP3)      │
└──────┬───────┘  └──────┬───────┘
       ↓                 ↓
┌──────────────┐  ┌──────────────┐
│ record-direct│  │    upload    │
└──────┬───────┘  └──────┬───────┘
       └────────┬─────────┘
                ↓
┌─────────────────────────────────────┐
│  ✅ التسميع تم رفعه بنجاح           │
│     - status: pending               │
│     - الجلسات نقصت واحدة             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  11. عرض تسميعاتي                   │
│     GET /recitations/me             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  12. متابعة الإحصائيات              │
│     GET /recitations/me/statistics  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  🎉 استلام التقييم                  │
│     status: completed               │
│     evaluationScore: 85             │
└─────────────────────────────────────┘
```

---

## نقاط مهمة جداً ⚠️

### 1. التوكن (Token)
```javascript
// احفظه في localStorage أو sessionStorage
localStorage.setItem('accessToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// استخدمه في كل طلب
headers: {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
}
```

### 2. التحقق من الاشتراك
قبل تسجيل أي تسميع، تأكد من:
- ✅ الاشتراك نشط (`status: active`)
- ✅ لديك جلسات متبقية (`remainingSessions > 0`)

### 3. صيغ الصوت المدعومة

**للتسجيل المباشر:**
- WebM (الأفضل للمتصفحات)
- OGG
- MP4

**لرفع ملف:**
- MP3
- M4A
- WAV

### 4. حدود النظام
- **حجم الملف:** أقصى 100 ميجابايت
- **الجلسات:** حسب الباقة (5 أو 15 جلسة)
- **مدة الاشتراك:** 30 يوم

---

## كود مثال كامل (React Component)

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://api.example.com/api/v1';

function RecitationApp() {
  const [token, setToken] = useState(localStorage.getItem('accessToken'));
  const [subscription, setSubscription] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  // تسجيل الدخول
  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    const { accessToken } = response.data.data.tokens;
    setToken(accessToken);
    localStorage.setItem('accessToken', accessToken);
  };

  // جلب بيانات الاشتراك
  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/subscriptions/my-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setSubscription(res.data.data))
      .catch(err => console.error(err));
    }
  }, [token]);

  // بدء التسجيل
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { 
      mimeType: 'audio/webm;codecs=opus' 
    });
    
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    
    setMediaRecorder(recorder);
    setAudioChunks(chunks);
    recorder.start();
    setIsRecording(true);
  };

  // إيقاف ورفع التسجيل
  const stopAndUpload = async () => {
    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audioBlob', blob, 'recitation.webm');
        formData.append('surahId', '1');
        formData.append('fromAyah', '1');
        formData.append('toAyah', '7');
        formData.append('audioFormat', 'webm');
        
        try {
          const response = await axios.post(
            `${API_URL}/recitations/record-direct`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          alert('تم رفع التسميع بنجاح!');
          resolve(response.data);
          
          // تحديث الاشتراك
          const subRes = await axios.get(
            `${API_URL}/subscriptions/my-subscription`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          setSubscription(subRes.data.data);
        } catch (error) {
          alert('خطأ: ' + error.response?.data?.message);
        }
      };
      
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    });
  };

  return (
    <div>
      <h1>تطبيق التسميع</h1>
      
      {!token ? (
        <button onClick={() => login('ahmed.student@example.com', 'Ahmed@12345')}>
          تسجيل الدخول
        </button>
      ) : (
        <>
          <div>
            <h2>الاشتراك</h2>
            {subscription && (
              <p>الجلسات المتبقية: {subscription.remainingSessions}</p>
            )}
          </div>
          
          <div>
            <h2>تسجيل التسميع</h2>
            {!isRecording ? (
              <button onClick={startRecording}>🎤 ابدأ التسجيل</button>
            ) : (
              <button onClick={stopAndUpload}>⏹️ إيقاف ورفع</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RecitationApp;
```

---

## خلاصة السيناريو 🎯

1. **سجّل حساب** → تفعيل البريد
2. **سجّل دخول** → احصل على Token
3. **اشترك في باقة** → ادفع بالفيزا → احصل على جلسات
4. **سجّل تسميع** → مباشر أو رفع ملف
5. **تابع تقدمك** → إحصائيات وتقييمات

**الآن أنت جاهز للبدء! 🚀**
