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

## الخطوة 2: إنشاء **بكتين**، مش واحد

⚠️ **مهم:** R2 مفيهوش ACL على مستوى الملف. لما توصل دومين مخصّص بـ bucket، Cloudflare بتقول بالنص إن **محتوى الـ bucket كله** بيبقى متاح للعامة من خلال الدومين ده — مفيش تفرقة بين ملف وملف. لو التلاوات (الخاصة) والصور (العامة) في نفس الـ bucket ووصّلت الدومين، **التلاوات بتبقى متاحة للجميع من غير أي توقيع** — بالظبط المشكلة اللي كنا بنحلها.

الحل: بكتين منفصلين.

**Create bucket** (أول واحد — خاص):
- **Name:** `quran-yutla`
- **Location hint:** `EEUR` (أوروبا الشرقية)
- **Default storage class:** Standard
- **من غير custom domain خالص** — الوصول بالتوقيع (presigned URL) بس

**Create bucket** (تاني واحد — عام):
- **Name:** `quran-yutla-public`
- **Location hint:** `EEUR`
- **Default storage class:** Standard
- **ده اللي هياخد الدومين المخصّص**

---

## الخطوة 3: الـ API Token (المفاتيح)

**R2 → API → Manage API Tokens → Create Account API Token** (مش User token — ده بيفضل شغال حتى لو سبت الـ organization)

- **Permissions:** `Object Read & Write`
- **Specify bucket(s):** اختار الاتنين — `quran-yutla` و `quran-yutla-public`
- **TTL:** Forever

هتاخد:
- **Access Key ID**
- **Secret Access Key** ← بيظهر **مرة واحدة بس**، احفظه فورًا
- **Endpoint:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

نفس المفاتيح دي بتشتغل على الاتنين — التفرقة بتتم بالـ bucket name في كل طلب.

---

## الخطوة 4: الدومين المخصّص — على البكت العام بس

R2 بيديك URL اسمه `*.r2.dev` — **متستخدموش في الإنتاج**، عليه rate limit ومفيش SLA.

1. الدومين `quranyutla.com` يبقى مضاف على نفس حساب Cloudflare وشغّال على الـ nameservers بتاعتها
2. **R2 → quran-yutla-public → Settings → Custom Domains → Connect Domain**
3. اكتب: `cdn.quranyutla.com`
4. Cloudflare هتضيف الـ DNS record لوحدها وتطلع SSL خلال دقايق

بكده الصور وصوت القرآن بيتقدّموا من `https://cdn.quranyutla.com/...`. **البكت الخاص (`quran-yutla`) يفضل من غير دومين نهائيًا.**

---

## الخطوة 5: CORS

لو التطبيق ويب أو Flutter web بيقرا الملفات مباشرة (على `quran-yutla-public` — البكت الوحيد اللي بيتقرا من المتصفح مباشرة):

**quran-yutla-public → Settings → CORS Policy → Add CORS policy**

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

# خاص: التلاوات، presigned-only، من غير دومين
STORAGE_BUCKET=quran-yutla
# عام: الصور وصوت القرآن، عليه الدومين المخصّص
STORAGE_PUBLIC_BUCKET=quran-yutla-public
STORAGE_PUBLIC_URL=https://cdn.quranyutla.com

MAX_SIZE_FILE_UPLOAD=100
IMAGE_QUALITY=80
```

`STORAGE_PROVIDER=r2` بيعمل حاجتين في الكود:
1. بيوقف إرسال `ACL: public-read` (R2 مفيهوش ACL على مستوى الملف)
2. الرفعات `public` بتروح `STORAGE_PUBLIC_BUCKET`، والرفعات `private` (التلاوات) بتروح `STORAGE_BUCKET`

للرجوع لـ OVH: غيّر `STORAGE_PROVIDER=ovh` وقيم `STORAGE_*`، من غير أي تغيير في الكود. OVH بيدعم ACL على مستوى الملف، فبكت واحد كفاية هناك — `STORAGE_PUBLIC_BUCKET` لو مش متظبط بيرجع لنفس `STORAGE_BUCKET`.

---

## الخطوة 7: اختبار الاتصال

اختبارين منفصلين — واحد للبكت العام (لينك مباشر) وواحد للخاص (presigned URL).

```typescript
// test-r2.ts  →  npx ts-node test-r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
  // 1) البكت العام — لينك مباشر عبر الدومين المخصّص
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_PUBLIC_BUCKET,
      Key: 'test/hello.txt',
      Body: Buffer.from('Quran Yutla R2 public OK'),
      ContentType: 'text/plain',
      // مفيش ACL هنا — R2 مش بيدعمه؛ الإتاحة من الدومين نفسه
    }),
  );
  console.log(`public  ✅ ${process.env.STORAGE_PUBLIC_URL}/test/hello.txt`);

  // 2) البكت الخاص — لازم presigned URL، مفيش دومين عليه أصلاً
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: 'test/private.txt',
      Body: Buffer.from('Quran Yutla R2 private OK'),
      ContentType: 'text/plain',
    }),
  );
  const signed = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: 'test/private.txt' }),
    { expiresIn: 300 },
  );
  console.log(`private ✅ ${signed}`);
})();
```

افتح اللينك الأول في المتصفح — لو نزّل الملف يبقى الدومين المخصّص شغال صح.
افتح اللينك التاني (الموقّع) فورًا — لازم يشتغل. بعد 5 دقايق (`expiresIn: 300`) لازم يرجّع `AccessDenied`. جرّب `${STORAGE_ENDPOINT}/${STORAGE_BUCKET}/test/private.txt` من غير توقيع — المفروض يرفض، ده اللي بيثبت إن البكت فعلاً خاص.

---

## الخطوة 8: Lifecycle Rules

على **`quran-yutla`** (الخاص) → Settings → Object lifecycle rules:

| القاعدة | الـ Prefix | المدة |
|---|---|---|
| مسح التلاوات القديمة | `recitations/` | 90 يوم |
| إلغاء الرفعات الناقصة | (الكل) | 1 يوم |

على **`quran-yutla-public`** (العام):

| القاعدة | الـ Prefix | المدة |
|---|---|---|
| مسح الملفات المؤقتة | `temp/` | 7 أيام |
| إلغاء الرفعات الناقصة | (الكل) | 1 يوم |

قاعدة "إلغاء الرفعات الناقصة" بتوفر فلوس صامتة — الـ multipart uploads اللي بتفشل في النص بتفضل محسوبة عليك لحد ما تتلغي، فحطّها على البكتين.

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

**التلاوات بترفع private في بكت منفصل تمامًا (`quran-yutla`).** تسجيل صوت أي طفل مالوش لينك دائم — الباك إند بيوقّع رابط مؤقت (`STORAGE_SIGNED_URL_TTL`، افتراضي ساعة) في كل رد API، وخدمة الـ AI بتاخد رابط موقّع صلاحيته 6 ساعات عشان يستحمل انتظار الـ GPU.

**متوصّلش دومين مخصّص بـ `quran-yutla` أبدًا.** ده مش تفصيلة — R2 بتفضح محتوى أي بكت متوصّل بدومين، مفيش استثناء لملف عن ملف. الدومين `cdn.quranyutla.com` على `quran-yutla-public` بس.

**الكاشينج:** الرفع بيبعت `CacheControl: max-age=31536000` كـ response header حقيقي. قبل كده كان متبعوت كـ user metadata، يعني مكانش بيتقري من المتصفح ولا الـ CDN أصلاً.

**متحطش المفاتيح في Git.** على Railway حطها في Variables، ومحليًا في `.env` (متجاهَل في `.gitignore`).
