# دليل إعداد Paymob - بوابة الدفع بالفيزا 💳

## نظرة عامة

Paymob هي بوابة الدفع المصرية الأشهر، تدعم:
- ✅ Visa / Mastercard
- ✅ Vodafone Cash
- ✅ Fawry
- ✅ Mobile Wallets

**الرسوم:** 2.5% فقط (بدون رسوم ثابتة)

---

## الخطوة 1: إنشاء حساب Paymob

### 1.1 التسجيل
```
https://accept.paymob.com/portal2/en/register
```

**المعلومات المطلوبة:**
- الاسم الكامل
- البريد الإلكتروني
- رقم الهاتف
- كلمة المرور

### 1.2 تفعيل الحساب
- تحقق من بريدك الإلكتروني
- اضغط على رابط التفعيل

---

## الخطوة 2: إكمال KYC (التحقق من الهوية)

بعد تسجيل الدخول، اذهب إلى **Settings** → **Account Info**

### المستندات المطلوبة:
1. **صورة البطاقة (وجهين)**
2. **صورة شخصية**
3. **إثبات عنوان** (فاتورة كهرباء/مياه)
4. **السجل التجاري** (للشركات)

⏱️ **مدة المراجعة:** 1-3 أيام عمل

---

## الخطوة 3: إنشاء Integration (تكامل الدفع)

### 3.1 Card Integration (فيزا)

1. اذهب إلى **Developers** → **Integrations**
2. اضغط **New Integration**
3. املأ:
   - **Name:** `Quran Yutla Card Payment`
   - **Type:** `Card Payment`
   - **Currency:** `EGP`
4. احفظ **Integration ID** (ستحتاجه)

### 3.2 Wallet Integration (اختياري)

كرر الخطوات للمحفظة الإلكترونية:
- **Name:** `Quran Yutla Wallet Payment`
- **Type:** `Mobile Wallet`

---

## الخطوة 4: إنشاء iFrame (واجهة الدفع)

### 4.1 إنشاء iFrame جديد

1. **Developers** → **iFrames**
2. **Create iFrame**
3. املأ:
   - **Name:** `Quran Yutla Payment Page`
   - **Integration:** اختر Card Integration
4. احفظ **iFrame ID**

---

## الخطوة 5: الحصول على API Key & HMAC Secret

### 5.1 API Key

1. **Settings** → **Account Info**
2. **API Key** → Copy
3. احفظه في مكان آمن

### 5.2 HMAC Secret

1. نفس الصفحة
2. **HMAC Secret** → Copy
3. احفظه (للتحقق من Webhooks)

---

## الخطوة 6: تحديث ملف .env

```bash
# Paymob Payment Gateway
PAYMOB_API_KEY=ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5...
PAYMOB_INTEGRATION_ID_CARD=123456
PAYMOB_INTEGRATION_ID_WALLET=789012
PAYMOB_IFRAME_ID=654321
PAYMOB_HMAC_SECRET=A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6...
PAYMOB_CURRENCY=EGP
PAYMENT_SUCCESS_URL=http://localhost:3777/payment/success
PAYMENT_FAILURE_URL=http://localhost:3777/payment/failed
```

---

## الخطوة 7: تفعيل Webhook

### 7.1 إعداد Webhook URL

1. **Settings** → **Webhooks**
2. **Add Webhook**
3. URL: `https://your-domain.com/api/v1/subscriptions/webhook/paymob`
4. **Events:** اختر جميع Events

### 7.2 اختبار Webhook محلياً (Development)

استخدم **ngrok** لعمل tunnel:

```bash
# تثبيت ngrok
npm install -g ngrok

# تشغيل ngrok
ngrok http 3777

# ستحصل على URL مثل:
https://abc123.ngrok.io

# أضفه في Paymob Webhook:
https://abc123.ngrok.io/api/v1/subscriptions/webhook/paymob
```

---

## الخطوة 8: اختبار التكامل

### 8.1 Test Cards (بيئة الاختبار)

```
Card Number: 4987654321098769
CVV: 123
Expiry: 12/25
```

### 8.2 تشغيل المشروع

```bash
npm run start:dev
```

### 8.3 اختبار Payment Flow

```bash
# 1. تسجيل دخول
POST /api/v1/auth/login
{
  "email": "student@example.com",
  "password": "password123"
}

# 2. بدء الدفع
POST /api/v1/subscriptions/initiate-payment
Headers: Authorization: Bearer <token>
{
  "planId": 1
}

# Response:
{
  "subscriptionId": 123,
  "paymentUrl": "https://accept.paymob.com/api/acceptance/iframes/654321?payment_token=...",
  "sessionId": "...",
  "amount": 50
}

# 3. افتح paymentUrl في المتصفح
# 4. أدخل بيانات test card
# 5. أكمل الدفع
# 6. سيتم redirect لـ success_url
# 7. Paymob سيرسل webhook للباك-إند
# 8. الاشتراك سيتفعل تلقائياً
```

---

## الخطوة 9: الانتقال للإنتاج (Production)

### 9.1 تفعيل Live Mode

1. أكمل جميع متطلبات KYC
2. انتظر موافقة Paymob
3. في Dashboard: **Switch to Live**

### 9.2 تحديث البيئة

```bash
# Production .env
PAYMOB_API_KEY=<production_api_key>
PAYMOB_INTEGRATION_ID_CARD=<production_integration_id>
PAYMOB_IFRAME_ID=<production_iframe_id>
PAYMENT_SUCCESS_URL=https://yourapp.com/payment/success
PAYMENT_FAILURE_URL=https://yourapp.com/payment/failed
```

### 9.3 تحديث Webhook URL

```
https://api.yourapp.com/api/v1/subscriptions/webhook/paymob
```

---

## تدفق الدفع الكامل (Payment Flow)

```
1. المستخدم يختار باقة
   ↓
2. Frontend: POST /initiate-payment
   ↓
3. Backend:
   - ينشئ subscription (status: pending_payment)
   - يتصل بـ Paymob API
   - يحصل على payment token
   - يرجع payment URL
   ↓
4. Frontend: يفتح payment URL
   ↓
5. Paymob iFrame:
   - المستخدم يدخل بيانات الكارت
   - يضغط "ادفع"
   ↓
6. البنك:
   - يوافق/يرفض الدفع
   ↓
7. Paymob:
   - يرسل Webhook لـ Backend
   - يُرجع المستخدم لـ success/failure URL
   ↓
8. Backend Webhook Handler:
   - يتحقق من HMAC signature
   - يفعّل الاشتراك (status: active)
   - يضبط remainingSessions
   ↓
9. Frontend Success Page:
   - يعرض رسالة نجاح
   - يوجه للصفحة الرئيسية
```

---

## API Endpoints

### 1. Initiate Payment
```http
POST /api/v1/subscriptions/initiate-payment
Authorization: Bearer <token>

Request:
{
  "planId": 1,
  "autoRenew": false
}

Response:
{
  "success": true,
  "data": {
    "subscriptionId": 123,
    "paymentUrl": "https://accept.paymob.com/api/acceptance/iframes/...",
    "sessionId": "token_abc123",
    "amount": 50
  }
}
```

### 2. Webhook (من Paymob)
```http
POST /api/v1/subscriptions/webhook/paymob

Body: (من Paymob)
{
  "obj": {
    "id": 12345678,
    "success": true,
    "amount_cents": 5000,
    "order": {
      "merchant_order_id": "SUB-123"
    },
    ...
  },
  "hmac": "abc123def456..."
}

Response:
{
  "success": true
}
```

### 3. Verify Payment (Manual)
```http
POST /api/v1/subscriptions/verify-payment
Authorization: Bearer <token>

Request:
{
  "transactionId": "12345678",
  "subscriptionId": 123,
  "status": "success"
}

Response:
{
  "success": true,
  "data": {
    "id": 123,
    "status": "active",
    "remainingSessions": 5,
    ...
  }
}
```

---

## Frontend Integration Example

### React/Vue/Angular

```javascript
// 1. بدء الدفع
async function startPayment(planId) {
  const response = await fetch('/api/v1/subscriptions/initiate-payment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ planId })
  });
  
  const { data } = await response.json();
  
  // 2. فتح صفحة الدفع
  window.location.href = data.paymentUrl;
  // أو
  window.open(data.paymentUrl, '_blank');
}

// 3. Success Page
// URL: /payment/success?success=true&order=SUB-123
// اعرض رسالة نجاح ووجه للصفحة الرئيسية

setTimeout(() => {
  window.location.href = '/dashboard';
}, 3000);
```

### React Native

```javascript
import { WebView } from 'react-native-webview';

function PaymentScreen({ paymentUrl, onSuccess, onFailure }) {
  const handleNavigationStateChange = (navState) => {
    if (navState.url.includes('/payment/success')) {
      onSuccess();
    } else if (navState.url.includes('/payment/failed')) {
      onFailure();
    }
  };

  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}
```

---

## Troubleshooting 🔧

### Error: Invalid API Key
```
✅ Solution:
- تأكد من نسخ الـ API Key بالكامل
- لا تنسى التبديل من Test → Live
- API Key يبدأ بـ ZXlKaGJH...
```

### Error: Integration ID not found
```
✅ Solution:
- تحقق من Integration ID
- تأكد من تفعيل Integration
- Integration ID رقم (مثل: 123456)
```

### Webhook لا يعمل
```
✅ Solution:
- تحقق من HMAC Secret
- تأكد من Webhook URL صحيح
- استخدم ngrok للتطوير المحلي
- تحقق من Logs في Paymob Dashboard
```

### Payment يتم لكن Subscription لا يتفعل
```
✅ Solution:
- تحقق من Webhook Handler
- افحص Logs
- تأكد من صحة Order ID format (SUB-123)
```

---

## Security Best Practices 🔒

### 1. احفظ Credentials بشكل آمن
```bash
# ❌ لا تفعل
const API_KEY = "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJ...";

# ✅ استخدم .env
PAYMOB_API_KEY=ZXlKaGJHY2lPaUpJVXpVeE1pSXNJ...
```

### 2. تحقق من HMAC دائماً
```typescript
// في الـ Webhook Handler
const isValid = paymobService.verifyWebhookSignature(
  data,
  receivedHmac
);

if (!isValid) {
  throw new UnauthorizedException();
}
```

### 3. استخدم HTTPS في Production
```
✅ https://api.yourapp.com
❌ http://api.yourapp.com
```

---

## Monitoring & Logs

### 1. Paymob Dashboard
```
Transactions → View All Transactions
- تتبع كل المدفوعات
- حالة كل معاملة
- تفاصيل الأخطاء
```

### 2. Backend Logs
```typescript
// في الـ Service
this.logger.log(`Payment initiated: SUB-${subscriptionId}`);
this.logger.log(`Webhook received: Order ${orderId}`);
this.logger.error(`Payment failed: ${error.message}`);
```

---

## الخلاصة ✅

بعد إتمام جميع الخطوات:
1. ✅ حساب Paymob مفعّل
2. ✅ Integration IDs جاهزة
3. ✅ iFrame مُعد
4. ✅ Webhook يعمل
5. ✅ التطبيق متكامل بالكامل

**تكلفة المعاملات:** 2.5% فقط
**مدة التحويل:** 3-5 أيام عمل

**بالتوفيق! 🚀**
