# إعداد Cloudflare R2 لمشروع Quran Yutla

R2 متوافق مع S3، فالكود مش بيتغير — بس `STORAGE_*` في الـ `.env`.

**ليه R2 بدل OVH:** الـ **egress مجاني بالكامل**. التطبيق كله تشغيل صوت (تلاوات + قرآن)، والترافيك الخارج هو الفاتورة الحقيقية مع أي مزوّد تاني.

**الفري تير:** 10 GB تخزين + مليون عملية كتابة + 10 مليون عملية قراءة شهريًا + egress مجاني للأبد.
بعد كده ~$0.015/GB للتخزين، والتحميل يفضل مجاني.

> ⚠️ Cloudflare بتطلب **إضافة وسيلة دفع** قبل تفعيل R2، حتى وانت على الفري تير.

---

## الخطوة 1: تفعيل R2

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **R2 Object Storage**
2. **Purchase R2 / Enable** → أضف كارت (مش هيتخصم حاجة تحت حدود الفري)

---

## الخطوة 2: إنشاء الـ Bucket

**Create bucket:**
- **Name:** `quran-yutla`
- **Location hint:** `EEUR` (أوروبا الشرقية) أو `WEUR` — الأقرب لمستخدمين مصر والشرق الأوسط
- **Default storage class:** Standard

---

## الخطوة 3: الـ API Token (المفاتيح)

**R2 → API → Manage API Tokens → Create API Token**

- **Permissions:** `Object Read & Write`
- **Specify bucket:** `quran-yutla` (متديش صلاحية على كل الحساب)
- **TTL:** Forever

هتاخد:
- **Access Key ID**
- **Secret Access Key** ← بيظهر **مرة واحدة بس**، احفظه فورًا
- **Endpoint:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

الـ `ACCOUNT_ID` موجود كمان في يمين صفحة R2 الرئيسية.

---

## الخطوة 4: الدومين المخصّص (خطوة مش اختيارية)

R2 بيديك URL اسمه `*.r2.dev` — **متستخدموش في الإنتاج**، عليه rate limit ومفيش SLA وCloudflare نفسها بتقول إنه للتجربة بس.

الصح:

1. الدومين `quranyutla.com` يبقى مضاف على نفس حساب Cloudflare وشغّال على الـ nameservers بتاعتها
2. **R2 → quran-yutla → Settings → Public access → Custom Domains → Connect Domain**
3. اكتب: `cdn.quranyutla.com`
4. Cloudflare هتضيف الـ DNS record لوحدها وتطلع SSL خلال دقايق

بكده الملفات بتتقدّم من `https://cdn.quranyutla.com/recitations/xxx.webm` — ومن خلال الـ CDN، يعني كاشينج مجاني كمان.

---

## الخطوة 5: CORS

لو التطبيق ويب أو Flutter web بيقرا الملفات مباشرة:

**Settings → CORS Policy → Add CORS policy**

```json
[
  {
    "AllowedOrigins": ["https://app.quranyutla.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

تطبيقات الموبايل الـ native مش محتاجة CORS أصلاً.

---

## الخطوة 6: الـ `.env`

```bash
STORAGE_PROVIDER=r2
STORAGE_REGION=auto
STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY=<Access Key ID>
STORAGE_SECRET_KEY=<Secret Access Key>
STORAGE_BUCKET=quran-yutla
STORAGE_PUBLIC_URL=https://cdn.quranyutla.com

MAX_SIZE_FILE_UPLOAD=100
IMAGE_QUALITY=80
```

`STORAGE_PROVIDER=r2` بيعمل حاجة واحدة مهمة في الكود: بيوقف إرسال `ACL: public-read`.
R2 **مفيهوش ACL على مستوى الملف** — الإتاحة العامة بتيجي من الدومين المخصّص بتاع الـ bucket.

للرجوع لـ OVH: غيّر `STORAGE_PROVIDER=ovh` وقيم `STORAGE_*`، من غير أي تغيير في الكود.

---

## الخطوة 7: اختبار الاتصال

```typescript
// test-r2.ts  →  npx ts-node test-r2.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true,
});

(async () => {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: 'test/hello.txt',
      Body: Buffer.from('Quran Yutla R2 OK'),
      ContentType: 'text/plain',
      // مفيش ACL هنا — R2 مش بيدعمه
    }),
  );
  console.log(`✅ ${process.env.STORAGE_PUBLIC_URL}/test/hello.txt`);
})();
```

افتح اللينك في المتصفح. لو نزّل الملف يبقى الدومين المخصّص شغال صح.

---

## الخطوة 8: Lifecycle Rules

**Settings → Object lifecycle rules**

| القاعدة | الـ Prefix | المدة |
|---|---|---|
| مسح الملفات المؤقتة | `temp/` | 7 أيام |
| مسح التلاوات القديمة | `recitations/` | 90 يوم |
| إلغاء الرفعات الناقصة | (الكل) | 1 يوم |

القاعدة التالتة بتوفر فلوس صامتة — الـ multipart uploads اللي بتفشل في النص بتفضل محسوبة عليك لحد ما تتلغي.

---

## نقل الملفات الموجودة من OVH

```bash
# rclone config → أضف remote اسمه ovh وremote اسمه r2 (النوع: S3 Compatible)
rclone copy ovh:quran-yutla-container r2:quran-yutla --progress --transfers 16
rclone check ovh:quran-yutla-container r2:quran-yutla   # تأكيد المطابقة قبل ما تمسح حاجة
```

سيب بكت OVH شغّال أسبوع بعد التحويل قبل ما تلغيه.

---

## ملاحظات مهمة

**التلاوات بترفع private.** تسجيل صوت أي طفل مالوش لينك دائم — الباك إند بيوقّع رابط مؤقت (`STORAGE_SIGNED_URL_TTL`، افتراضي ساعة) في كل رد API، وخدمة الـ AI بتاخد رابط موقّع صلاحيته 6 ساعات عشان يستحمل انتظار الـ GPU.

يعني **متفعّلش الوصول العام على البكت كله**. الدومين المخصّص بيتظبط عشان الصور وصوت القرآن الجاهز بس؛ مجلد `recitations/` لازم يفضل مقفول ويتقري بالتوقيع بس.

**الكاشينج:** الرفع بيبعت `CacheControl: max-age=31536000` كـ response header حقيقي. قبل كده كان متبعوت كـ user metadata، يعني مكانش بيتقري من المتصفح ولا الـ CDN أصلاً.

**متحطش المفاتيح في Git.** على Railway حطها في Variables، ومحليًا في `.env` (متجاهَل في `.gitignore`).
