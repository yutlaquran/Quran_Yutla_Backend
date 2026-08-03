# Quran Yutla - Developer Documentation

**Project:** Quran Learning & Recitation Platform  
**Backend Framework:** NestJS 10+ with TypeScript  
**Database:** PostgreSQL 16  
**Last Updated:** December 17, 2025  
**Status:** Production-Ready (Deployment Pending)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [File Upload & Storage](#file-upload--storage)
8. [AI Integration](#ai-integration)
9. [Payment Integration](#payment-integration)
10. [Setup & Installation](#setup--installation)
11. [Deployment Guide](#deployment-guide)
12. [Environment Variables](#environment-variables)

---

## 1. Project Overview

Quran Yutla is a comprehensive Quran learning platform that allows students to:
- Record and upload Quran recitations
- Get automated AI-based evaluation
- Receive manual teacher evaluations
- Track progress with detailed reports
- Subscribe to learning plans
- Listen to professional reciters

### Key Features:
- ✅ 4 User Roles: Student, Teacher, Parent, Admin
- ✅ 114 Surahs + 6,236 Ayahs in database
- ✅ Audio upload & direct recording (max 100MB)
- ✅ OVH S3 cloud storage with auto-deletion after 30 days
- ✅ AI evaluation integration (async webhook)
- ✅ Teacher manual evaluation
- ✅ Multi-country subscription plans
- ✅ Paymob payment gateway integration
- ✅ Parent-Teacher-Student linking system
- ✅ Comprehensive reporting for all roles
- ✅ i18n support (Arabic/English)

---

## 2. Technology Stack

### Core:
- **Runtime:** Node.js 18+
- **Framework:** NestJS 10.3+
- **Language:** TypeScript 5.3+
- **Database:** PostgreSQL 16
- **ORM:** TypeORM 0.3+

### Authentication:
- **JWT:** @nestjs/jwt
- **Password Hashing:** bcryptjs
- **Guards:** Custom role-based guards

### Storage:
- **Cloud Provider:** OVH S3-compatible storage
- **SDK:** @aws-sdk/client-s3

### Payments:
- **Gateway:** Paymob (Egypt, Saudi Arabia, UAE, etc.)
- **Integration:** Webhook-based verification

### Additional:
- **Validation:** class-validator + class-transformer
- **API Docs:** Swagger (@nestjs/swagger)
- **Email:** nodemailer
- **Scheduling:** @nestjs/schedule (cron jobs)
- **Rate Limiting:** @nestjs/throttler

---

## 3. Architecture

### Project Structure:
```
src/
├── app.module.ts                 # Root module
├── main.ts                       # Application entry point
├── common/                       # Shared utilities
│   ├── config/                   # Configuration files
│   │   ├── datasource-config.ts  # TypeORM config
│   │   ├── ai.config.ts          # AI service config
│   │   ├── cloud-storage.config.ts
│   │   └── paymob.config.ts
│   ├── decorators/               # Custom decorators
│   ├── dto/                      # Shared DTOs
│   ├── entities/                 # Base entities
│   ├── enums/                    # Enums (roles, status, etc.)
│   ├── guards/                   # Auth & role guards
│   ├── interceptors/             # Response interceptors
│   ├── services/                 # Shared services
│   │   ├── custom-i18n.service.ts
│   │   ├── ai.service.ts
│   │   └── email.service.ts
│   └── fileUpload/               # File upload service
├── modules/                      # Feature modules
│   ├── auth/                     # Authentication
│   ├── user/                     # User management
│   ├── quran/                    # Quran data (surahs, ayahs)
│   ├── quran-audio/              # Reciter management
│   ├── recitations/              # Student recitations
│   ├── plans/                    # Subscription plans
│   ├── subscriptions/            # User subscriptions
│   ├── email-verification/       # Email OTP
│   ├── faq/                      # FAQ management
│   └── app-version/              # App version control
└── i18n/                         # Translation files
    ├── ar/                       # Arabic
    └── en/                       # English
```

### Design Patterns:
- **Modular Architecture:** Each feature is a separate NestJS module
- **Repository Pattern:** TypeORM repositories for data access
- **DTO Pattern:** Data validation and transformation
- **Dependency Injection:** NestJS built-in DI container
- **Guards & Interceptors:** Request/response processing

---

## 4. Database Schema

### Core Tables:

#### `users`
```sql
- id (PK, serial)
- email (unique, varchar)
- password (varchar)
- full_name (varchar)
- phone_number (varchar)
- role (enum: STUDENT, TEACHER, PARENT, ADMIN)
- teacher_type (enum: QURAN_TEACHER, TAJWEED_TEACHER, MEMORIZATION_TEACHER)
- date_of_birth (date)
- gender (enum: MALE, FEMALE)
- age_group (enum: CHILD_5_TO_10, TEEN_11_TO_17, ADULT_18_PLUS)
- country (varchar)
- student_code (varchar, 6 chars, unique)
- is_email_verified (boolean)
- account_status (enum: ACTIVE, SUSPENDED, PENDING_DELETION)
- deletion_requested_at (timestamptz)
- created_at, updated_at
```

**Relations:**
- `students[]` (many-to-many with users via user_teachers)
- `teachers[]` (many-to-many with users via user_teachers)
- `children[]` (many-to-many with users via user_parents)
- `parents[]` (many-to-many with users via user_parents)

#### `recitations`
```sql
- id (PK, serial)
- user_id (FK -> users.id)
- surah_id (int, 1-114)
- from_ayah (int)
- to_ayah (int)
- audio_url (varchar, 500)
- audio_key (varchar, 500)  # S3 object key
- duration (int, seconds)
- status (enum: PENDING, PROCESSING, COMPLETED, FAILED)
- ai_evaluation_score (decimal 5,2)
- evaluation_data (jsonb)
- ai_job_id (varchar)
- teacher_evaluation_score (decimal 5,2)
- teacher_notes (text)
- evaluated_by_teacher_id (FK -> users.id)
- teacher_evaluated_at (timestamptz)
- created_at, updated_at
```

#### `plans`
```sql
- id (PK, serial)
- name_en, name_ar (varchar)
- description_en, description_ar (text)
- session_duration (int, minutes: 30 or 60)
- number_of_sessions (int: 8, 12, 16, 20, 24)
- prices (jsonb) # Array of {country, price, currency}
- is_active (boolean)
- created_at, updated_at
```

#### `subscriptions`
```sql
- id (PK, serial)
- user_id (FK -> users.id)
- plan_id (FK -> plans.id)
- start_date (date)
- end_date (date)
- status (enum: ACTIVE, EXPIRED, CANCELLED, PENDING)
- payment_status (enum: PAID, PENDING, FAILED, REFUNDED)
- amount_paid (decimal)
- currency (varchar)
- payment_method (varchar)
- payment_transaction_id (varchar)
- paymob_order_id (varchar)
- sessions_remaining (int)
- auto_renew (boolean)
- created_at, updated_at
```

### Junction Tables:
- `user_teachers` (student_id, teacher_id)
- `user_parents` (child_id, parent_id)

### Quran Tables:
- `surahs` (114 records)
- `ayahs` (6,236 records)
- `reciters` (6 professional reciters)

### Other Tables:
- `email_verifications`
- `faqs`
- `app_settings`
- `app_versions`

---

## 5. API Endpoints

### Base URL:
- Development: `http://localhost:3001`
- Production: `https://api.quranyutla.com`
- Swagger Docs: `/api/docs`

### Authentication (`/auth`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/sign-up/student` | ❌ | - | Student registration |
| POST | `/auth/sign-up/parent` | ❌ | - | Parent registration (requires studentCode) |
| POST | `/auth/sign-up/teacher` | ❌ | - | Teacher registration |
| POST | `/auth/login` | ❌ | - | Login (returns JWT) |
| POST | `/auth/refresh-token` | ❌ | - | Refresh access token |
| POST | `/auth/forgot-password` | ❌ | - | Send password reset email |
| POST | `/auth/reset-password` | ❌ | - | Reset password with token |
| POST | `/auth/logout` | ✅ | Any | Logout |

### User Management (`/user`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/user/profile` | ✅ | Any | Get user profile |
| PATCH | `/user/profile` | ✅ | Any | Update profile |
| PATCH | `/user/change-password` | ✅ | Any | Change password |
| GET | `/user/children` | ✅ | PARENT | Get linked children |
| POST | `/user/link-child` | ✅ | PARENT | Link child by studentCode |
| POST | `/user/link-multiple-children` | ✅ | PARENT | Link multiple children |
| DELETE | `/user/unlink-child/:childId` | ✅ | PARENT | Unlink child |
| GET | `/user/students` | ✅ | TEACHER | Get linked students |
| POST | `/user/link-student` | ✅ | TEACHER | Link student by email |
| DELETE | `/user/unlink-student/:studentId` | ✅ | TEACHER | Unlink student |
| DELETE | `/user/account` | ✅ | Any | Request account deletion |

### Email Verification (`/email-verification`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/email-verification/send` | ✅ | Any | Send 6-digit OTP |
| POST | `/email-verification/verify` | ✅ | Any | Verify OTP code |

### Quran Module (`/quran`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/quran/surahs` | ❌ | - | List all surahs |
| GET | `/quran/surahs/:id` | ❌ | - | Get surah details |
| GET | `/quran/surahs/:id/ayahs` | ❌ | - | Get ayahs by surah |
| GET | `/quran/ayahs/:ayahNumber` | ❌ | - | Get specific ayah |

### Reciters (`/quran-audio`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/quran-audio/reciters` | ❌ | - | List all reciters |
| GET | `/quran-audio/reciters/:id` | ❌ | - | Get reciter details |

### Recitations (`/recitations`)

**Student Endpoints:**
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/recitations/upload` | ✅ | STUDENT | Upload audio file (multipart) |
| POST | `/recitations/direct` | ✅ | STUDENT | Direct recording (blob) |
| GET | `/recitations/my-recitations` | ✅ | STUDENT | List my recitations |
| GET | `/recitations/:id` | ✅ | Any | Get recitation by ID |
| DELETE | `/recitations/:id` | ✅ | STUDENT | Delete recitation |
| GET | `/recitations/statistics` | ✅ | STUDENT | Get statistics |

**Teacher Manual Evaluation:**
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/recitations/teacher/:recitationId` | ✅ | TEACHER | Get recitation for evaluation |
| POST | `/recitations/teacher/:recitationId/evaluate` | ✅ | TEACHER | Add manual evaluation (score 0-100 + notes) |
| PATCH | `/recitations/teacher/:recitationId/evaluate` | ✅ | TEACHER | Update evaluation |

**Teacher Reports:**
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/recitations/teacher/students` | ✅ | TEACHER | All students' recitations |
| GET | `/recitations/teacher/student/:studentId` | ✅ | TEACHER | Specific student recitations |

**Parent Reports:**
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/recitations/parent/children` | ✅ | PARENT | All children's recitations |
| GET | `/recitations/parent/child/:childId` | ✅ | PARENT | Specific child recitations |

**AI Webhook (Internal):**
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/recitations/ai-webhook` | Bearer {webhookSecret} | Receive AI evaluation results |

### Plans (`/plans`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/plans` | ❌ | - | List all active plans |
| GET | `/plans/:id` | ❌ | - | Get plan by ID |
| POST | `/plans` | ✅ | ADMIN | Create plan |
| PATCH | `/plans/:id` | ✅ | ADMIN | Update plan |
| DELETE | `/plans/:id` | ✅ | ADMIN | Delete plan |

### Subscriptions (`/subscriptions`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/subscriptions/my-subscriptions` | ✅ | STUDENT | Get my subscriptions |
| POST | `/subscriptions/subscribe` | ✅ | STUDENT | Create subscription (initiate payment) |
| POST | `/subscriptions/paymob-callback` | ❌ | - | Paymob webhook callback |
| GET | `/subscriptions/verify/:orderId` | ✅ | STUDENT | Verify payment status |

### FAQ (`/faq`)
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/faq` | ❌ | - | List all FAQs |
| POST | `/faq` | ✅ | ADMIN | Create FAQ |
| PATCH | `/faq/:id` | ✅ | ADMIN | Update FAQ |
| DELETE | `/faq/:id` | ✅ | ADMIN | Delete FAQ |

### App Version (`/app-version`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/app-version/latest` | ❌ | Get latest app version info |

---

## 6. Authentication & Authorization

### JWT Strategy:
- **Access Token:** 15 minutes expiry
- **Refresh Token:** 7 days expiry, stored in `refresh_tokens` table
- **Algorithm:** HS256
- **Header:** `Authorization: Bearer {token}`

### Registration Flow:
1. User signs up via `/auth/sign-up/{role}`
2. Password hashed with bcrypt (10 rounds)
3. 6-character `studentCode` generated for students
4. Tokens returned immediately
5. Email verification sent (6-digit OTP)

### Login Flow:
1. User sends email + password to `/auth/login`
2. Credentials validated
3. JWT tokens generated and returned
4. Optional: `playerId` for push notifications

### Role-Based Access Control:
```typescript
@Auth(RolesEnum.STUDENT)  // Only students
@Auth(RolesEnum.TEACHER)  // Only teachers
@Auth(RolesEnum.PARENT)   // Only parents
@Auth(RolesEnum.ADMIN)    // Only admins
```

### Guards:
- `JwtAuthGuard`: Validates JWT token
- `RolesGuard`: Checks user role
- `VerifiedEmailGuard`: Ensures email verified (optional)

---

## 7. File Upload & Storage

### Storage Provider: OVH S3-Compatible

#### Configuration:
```typescript
{
  region: 'sbg',
  endpoint: 'https://s3.sbg.io.cloud.ovh.net',
  bucket: 'quran-yutla-recitations',
  accessKey: process.env.OVH_ACCESS_KEY,
  secretKey: process.env.OVH_SECRET_KEY
}
```

### Upload Process:
1. Student uploads audio (MP3, WAV, M4A, WebM, OGG)
2. File validated (max 100MB)
3. Unique filename generated: `user-{userId}/recitation-{timestamp}-{uuid}.ext`
4. Uploaded to OVH S3 with public-read ACL
5. URL stored in database: `audioUrl` + `audioKey`
6. File sent to AI for evaluation (async)

### Auto-Deletion:
- **Cron Job:** Runs daily at 2:00 AM
- **Logic:** Delete audio files older than 30 days
- **Database:** Recitation record kept, audio URL/key set to null

### Supported Formats:
- Audio: MP3, WAV, M4A, WebM, OGG
- Max Size: 100MB
- Encoding: Recommended 128-256 kbps

---

## 8. AI Integration

### Architecture: Async Webhook-Based

#### Flow:
1. **Student uploads audio** → Backend saves to S3
2. **Backend calls AI service** (when ready):
   ```typescript
   POST {AI_SERVICE_URL}/evaluate
   {
     "audioUrl": "https://...",
     "surahId": 1,
     "fromAyah": 1,
     "toAyah": 7,
     "callbackUrl": "https://api.quranyutla.com/recitations/ai-webhook"
   }
   ```
3. **AI processes** (async) → Status: PROCESSING
4. **AI sends webhook** to our backend:
   ```typescript
   POST /recitations/ai-webhook
   Authorization: Bearer {WEBHOOK_SECRET}
   {
     "jobId": "uuid",
     "status": "completed",
     "score": 85.5,
     "evaluationData": {
       "tajweedScore": 90,
       "pronunciationScore": 80,
       "errors": ["خطأ في المد"],
       "timestamps": [...],
       "suggestions": [...]
     }
   }
   ```
5. **Backend updates recitation** → Status: COMPLETED

### Database Fields:
- `ai_job_id`: Track AI processing
- `ai_evaluation_score`: Overall score (0-100)
- `evaluation_data`: JSONB with detailed results
- `status`: PENDING → PROCESSING → COMPLETED/FAILED

### Security:
- Webhook authenticated with shared secret
- Only specific IP ranges allowed (configurable)
- Payload signature verification

---

## 9. Payment Integration

### Provider: Paymob

#### Supported Countries:
- Egypt (EGP)
- Saudi Arabia (SAR)
- UAE (AED)
- Kuwait (KWD)
- Jordan (JOD)
- Others...

### Payment Flow:
1. **Student selects plan** → GET `/plans`
2. **Student subscribes** → POST `/subscriptions/subscribe`
   ```json
   {
     "planId": 1,
     "country": "Egypt"
   }
   ```
3. **Backend creates Paymob order**:
   - Calls Paymob API
   - Creates order with amount + currency
   - Returns payment URL
4. **Student redirected** to Paymob payment page
5. **Student pays** via Visa/Mastercard
6. **Paymob webhook** → POST `/subscriptions/paymob-callback`
7. **Backend verifies transaction**:
   - Validates HMAC signature
   - Checks transaction status
   - Updates subscription status
8. **Subscription activated** → Status: ACTIVE

### Database Fields:
- `payment_status`: PENDING, PAID, FAILED, REFUNDED
- `payment_transaction_id`: Paymob transaction ID
- `paymob_order_id`: Paymob order ID
- `amount_paid`: Amount in selected currency
- `currency`: ISO currency code

### Testing:
- **Paymob Test Cards:** Available in Paymob docs
- **Webhook Testing:** Use ngrok for local testing

---

## 10. Setup & Installation

### Prerequisites:
- Node.js 18+ and npm
- PostgreSQL 16+
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Quran-Yutla
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Variables
Create `.env` file:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
DB_DATABASE=quran_yutla

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# OVH Storage
OVH_REGION=sbg
OVH_ENDPOINT=https://s3.sbg.io.cloud.ovh.net
OVH_ACCESS_KEY=your-access-key
OVH_SECRET_KEY=your-secret-key
OVH_BUCKET_NAME=quran-yutla-recitations

# AI Service
AI_SERVICE_URL=https://ai-service.example.com
AI_WEBHOOK_SECRET=shared-webhook-secret

# Paymob
PAYMOB_API_KEY=your-api-key
PAYMOB_SECRET_KEY=your-secret-key
PAYMOB_PUBLIC_KEY=your-public-key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App
PORT=3001
NODE_ENV=development
```

### Step 4: Database Setup
```bash
# Create database
createdb quran_yutla

# Run migrations
npm run migration:run

# Import Quran data
psql -U postgres -d quran_yutla -f hafsData_v2-0-clean.sql
```

### Step 5: Run Application
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Step 6: Access Swagger
Open browser: `http://localhost:3001/api/docs`

---

## 11. Deployment Guide

### Pre-Deployment Checklist:
- [ ] VPS Server purchased (4 weeks before launch)
- [ ] Domain registered + SSL certificate
- [ ] OVH Storage account setup (2-3 weeks before)
- [ ] Paymob Live account activated (2 weeks before)
- [ ] AI Service endpoint ready
- [ ] Environment variables configured
- [ ] Database backup strategy

### Deployment Steps:

#### Option 1: Docker Compose (Recommended)
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

#### Option 2: PM2
```bash
# Install PM2
npm install -g pm2

# Build
npm run build

# Start with PM2
pm2 start dist/main.js --name quran-yutla

# Monitor
pm2 logs quran-yutla
pm2 monit

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Nginx Configuration:
```nginx
server {
    listen 80;
    server_name api.quranyutla.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.quranyutla.com
```

---

## 12. Environment Variables

### Complete Reference:

```env
# ======================
# Application
# ======================
NODE_ENV=production
PORT=3001
API_VERSION=1
FRONTEND_URL=https://quranyutla.com

# ======================
# Database
# ======================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=quran_user
DB_PASSWORD=strong_password_here
DB_DATABASE=quran_yutla_prod
DB_LOGGING=false

# ======================
# JWT Authentication
# ======================
JWT_SECRET=super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# ======================
# OVH Cloud Storage
# ======================
OVH_REGION=sbg
OVH_ENDPOINT=https://s3.sbg.io.cloud.ovh.net
OVH_ACCESS_KEY=your_ovh_access_key
OVH_SECRET_KEY=your_ovh_secret_key
OVH_BUCKET_NAME=quran-yutla-recitations
OVH_FILE_SIZE_LIMIT=104857600  # 100MB in bytes

# ======================
# AI Service
# ======================
AI_SERVICE_URL=https://ai.example.com/api/v1
AI_WEBHOOK_SECRET=shared-secret-with-ai-team
AI_TIMEOUT=30000  # 30 seconds

# ======================
# Paymob Payment Gateway
# ======================
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_SECRET_KEY=your_paymob_secret_key
PAYMOB_PUBLIC_KEY=your_paymob_public_key
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_CALLBACK_URL=https://api.quranyutla.com/subscriptions/paymob-callback

# ======================
# Email Service
# ======================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@quranyutla.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=Quran Yutla <noreply@quranyutla.com>

# ======================
# Rate Limiting
# ======================
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# ======================
# CORS
# ======================
CORS_ORIGIN=https://quranyutla.com,https://app.quranyutla.com

# ======================
# Logging
# ======================
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

---

## 📚 Additional Resources

### API Documentation:
- Swagger UI: `/api/docs`
- Postman Collection: Available on request

### Key Documents:
- `API-ENDPOINTS.md` - Complete API reference
- `IMPLEMENTATION-CHECKLIST.md` - Feature completion status
- `docs/Teacher-Manual-Evaluation-Feature.md` - Teacher evaluation guide

### Database Migrations:
```bash
# Generate new migration
npm run migration:generate -- migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

### Testing:
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 🔧 Troubleshooting

### Common Issues:

**1. Database Connection Failed:**
- Check PostgreSQL is running
- Verify DB credentials in `.env`
- Ensure database exists

**2. OVH Upload Fails:**
- Check bucket permissions
- Verify access/secret keys
- Test endpoint connectivity

**3. JWT Invalid:**
- Clear refresh tokens table
- Verify JWT_SECRET matches
- Check token expiry

**4. Migration Errors:**
- Ensure migrations run in order
- Check database schema manually
- Rollback and retry if needed

---

**For support or questions, contact the development team.**

**Last Updated:** December 17, 2025  
**Version:** 1.0.0
