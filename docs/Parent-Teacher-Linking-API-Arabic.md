# توثيق APIs ربط الطلاب بولي الأمر والمعلم

## نظرة عامة
هذا التوثيق يغطي الـ APIs الجديدة لربط الطلاب بأولياء الأمور والمعلمين.

---

## ربط ولي الأمر بالأبناء

### 1. تسجيل ولي أمر مع تحديد عدد الأبناء
**Endpoint:** `POST /api/v1/auth/sign-up/parent`

**الوصف:** ولي الأمر يسجل حساب جديد ويحدد عدد أبنائه مع إدخال أكواد الطلاب الخاصة بهم.

**البيانات المطلوبة:**
```json
{
  "email": "parent@example.com",
  "fullName": "أحمد محمد",
  "phoneNumber": "+201234567890",
  "numberOfChildren": 2,
  "studentCodes": ["ABC123", "DEF456"],
  "password": "Password@123",
  "playerId": "optional-onesignal-id"
}
```

**ملاحظات:**
- يجب أن يكون عدد عناصر `studentCodes` مطابقاً لـ `numberOfChildren`
- يجب أن تكون جميع أكواد الطلاب صحيحة وموجودة في النظام
- يجب أن يكون جميع المستخدمين المرتبطين بالأكواد من نوع STUDENT

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم إنشاء المستخدم بنجاح",
  "data": {
    "id": 1,
    "email": "parent@example.com",
    "fullName": "أحمد محمد",
    "phoneNumber": "+201234567890",
    "numberOfChildren": 2,
    "roles": ["PARENT"]
  }
}
```

**أخطاء محتملة:**
- `400 Bad Request`: عدد أكواد الطلاب لا يطابق عدد الأبناء
- `404 Not Found`: أحد أكواد الطلاب غير صحيح أو غير موجود

---

### 2. ربط ابن واحد بولي الأمر
**Endpoint:** `POST /api/v1/user/link-parent`

**الوصف:** ولي الأمر يربط ابن واحد باستخدام كود الطالب الخاص به.

**المصادقة:** مطلوبة (Bearer Token - دور PARENT)

**البيانات المطلوبة:**
```json
{
  "studentCode": "ABC123"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم ربط الابن بنجاح",
  "data": {
    "id": 5,
    "fullName": "اسم الطالب",
    "studentCode": "ABC123",
    "parentId": 1
  }
}
```

**الأخطاء:**
- `404` - كود الطالب غير موجود
- `404` - الطالب مرتبط بولي أمر بالفعل
- `404` - المستخدم ليس طالباً

---

### 3. ربط عدة أبناء بولي الأمر دفعة واحدة
**Endpoint:** `POST /api/v1/user/link-multiple-children`

**الوصف:** ولي الأمر يربط عدة أبناء مرة واحدة باستخدام أكوادهم. مفيد عندما يسجل ولي الأمر بعدد أبناء > 1.

**المصادقة:** مطلوبة (Bearer Token - دور PARENT)

**البيانات المطلوبة:**
```json
{
  "studentCodes": ["ABC123", "XYZ789", "DEF456"]
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تمت عملية ربط الأبناء",
  "data": {
    "linked": [
      {
        "id": 5,
        "fullName": "الطالب الأول",
        "studentCode": "ABC123",
        "parentId": 1
      },
      {
        "id": 6,
        "fullName": "الطالب الثاني",
        "studentCode": "XYZ789",
        "parentId": 1
      }
    ],
    "failed": [
      {
        "code": "DEF456",
        "reason": "كود الطالب غير موجود"
      }
    ]
  }
}
```

---

### 4. عرض أبناء ولي الأمر
**Endpoint:** `GET /api/v1/user/children`

**الوصف:** عرض جميع الأبناء المرتبطين بولي الأمر المسجل دخوله.

**المصادقة:** مطلوبة (Bearer Token - دور PARENT)

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم استرجاع الأبناء بنجاح",
  "data": [
    {
      "id": 5,
      "email": "student1@example.com",
      "fullName": "الطالب الأول",
      "phoneNumber": "+201111111111",
      "gender": "MALE",
      "country": "Egypt",
      "ageGroup": "AGE_5_7",
      "profileImageUrl": "https://cdn.example.com/profile.jpg",
      "studentCode": "ABC123",
      "registrationDate": "2025-12-09T00:00:00.000Z"
    },
    {
      "id": 6,
      "email": "student2@example.com",
      "fullName": "الطالب الثاني",
      "phoneNumber": "+201222222222",
      "gender": "FEMALE",
      "country": "Egypt",
      "ageGroup": "AGE_8_10",
      "profileImageUrl": "https://cdn.example.com/profile2.jpg",
      "studentCode": "XYZ789",
      "registrationDate": "2025-12-08T00:00:00.000Z"
    }
  ]
}
```

---

## ربط المعلم بالطلاب

### 5. ربط طالب بالمعلم
**Endpoint:** `POST /api/v1/user/link-teacher`

**الوصف:** المعلم يربط طالب بحسابه باستخدام ID الخاص بالطالب.

**المصادقة:** مطلوبة (Bearer Token - دور TEACHER)

**البيانات المطلوبة:**
```json
{
  "studentId": 123
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم ربط الطالب بنجاح",
  "data": {
    "id": 123,
    "fullName": "اسم الطالب",
    "email": "student@example.com",
    "studentCode": "ABC123"
  }
}
```

**الأخطاء:**
- `404` - المعلم غير موجود
- `404` - المستخدم ليس معلماً
- `404` - الطالب غير موجود
- `404` - المستخدم ليس طالباً
- `404` - الطالب مرتبط بهذا المعلم بالفعل

---

### 6. عرض طلاب المعلم
**Endpoint:** `GET /api/v1/user/students`

**الوصف:** عرض جميع الطلاب المرتبطين بالمعلم المسجل دخوله.

**المصادقة:** مطلوبة (Bearer Token - دور TEACHER)

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم استرجاع الطلاب بنجاح",
  "data": [
    {
      "id": 5,
      "email": "student1@example.com",
      "fullName": "الطالب الأول",
      "phoneNumber": "+201111111111",
      "gender": "MALE",
      "country": "Egypt",
      "ageGroup": "AGE_5_7",
      "profileImageUrl": "https://cdn.example.com/profile.jpg",
      "studentCode": "ABC123",
      "registrationDate": "2025-12-09T00:00:00.000Z"
    },
    {
      "id": 6,
      "email": "student2@example.com",
      "fullName": "الطالب الثاني",
      "phoneNumber": "+201222222222",
      "gender": "FEMALE",
      "country": "Saudi Arabia",
      "ageGroup": "AGE_11_14",
      "profileImageUrl": "https://cdn.example.com/profile2.jpg",
      "studentCode": "XYZ789",
      "registrationDate": "2025-12-08T00:00:00.000Z"
    }
  ]
}
```

---

## قاعدة البيانات

### تحديثات جدول المستخدمين
```sql
ALTER TABLE users ADD COLUMN number_of_children INTEGER NULL;
```

### العلاقات
1. **ولي الأمر - الأبناء (One-to-Many)**:
   - ولي الأمر يمكن أن يكون له عدة أبناء
   - الابن يمكن أن يكون له ولي أمر واحد فقط
   - الحقل: `parent_id` في جدول users

2. **المعلم - الطلاب (Many-to-Many)**:
   - المعلم يمكن أن يكون له عدة طلاب
   - الطالب يمكن أن يكون له عدة معلمين
   - جدول الربط: `teacher_students`

---

## مخطط التدفق

### تدفق تسجيل ولي الأمر والربط
```
1. ولي الأمر يسجل → POST /auth/sign-up/parent
   - يحدد عدد الأبناء: 2

2. ولي الأمر يحصل على حسابه

3. ولي الأمر يربط الابن الأول → POST /user/link-parent
   - يدخل كود الطالب: "ABC123"

4. ولي الأمر يربط الابن الثاني → POST /user/link-parent
   - يدخل كود الطالب: "XYZ789"

أو

3-4. ولي الأمر يربط جميع الأبناء مرة واحدة → POST /user/link-multiple-children
   - يدخل أكواد الطلاب: ["ABC123", "XYZ789"]

5. ولي الأمر يعرض جميع أبنائه → GET /user/children
```

### تدفق ربط المعلم
```
1. المعلم يسجل → POST /auth/sign-up/teacher

2. المعلم يحصل على ID الطالب (من الإدارة أو الطالب)

3. المعلم يربط الطالب → POST /user/link-teacher
   - يدخل معرف الطالب: 123

4. المعلم يعرض جميع طلابه → GET /user/students
```

---

## قواعد التحقق

### ربط ولي الأمر
- `studentCode`: مطلوب، يجب أن يكون 6 أحرف بالضبط
- الطالب يجب أن يكون موجود في قاعدة البيانات
- الطالب يجب ألا يكون مرتبط بولي أمر بالفعل
- الطالب يجب أن يكون له دور STUDENT

### ربط عدة أبناء
- `studentCodes`: مطلوب، يجب أن يكون مصفوفة
- المصفوفة يجب أن تحتوي على عنصر واحد على الأقل
- كل كود يجب أن يكون 6 أحرف بالضبط
- يرجع كل من الربط الناجح والفاشل

### ربط المعلم
- `studentId`: مطلوب، يجب أن يكون رقم موجب
- المعلم يجب أن يكون له دور TEACHER
- الطالب يجب أن يكون له دور STUDENT
- الطالب يجب ألا يكون مرتبط بهذا المعلم بالفعل

---

## رسائل الخطأ

تم إضافة رسائل الخطأ باللغة الإنجليزية والعربية في:
- `src/i18n/en/user.json`
- `src/i18n/ar/user.json`

---

## أمثلة الاختبار

### اختبار تسجيل ولي الأمر والربط

1. **تسجيل طالب:**
```bash
POST /api/v1/auth/sign-up/student
{
  "email": "student@test.com",
  "fullName": "طالب تجريبي",
  "phoneNumber": "+201111111111",
  "country": "Egypt",
  "ageGroup": "AGE_8_10",
  "gender": "MALE",
  "password": "Password@123"
}
# لاحظ كود الطالب من الاستجابة (مثل "ABC123")
```

2. **تسجيل ولي أمر:**
```bash
POST /api/v1/auth/sign-up/parent
{
  "email": "parent@test.com",
  "fullName": "ولي أمر تجريبي",
  "phoneNumber": "+201234567890",
  "numberOfChildren": 1,
  "password": "Password@123"
}
# تسجيل الدخول والحصول على bearer token
```

3. **ربط الابن:**
```bash
POST /api/v1/user/link-parent
Authorization: Bearer {parent_token}
{
  "studentCode": "ABC123"
}
```

4. **عرض الأبناء:**
```bash
GET /api/v1/user/children
Authorization: Bearer {parent_token}
```

---

## ملاحظات مهمة

1. **توليد كود الطالب:** يتم توليد كود الطالب تلقائياً عند تسجيل الطالب (6 أحرف، أرقام وحروف، فريد).

2. **قيد ولي الأمر - الابن:** كل طالب يمكن ربطه بولي أمر واحد فقط. محاولة ربط طالب مرتبط بولي أمر بالفعل ستؤدي إلى خطأ.

3. **مرونة المعلم - الطالب:** الطلاب يمكن ربطهم بعدة معلمين، والمعلمين يمكن أن يكون لهم عدة طلاب (علاقة many-to-many).

4. **حقل numberOfChildren:** هذا الحقل معلوماتي ويساعد في تتبع عدد الأبناء الذي يجب على ولي الأمر ربطهم. لا يفرض أي قيود صارمة.

5. **الربط الجماعي:** endpoint الـ `link-multiple-children` مصمم للتعامل مع الفشل الجزئي بشكل جيد، حيث يرجع الأبناء الذين تم ربطهم بنجاح والذين فشلوا مع الأسباب.

---

## توثيق Swagger

جميع الـ endpoints موثقة في Swagger UI على: `http://localhost:3000/api/docs`

ابحث عن قسم "Users" للعثور على هذه الـ endpoints مع إمكانية الاختبار التفاعلي.

---

## الملفات المضافة/المعدلة

### DTOs الجديدة:
- `src/modules/user/dto/requests/link-parent.dto.ts`
- `src/modules/user/dto/requests/link-multiple-children.dto.ts`
- `src/modules/user/dto/requests/link-teacher.dto.ts`

### التعديلات:
- `src/modules/user/entities/user.entity.ts` - إضافة حقل numberOfChildren
- `src/modules/auth/dto/requests/parent-sign-up.dto.ts` - إضافة numberOfChildren
- `src/modules/auth/auth.service.ts` - تحديث parentSignup
- `src/modules/user/user.service.ts` - إضافة methods الربط
- `src/modules/user/user.controller.ts` - إضافة endpoints جديدة
- `src/i18n/en/user.json` - إضافة رسائل الخطأ بالإنجليزية
- `src/i18n/ar/user.json` - إضافة رسائل الخطأ بالعربية

---

## حالة المشروع الآن

✅ **مكتمل 100%:**
- ربط ولي الأمر بالأبناء (منفرد وجماعي)
- ربط المعلم بالطلاب
- عرض الأبناء لولي الأمر
- عرض الطلاب للمعلم
- Validation كامل
- رسائل الخطأ بالعربية والإنجليزية
- توثيق كامل
- Swagger Documentation

---

تم إنجاز جميع المتطلبات بنجاح! 🎉
