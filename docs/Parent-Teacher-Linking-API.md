# Parent and Teacher Linking APIs Documentation

## Overview
This documentation covers the new APIs for linking students with parents and teachers.

---

## Parent-Child Linking

### 1. Register Parent with Number of Children
**Endpoint:** `POST /api/v1/auth/sign-up/parent`

**Description:** Parent registers and specifies the number of children along with their student codes.

**Body:**
```json
{
  "email": "parent@example.com",
  "fullName": "Ahmed Mohamed",
  "phoneNumber": "+201234567890",
  "numberOfChildren": 2,
  "studentCodes": ["ABC123", "DEF456"],
  "password": "Password@123",
  "playerId": "optional-onesignal-id"
}
```

**Notes:**
- The number of elements in `studentCodes` must match `numberOfChildren`
- All student codes must be valid and exist in the system
- All users associated with the codes must be of type STUDENT

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "parent@example.com",
    "fullName": "Ahmed Mohamed",
    "phoneNumber": "+201234567890",
    "numberOfChildren": 2,
    "roles": ["PARENT"]
  }
}
```

**Possible Errors:**
- `400 Bad Request`: Number of student codes does not match number of children
- `404 Not Found`: One or more student codes are invalid or not found

---

### 2. Link Single Child to Parent
**Endpoint:** `POST /api/v1/user/link-parent`

**Description:** Parent links a single child using the student's unique code.

**Authentication:** Required (Bearer Token - PARENT role)

**Body:**
```json
{
  "studentCode": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Child linked successfully",
  "data": {
    "id": 5,
    "fullName": "Student Name",
    "studentCode": "ABC123",
    "parentId": 1
  }
}
```

**Errors:**
- `404` - Student code not found
- `404` - Student already has a parent
- `404` - User is not a student

---

### 3. Link Multiple Children to Parent
**Endpoint:** `POST /api/v1/user/link-multiple-children`

**Description:** Parent links multiple children at once using their student codes. Useful when parent has registered with numberOfChildren > 1.

**Authentication:** Required (Bearer Token - PARENT role)

**Body:**
```json
{
  "studentCodes": ["ABC123", "XYZ789", "DEF456"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Children linking process completed",
  "data": {
    "linked": [
      {
        "id": 5,
        "fullName": "Student 1",
        "studentCode": "ABC123",
        "parentId": 1
      },
      {
        "id": 6,
        "fullName": "Student 2",
        "studentCode": "XYZ789",
        "parentId": 1
      }
    ],
    "failed": [
      {
        "code": "DEF456",
        "reason": "Student code not found"
      }
    ]
  }
}
```

---

### 4. Get Parent's Children
**Endpoint:** `GET /api/v1/user/children`

**Description:** Get all children linked to the authenticated parent.

**Authentication:** Required (Bearer Token - PARENT role)

**Response:**
```json
{
  "success": true,
  "message": "Children retrieved successfully",
  "data": [
    {
      "id": 5,
      "email": "student1@example.com",
      "fullName": "Student 1",
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
      "fullName": "Student 2",
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

## Teacher-Student Linking

### 5. Link Student to Teacher
**Endpoint:** `POST /api/v1/user/link-teacher`

**Description:** Teacher links a student to their account using the student's ID.

**Authentication:** Required (Bearer Token - TEACHER role)

**Body:**
```json
{
  "studentId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student linked successfully",
  "data": {
    "id": 123,
    "fullName": "Student Name",
    "email": "student@example.com",
    "studentCode": "ABC123"
  }
}
```

**Errors:**
- `404` - Teacher not found
- `404` - User is not a teacher
- `404` - Student not found
- `404` - User is not a student
- `404` - Student already linked to this teacher

---

### 6. Get Teacher's Students
**Endpoint:** `GET /api/v1/user/students`

**Description:** Get all students linked to the authenticated teacher.

**Authentication:** Required (Bearer Token - TEACHER role)

**Response:**
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    {
      "id": 5,
      "email": "student1@example.com",
      "fullName": "Student 1",
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
      "fullName": "Student 2",
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

## Database Schema

### Users Table Updates
```sql
ALTER TABLE users ADD COLUMN number_of_children INTEGER NULL;
```

### Relations
1. **Parent-Child (One-to-Many)**:
   - Parent can have multiple children
   - Child can have only one parent
   - Field: `parent_id` in users table

2. **Teacher-Student (Many-to-Many)**:
   - Teacher can have multiple students
   - Student can have multiple teachers
   - Junction table: `teacher_students`

---

## Flow Diagrams

### Parent Registration and Linking Flow
```
1. Parent registers → POST /auth/sign-up/parent
   - Provides numberOfChildren: 2

2. Parent receives their account

3. Parent links first child → POST /user/link-parent
   - Provides studentCode: "ABC123"

4. Parent links second child → POST /user/link-parent
   - Provides studentCode: "XYZ789"

OR

3-4. Parent links all children at once → POST /user/link-multiple-children
   - Provides studentCodes: ["ABC123", "XYZ789"]

5. Parent views all children → GET /user/children
```

### Teacher Linking Flow
```
1. Teacher registers → POST /auth/sign-up/teacher

2. Teacher gets student ID (from admin or student)

3. Teacher links student → POST /user/link-teacher
   - Provides studentId: 123

4. Teacher views all students → GET /user/students
```

---

## Validation Rules

### Link Parent
- `studentCode`: Required, must be exactly 6 characters
- Student must exist in database
- Student must not already have a parent
- Student must have STUDENT role

### Link Multiple Children
- `studentCodes`: Required, must be an array
- Array must have at least 1 element
- Each code must be exactly 6 characters
- Returns both successful and failed linkings

### Link Teacher
- `studentId`: Required, must be a positive number
- Teacher must have TEACHER role
- Student must have STUDENT role
- Student must not already be linked to this teacher

---

## Error Messages

### English (`en/user.json`)
```json
{
  "STUDENT_CODE_NOT_FOUND": "Student code not found",
  "STUDENT_ALREADY_HAS_PARENT": "Student already has a parent",
  "USER_IS_NOT_STUDENT": "User is not a student",
  "TEACHER_NOT_FOUND": "Teacher not found",
  "USER_IS_NOT_TEACHER": "User is not a teacher",
  "STUDENT_NOT_FOUND": "Student not found",
  "STUDENT_ALREADY_LINKED_TO_TEACHER": "Student is already linked to this teacher"
}
```

### Arabic (`ar/user.json`)
```json
{
  "STUDENT_CODE_NOT_FOUND": "كود الطالب غير موجود",
  "STUDENT_ALREADY_HAS_PARENT": "الطالب مرتبط بولي أمر بالفعل",
  "USER_IS_NOT_STUDENT": "المستخدم ليس طالباً",
  "TEACHER_NOT_FOUND": "المعلم غير موجود",
  "USER_IS_NOT_TEACHER": "المستخدم ليس معلماً",
  "STUDENT_NOT_FOUND": "الطالب غير موجود",
  "STUDENT_ALREADY_LINKED_TO_TEACHER": "الطالب مرتبط بهذا المعلم بالفعل"
}
```

---

## Testing Examples

### Test Parent Registration and Linking

1. **Register Student:**
```bash
POST /api/v1/auth/sign-up/student
{
  "email": "student@test.com",
  "fullName": "Test Student",
  "phoneNumber": "+201111111111",
  "country": "Egypt",
  "ageGroup": "AGE_8_10",
  "gender": "MALE",
  "password": "Password@123"
}
# Note the studentCode from response (e.g., "ABC123")
```

2. **Register Parent:**
```bash
POST /api/v1/auth/sign-up/parent
{
  "email": "parent@test.com",
  "fullName": "Test Parent",
  "phoneNumber": "+201234567890",
  "numberOfChildren": 1,
  "password": "Password@123"
}
# Login and get bearer token
```

3. **Link Child:**
```bash
POST /api/v1/user/link-parent
Authorization: Bearer {parent_token}
{
  "studentCode": "ABC123"
}
```

4. **Get Children:**
```bash
GET /api/v1/user/children
Authorization: Bearer {parent_token}
```

---

## Notes

1. **Student Code Generation:** Student codes are automatically generated during student registration (6 characters, alphanumeric, unique).

2. **Parent-Child Limitation:** Each student can only be linked to ONE parent. Attempting to link a student who already has a parent will result in an error.

3. **Teacher-Student Flexibility:** Students can be linked to multiple teachers, and teachers can have multiple students (many-to-many relationship).

4. **numberOfChildren Field:** This field is informational and helps track how many children a parent should link. It doesn't enforce any hard limits.

5. **Batch Linking:** The `link-multiple-children` endpoint is designed to handle partial failures gracefully, returning which children were successfully linked and which failed with reasons.

---

## Swagger Documentation

All endpoints are documented in Swagger UI at: `http://localhost:3000/api/docs`

Look for the "Users" section to find these endpoints with interactive testing capabilities.
