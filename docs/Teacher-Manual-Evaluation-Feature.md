# ميزة التقييم اليدوي للمعلم - Teacher Manual Evaluation Feature

**تاريخ الإضافة:** 17 ديسمبر 2025  
**الحالة:** ✅ مكتمل ومُنشر

---

## 📌 نظرة عامة

تتيح هذه الميزة للمعلمين الاستماع إلى تلاوات طلابهم وإضافة تقييم يدوي شامل مع درجة وملاحظات نصية. هذا التقييم اليدوي يُخزن بجانب التقييم الآلي من AI.

---

## 🎯 الهدف

توفير آلية للمعلم لـ:
1. **الاستماع** لتلاوات طلابه
2. **التقييم اليدوي** بدرجة من 0-100
3. **إضافة ملاحظات** نصية تفصيلية
4. **تعديل التقييم** إذا لزم الأمر

---

## 📊 تفاصيل قاعدة البيانات

### الحقول المُضافة إلى جدول `recitations`:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `teacher_evaluation_score` | DECIMAL(5,2) | درجة التقييم اليدوي (0-100) | NULL allowed, CHECK (0-100) |
| `teacher_notes` | TEXT | ملاحظات المعلم | NULL allowed |
| `evaluated_by_teacher_id` | INTEGER | معرّف المعلم الذي قام بالتقييم | FK to users.id |
| `teacher_evaluated_at` | TIMESTAMPTZ | تاريخ ووقت التقييم | NULL allowed |

### العلاقات (Foreign Keys):

```sql
ALTER TABLE recitations
ADD CONSTRAINT FK_recitations_evaluated_by_teacher
FOREIGN KEY (evaluated_by_teacher_id)
REFERENCES users(id)
ON DELETE SET NULL
ON UPDATE CASCADE;
```

### القيود (Constraints):

```sql
ALTER TABLE recitations
ADD CONSTRAINT CHK_teacher_evaluation_score_range
CHECK (teacher_evaluation_score IS NULL OR 
       (teacher_evaluation_score >= 0 AND teacher_evaluation_score <= 100));
```

---

## 🔌 API Endpoints

### 1️⃣ **GET** `/recitations/teacher/:recitationId`

**الوصف:** الحصول على تلاوة محددة للتقييم  
**الصلاحية:** TEACHER فقط  
**المدخلات:**
- `recitationId` (path parameter): معرّف التلاوة

**الاستجابة:**
```json
{
  "message": "Recitation retrieved successfully",
  "data": {
    "id": 1,
    "userId": 5,
    "surahId": 1,
    "fromAyah": 1,
    "toAyah": 7,
    "audioUrl": "https://storage.example.com/...",
    "duration": 180,
    "status": "completed",
    "aiEvaluationScore": 85.5,
    "teacherEvaluationScore": null,
    "teacherNotes": null,
    "user": { ... },
    "surah": { ... }
  }
}
```

**حالات الخطأ:**
- `404 NOT_FOUND`: تلاوة غير موجودة أو معلم غير موجود
- `403 FORBIDDEN`: المعلم ليس لديه صلاحية الوصول لهذا الطالب

---

### 2️⃣ **POST** `/recitations/teacher/:recitationId/evaluate`

**الوصف:** إضافة تقييم يدوي جديد  
**الصلاحية:** TEACHER فقط  
**المدخلات:**
- `recitationId` (path parameter)
- Request Body:
```json
{
  "score": 90.5,
  "notes": "أداء ممتاز مع بعض الأخطاء البسيطة في التجويد"
}
```

**الاستجابة:**
```json
{
  "message": "Teacher evaluation added successfully",
  "data": {
    "id": 1,
    "teacherEvaluationScore": 90.5,
    "teacherNotes": "أداء ممتاز مع بعض الأخطاء البسيطة في التجويد",
    "evaluatedByTeacherId": 3,
    "teacherEvaluatedAt": "2024-01-15T10:30:00Z",
    ...
  }
}
```

**حالات الخطأ:**
- `400 BAD_REQUEST`: تقييم موجود بالفعل
- `403 FORBIDDEN`: المعلم ليس لديه صلاحية
- `404 NOT_FOUND`: تلاوة غير موجودة

---

### 3️⃣ **PATCH** `/recitations/teacher/:recitationId/evaluate`

**الوصف:** تحديث تقييم يدوي موجود  
**الصلاحية:** TEACHER فقط (الذي أنشأ التقييم)  
**المدخلات:**
```json
{
  "score": 95.0,
  "notes": "تحديث: أداء رائع جداً"
}
```

**الاستجابة:**
```json
{
  "message": "Teacher evaluation updated successfully",
  "data": {
    "id": 1,
    "teacherEvaluationScore": 95.0,
    "teacherNotes": "تحديث: أداء رائع جداً",
    "teacherEvaluatedAt": "2024-01-15T11:00:00Z",
    ...
  }
}
```

**حالات الخطأ:**
- `400 BAD_REQUEST`: لا يوجد تقييم للتحديث
- `403 FORBIDDEN`: لا يمكن تحديث تقييم معلم آخر
- `404 NOT_FOUND`: تلاوة غير موجودة

---

## 🔒 الأمان والصلاحيات

### 1. التحقق من الدور
```typescript
@Auth(RolesEnum.TEACHER)
```
- فقط المعلمين يمكنهم استخدام هذه الـ Endpoints

### 2. التحقق من الوصول
```typescript
const hasAccess = teacher.students.some(
  (student) => student.id === recitation.user.id
);
```
- المعلم يجب أن يكون مرتبطاً بالطالب

### 3. حماية التعديل
```typescript
if (recitation.evaluatedByTeacherId !== teacherId) {
  throw new ForbiddenException(...);
}
```
- المعلم لا يمكنه تعديل تقييم معلم آخر

---

## ✅ التحقق من صحة البيانات (Validation)

### `TeacherEvaluationDto`:

```typescript
export class TeacherEvaluationDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @ApiProperty({
    description: 'Teacher evaluation score (0-100)',
    example: 85.5,
    minimum: 0,
    maximum: 100,
  })
  score: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: 'Teacher notes and feedback',
    example: 'Good performance with minor tajweed errors',
  })
  notes?: string;
}
```

---

## 🌐 الترجمة (i18n)

### English (`en/recitations.json`):
```json
{
  "TEACHER_NOT_FOUND": "Teacher not found",
  "TEACHER_NO_ACCESS_TO_STUDENT": "You do not have access to this student's recitations",
  "TEACHER_EVALUATION_ALREADY_EXISTS": "Teacher evaluation already exists for this recitation",
  "TEACHER_EVALUATION_NOT_FOUND": "No teacher evaluation found for this recitation",
  "TEACHER_CANNOT_UPDATE_OTHER_EVALUATION": "You cannot update another teacher's evaluation"
}
```

### Arabic (`ar/recitations.json`):
```json
{
  "TEACHER_NOT_FOUND": "المعلم غير موجود",
  "TEACHER_NO_ACCESS_TO_STUDENT": "ليس لديك صلاحية الوصول إلى تلاوات هذا الطالب",
  "TEACHER_EVALUATION_ALREADY_EXISTS": "يوجد تقييم معلم بالفعل لهذه التلاوة",
  "TEACHER_EVALUATION_NOT_FOUND": "لا يوجد تقييم معلم لهذه التلاوة",
  "TEACHER_CANNOT_UPDATE_OTHER_EVALUATION": "لا يمكنك تحديث تقييم معلم آخر"
}
```

---

## 📁 الملفات المُعدّلة/المُضافة

### ملفات الـ Database:
1. `migrations/1734470000000-AddTeacherEvaluationFields.ts` ✅ (جديد)
2. `src/modules/recitations/entities/recitation.entity.ts` ✅ (مُعدّل)

### ملفات الـ DTOs:
3. `src/modules/recitations/dto/teacher-evaluation.dto.ts` ✅ (جديد)

### ملفات الـ Service:
4. `src/modules/recitations/recitations.service.ts` ✅ (مُعدّل)
   - `getRecitationForTeacher()`
   - `addTeacherEvaluation()`
   - `updateTeacherEvaluation()`

### ملفات الـ Controller:
5. `src/modules/recitations/recitations.controller.ts` ✅ (مُعدّل)
   - `GET /teacher/:recitationId`
   - `POST /teacher/:recitationId/evaluate`
   - `PATCH /teacher/:recitationId/evaluate`

### ملفات الترجمة:
6. `src/i18n/en/recitations.json` ✅ (مُعدّل)
7. `src/i18n/ar/recitations.json` ✅ (مُعدّل)

### ملفات التوثيق:
8. `API-ENDPOINTS.md` ✅ (مُعدّل)
9. `IMPLEMENTATION-CHECKLIST.md` ✅ (مُعدّل)
10. `docs/Teacher-Manual-Evaluation-Feature.md` ✅ (هذا الملف - جديد)

---

## 🧪 أمثلة استخدام

### مثال 1: الحصول على تلاوة للتقييم

```bash
GET /api/v1/recitations/teacher/123
Authorization: Bearer {teacher_jwt_token}
```

**الاستجابة:**
```json
{
  "message": "Recitation retrieved successfully",
  "data": {
    "id": 123,
    "audioUrl": "https://...",
    "aiEvaluationScore": 85.5,
    "teacherEvaluationScore": null,
    "user": {
      "id": 5,
      "fullName": "أحمد محمد"
    }
  }
}
```

---

### مثال 2: إضافة تقييم

```bash
POST /api/v1/recitations/teacher/123/evaluate
Authorization: Bearer {teacher_jwt_token}
Content-Type: application/json

{
  "score": 92.5,
  "notes": "ماشاء الله، أداء رائع! هناك خطأ بسيط في المد في الآية الثالثة"
}
```

**الاستجابة:**
```json
{
  "message": "Teacher evaluation added successfully",
  "data": {
    "id": 123,
    "teacherEvaluationScore": 92.5,
    "teacherNotes": "ماشاء الله، أداء رائع! هناك خطأ بسيط في المد في الآية الثالثة",
    "evaluatedByTeacherId": 3,
    "teacherEvaluatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### مثال 3: تحديث التقييم

```bash
PATCH /api/v1/recitations/teacher/123/evaluate
Authorization: Bearer {teacher_jwt_token}
Content-Type: application/json

{
  "score": 95.0,
  "notes": "بعد المراجعة: أداء ممتاز جداً!"
}
```

---

## 🚀 حالات الاستخدام (Use Cases)

### UC-1: المعلم يريد تقييم تلاوة طالب
1. المعلم يسجل دخول
2. يذهب لصفحة تلاوات طلابه
3. يختار تلاوة محددة
4. يستمع للتسجيل
5. يضع درجة من 0-100
6. يكتب ملاحظات (اختياري)
7. يحفظ التقييم

### UC-2: المعلم يريد تعديل تقييم سابق
1. المعلم يفتح التلاوة المُقيّمة
2. يعدل الدرجة أو الملاحظات
3. يحفظ التعديل
4. النظام يحدث `teacherEvaluatedAt` تلقائياً

### UC-3: طالب لديه معلمان
- كل معلم يرى فقط تقييمه الخاص
- لا يمكن لمعلم تعديل تقييم معلم آخر

---

## 📝 ملاحظات إضافية

### 1. الفرق بين AI Evaluation و Teacher Evaluation:
- **AI Evaluation**: تلقائي، يُخزن في `aiEvaluationScore` و `evaluationData`
- **Teacher Evaluation**: يدوي، يُخزن في `teacherEvaluationScore` و `teacherNotes`
- **كلاهما** موجود في نفس سجل التلاوة ومستقلان عن بعضهما

### 2. سياسة الحذف:
- عند حذف المعلم: `ON DELETE SET NULL` - التقييم يبقى لكن `evaluatedByTeacherId` يصبح null
- عند حذف التلاوة: التقييم يُحذف تلقائياً (جزء من نفس السجل)

### 3. الأداء:
- استخدام Indexes على `evaluated_by_teacher_id` لتسريع الاستعلامات
- Relations محسّنة مع `eager: false` لتجنب تحميل بيانات غير ضرورية

---

## ✅ الاختبار

### اختبارات يُنصح بها:

1. **Positive Cases:**
   - ✅ معلم يضيف تقييم لطالبه
   - ✅ معلم يعدل تقييمه الخاص
   - ✅ معلم يشاهد تلاوة طالبه

2. **Negative Cases:**
   - ✅ معلم يحاول تقييم طالب ليس له
   - ✅ معلم يحاول إضافة تقييم مرتين
   - ✅ معلم يحاول تعديل تقييم معلم آخر
   - ✅ درجة خارج نطاق 0-100

3. **Edge Cases:**
   - ✅ ملاحظات فارغة (notes = null)
   - ✅ تلاوة محذوفة
   - ✅ معلم محذوف (FK SET NULL)

---

## 📞 الدعم

لأي استفسارات أو مشاكل تتعلق بهذه الميزة:
- مراجعة Swagger Documentation: `/api/docs`
- التحقق من Logs في `logs/errors.json`
- مراجعة هذا الملف: `docs/Teacher-Manual-Evaluation-Feature.md`

---

**آخر تحديث:** 17 ديسمبر 2025  
**الحالة:** ✅ مُنتج ومُختبر  
**الإصدار:** v1.0.0
