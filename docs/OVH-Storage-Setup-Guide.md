# إعداد OVH Cloud Storage لمشروع Quran Yutla

## الخطوة 1: إنشاء حساب OVH

1. اذهب إلى: https://www.ovhcloud.com/
2. اختر **Public Cloud**
3. سجّل حساب جديد (أو سجّل دخول)

---

## الخطوة 2: إنشاء Object Storage (S3 Compatible)

### من OVH Control Panel:

1. **Public Cloud** → **Object Storage** → **Create Object Storage**
2. اختر:
   - **Region:** `GRA` (Gravelines, France) - الأقرب للشرق الأوسط
   - **Solution:** `High Performance - Object Storage`
   - **Name:** `quran-yutla-storage`
3. اضغط **Create**

---

## الخطوة 3: إنشاء S3 User & Credentials

### 1. إنشاء S3 User:
```
Public Cloud → Users & Roles → Create User
- Username: quran-yutla-s3-user
- Role: ObjectStore operator
```

### 2. الحصول على Access Keys:
بعد إنشاء المستخدم، ستحصل على:
- ✅ **Access Key ID** (مثل: `07d47c7d115d46c6b6d80bff222e9fe6`)
- ✅ **Secret Access Key** (مثل: `db81abcd26944ca99435f1cec75d07a5`)

⚠️ **مهم:** احفظهم فوراً! السر لن يظهر مرة أخرى.

---

## الخطوة 4: إنشاء Container (Bucket)

### من Object Storage Interface:

1. اختر الـ region: **GRA**
2. اضغط **Create a container**
3. املأ البيانات:
   - **Container name:** `quran-yutla-container`
   - **Type:** `Public` (للوصول العام للملفات)
   - **Archive policy:** `None`
4. اضغط **Create container**

---

## الخطوة 5: الحصول على الـ Credentials الكاملة

### المعلومات المطلوبة:

```bash
# Region
OVH_REGION=gra

# Endpoint (حسب الـ Region)
# GRA (Gravelines, France)
OVH_ENDPOINT=https://s3.gra.io.cloud.ovh.net

# أو اختر region آخر:
# BHS (Beauharnois, Canada)
# OVH_ENDPOINT=https://s3.bhs.io.cloud.ovh.net

# SBG (Strasbourg, France)  
# OVH_ENDPOINT=https://s3.sbg.io.cloud.ovh.net

# Access Keys (من الخطوة 3)
OVH_ACCESS_KEY=your_access_key_here
OVH_SECRET_ACCESS_KEY=your_secret_key_here

# Container Name (من الخطوة 4)
OVH_BUCKET_NAME=quran-yutla-container

# Base URL للوصول للملفات
OVH_BASE_URL=https://quran-yutla-container.s3.gra.io.cloud.ovh.net

# File Upload Limits
MAX_SIZE_FILE_UPLOAD=100
IMAGE_QUALITY=80
```

---

## الخطوة 6: تحديث ملف .env

```bash
# افتح ملف .env
# استبدل القيم القديمة بالجديدة

# OVH Cloud Storage - Quran Yutla
OVH_REGION=gra
OVH_ENDPOINT=https://s3.gra.io.cloud.ovh.net
OVH_ACCESS_KEY=YOUR_NEW_ACCESS_KEY
OVH_SECRET_ACCESS_KEY=YOUR_NEW_SECRET_KEY
OVH_BUCKET_NAME=quran-yutla-container
OVH_BASE_URL=https://quran-yutla-container.s3.gra.io.cloud.ovh.net
MAX_SIZE_FILE_UPLOAD=100
IMAGE_QUALITY=80
```

---

## الخطوة 7: اختبار الاتصال

### Test Script:

```typescript
// test-ovh-storage.ts
import { S3Client, PutObjectCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'gra',
  endpoint: 'https://s3.gra.io.cloud.ovh.net',
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
  },
  forcePathStyle: true,
});

async function testConnection() {
  try {
    // Test 1: List buckets
    const buckets = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ Connection successful!');
    console.log('Buckets:', buckets.Buckets);

    // Test 2: Upload test file
    const testFile = Buffer.from('Test file from Quran Yutla');
    const uploadParams = {
      Bucket: 'quran-yutla-container',
      Key: 'test/test.txt',
      Body: testFile,
      ContentType: 'text/plain',
      ACL: 'public-read',
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('✅ File uploaded successfully!');
    console.log('URL: https://quran-yutla-container.s3.gra.io.cloud.ovh.net/test/test.txt');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testConnection();
```

### تشغيل الاختبار:
```bash
npx ts-node test-ovh-storage.ts
```

---

## الخطوة 8: هيكل المجلدات المقترح

```
quran-yutla-container/
├── users/
│   └── avatars/
│       ├── user-1-abc123.jpg
│       └── user-2-def456.jpg
├── recitations/
│   ├── user-1/
│   │   ├── recitation-1.webm
│   │   └── recitation-2.webm
│   └── user-2/
│       └── recitation-3.mp3
├── quran-audio/
│   ├── surah-001/
│   │   ├── ayah-001.mp3
│   │   └── ayah-002.mp3
│   └── surah-002/
│       └── ayah-001.mp3
└── temp/
    └── uploads/
```

---

## الخطوة 9: إعداد CORS (إذا كان التطبيق Web)

### من OVH Console:

```json
{
  "cors": [
    {
      "allowedOrigins": ["*"],
      "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
      "allowedHeaders": ["*"],
      "exposedHeaders": ["ETag"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

---

## الخطوة 10: إعداد Lifecycle Policy (اختياري)

لحذف الملفات القديمة تلقائياً:

```json
{
  "rules": [
    {
      "id": "delete-old-temp-files",
      "status": "Enabled",
      "prefix": "temp/",
      "expiration": {
        "days": 7
      }
    },
    {
      "id": "delete-old-recitations",
      "status": "Enabled",
      "prefix": "recitations/",
      "expiration": {
        "days": 90
      }
    }
  ]
}
```

---

## التكلفة المتوقعة 💰

### OVH Object Storage Pricing:

- **Storage:** €0.01 / GB / month
- **Outbound Traffic:** €0.01 / GB
- **Requests:** 
  - PUT/POST: €0.005 per 1,000 requests
  - GET: €0.004 per 10,000 requests

### مثال (1000 مستخدم):
- Storage: 50 GB × €0.01 = **€0.50/month**
- Traffic: 100 GB × €0.01 = **€1.00/month**
- **Total: ~€1.50/month (≈ 50 EGP)**

---

## البدائل المجانية للتطوير:

### 1. **Cloudflare R2** (10 GB مجاناً)
```bash
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
```

### 2. **Supabase Storage** (1 GB مجاناً)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=...
```

### 3. **AWS S3 Free Tier** (5 GB لمدة 12 شهر)
```bash
AWS_REGION=eu-central-1
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
```

---

## استكشاف الأخطاء 🔧

### Error: Access Denied
```bash
# تأكد من:
# 1. الـ credentials صحيحة
# 2. المستخدم لديه صلاحية ObjectStore operator
# 3. الـ Container موجود
# 4. ACL مضبوط على public-read
```

### Error: Bucket Not Found
```bash
# تأكد من:
# 1. اسم الـ Container صحيح
# 2. الـ Region صحيح (gra, bhs, sbg)
# 3. الـ Endpoint مطابق للـ Region
```

### Error: Network Error
```bash
# تأكد من:
# 1. الاتصال بالإنترنت
# 2. Firewall لا يحجب s3.gra.io.cloud.ovh.net
# 3. الـ Endpoint صحيح
```

---

## الأمان 🔒

### ⚠️ لا تشارك أبداً:
- Access Key
- Secret Access Key
- لا ترفعهم على Git

### ✅ استخدم:
```bash
# .env (local)
OVH_ACCESS_KEY=your_key

# Production: استخدم Environment Variables
# Heroku, Vercel, Railway, etc.
```

### ✅ أضف للـ .gitignore:
```
.env
.env.local
.env.production
```

---

## الخلاصة ✅

بعد إتمام الخطوات:
1. ✅ لديك OVH Object Storage شغال
2. ✅ يمكنك رفع الصور والصوتيات
3. ✅ الملفات متاحة للعامة عبر URLs
4. ✅ التكلفة منخفضة جداً

**بالتوفيق! 🚀**
