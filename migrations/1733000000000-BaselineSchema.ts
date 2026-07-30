import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for the tables that no other migration creates.
 *
 * Historically the schema was produced by TypeORM's `synchronize: true`, so only
 * plans / subscriptions / recitations ever got migrations. Turning synchronize
 * off left a fresh database with no way to build the remaining 11 tables, which
 * meant any new deployment would start against an empty schema and fail.
 *
 * Every statement here is idempotent (IF NOT EXISTS, or a name guard for
 * constraints, which Postgres cannot express directly). On an existing database
 * this migration is a complete no-op; on a fresh one it builds the base schema
 * before the later migrations patch it.
 *
 * Timestamped ahead of every other migration so it always runs first.
 */
export class BaselineSchema1733000000000 implements MigrationInterface {
  name = 'BaselineSchema1733000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='notifications_type_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."notifications_type_enum" AS ENUM ('broadcast', 'direct', 'scheduled', 'custom_notification');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='users_age_group_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."users_age_group_enum" AS ENUM ('4-6', '7-12', '13-17', '18+');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='users_country_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."users_country_enum" AS ENUM ('Egypt', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Jordan', 'Palestine', 'Lebanon', 'Syria', 'Iraq', 'Yemen', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Sudan', 'Mauritania', 'Somalia', 'Djibouti', 'Comoros');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='users_gender_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."users_gender_enum" AS ENUM ('male', 'female');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='users_roles_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."users_roles_enum" AS ENUM ('admin', 'student', 'teacher', 'parent', 'guest', 'manager');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='users_status_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."users_status_enum" AS ENUM ('active', 'suspended', 'pending', 'blocked', 'deleted', 'verified', 'unverified', 'refused', 'expired');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='plans_session_duration_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."plans_session_duration_enum" AS ENUM ('30', '60');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='plans_session_count_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."plans_session_count_enum" AS ENUM ('8', '12', '16', '20', '24');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='subscriptions_status_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."subscriptions_status_enum" AS ENUM ('active', 'expired', 'cancelled', 'pending_payment', 'suspended');
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE t.typname='recitations_status_enum' AND n.nspname='public') THEN
    CREATE TYPE "public"."recitations_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END $$;`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".app_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".email_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".faqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".notification_recipients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".recitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "public".users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".app_settings (
    name text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    maintenance_mode boolean DEFAULT false NOT NULL,
    maintenance_message text,
    allow_registration boolean DEFAULT true NOT NULL,
    min_app_version character varying(20) DEFAULT '1.0.0'::character varying NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".app_versions (
    created_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    deleted_at timestamp with time zone,
    id integer NOT NULL,
    android_version character varying NOT NULL,
    android_end_date date NOT NULL,
    android_url character varying NOT NULL,
    ios_version character varying NOT NULL,
    ios_end_date date NOT NULL,
    ios_url character varying NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".ayahs (
    created_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    deleted_at timestamp with time zone,
    id integer NOT NULL,
    number integer NOT NULL,
    text text NOT NULL,
    text_emlaey text,
    number_in_surah integer NOT NULL,
    juz integer NOT NULL,
    page integer NOT NULL,
    hizb_quarter integer,
    line_start integer,
    line_end integer,
    sajda boolean DEFAULT false NOT NULL,
    surah_number integer NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".email_verifications (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "otpCode" character varying(6) NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "isUsed" boolean DEFAULT false NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    email character varying,
    "isForPasswordReset" boolean DEFAULT false NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".faqs (
    created_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    deleted_at timestamp with time zone,
    id integer NOT NULL,
    question character varying(255) NOT NULL,
    answer text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    language character varying DEFAULT 'ar'::character varying NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".notification_recipients (
    id integer NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp without time zone,
    "notificationId" integer,
    "userId" integer
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".notifications (
    created_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    deleted_at timestamp with time zone,
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    "navigationData" jsonb,
    "createdById" integer,
    type "public".notifications_type_enum DEFAULT 'direct'::"public".notifications_type_enum NOT NULL,
    "scheduledAt" timestamp with time zone DEFAULT now() NOT NULL,
    "oneSignalId" character varying,
    for_admin boolean
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".plans (
    id integer NOT NULL,
    name_en character varying(100) NOT NULL,
    name_ar character varying(100) NOT NULL,
    description_en text,
    description_ar text,
    session_duration "public".plans_session_duration_enum NOT NULL,
    session_count "public".plans_session_count_enum NOT NULL,
    base_price numeric(10,2) NOT NULL,
    country_pricing jsonb,
    discount_percentage numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_popular boolean DEFAULT false NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    duration_days integer DEFAULT 30 NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".recitations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    surah_id integer NOT NULL,
    from_ayah integer NOT NULL,
    to_ayah integer NOT NULL,
    audio_url character varying(500) NOT NULL,
    audio_key character varying(500) NOT NULL,
    duration integer NOT NULL,
    file_size bigint NOT NULL,
    status "public".recitations_status_enum DEFAULT 'pending'::"public".recitations_status_enum NOT NULL,
    evaluation_score numeric(5,2),
    evaluation_data jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    ai_job_id character varying(255),
    teacher_evaluation_score numeric(5,2),
    teacher_notes text,
    evaluated_by_teacher_id integer,
    teacher_evaluated_at timestamp with time zone
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    plan_id integer NOT NULL,
    status "public".subscriptions_status_enum DEFAULT 'pending_payment'::"public".subscriptions_status_enum NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    total_sessions integer NOT NULL,
    remaining_sessions integer NOT NULL,
    session_duration integer NOT NULL,
    auto_renew boolean DEFAULT true NOT NULL,
    payment_method character varying(50),
    last_payment_date timestamp without time zone,
    next_billing_date timestamp without time zone,
    cancelled_at timestamp without time zone,
    cancellation_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    transaction_id character varying(255),
    pricing_country character varying(100),
    original_price numeric(10,2),
    discount_percentage_applied numeric(5,2),
    final_amount numeric(10,2),
    currency character varying(10)
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".surahs (
    created_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    deleted_at timestamp with time zone,
    number integer NOT NULL,
    name character varying(255) NOT NULL,
    english_name character varying(255) NOT NULL,
    english_name_translation character varying(255),
    revelation_type character varying(50),
    number_of_ayahs integer NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".teacher_students (
    teacher_id integer NOT NULL,
    student_id integer NOT NULL
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".token (
    id integer NOT NULL,
    token character varying NOT NULL,
    "expiresAt" timestamp without time zone,
    "userId" integer
)`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "public".users (
    created_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT ('now'::text)::timestamp(6) with time zone NOT NULL,
    deleted_at timestamp with time zone,
    id integer NOT NULL,
    email character varying,
    password character varying,
    full_name character varying,
    gender "public".users_gender_enum,
    country "public".users_country_enum,
    age_group "public".users_age_group_enum,
    phone_number character varying,
    registration_date timestamp without time zone DEFAULT now() NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    roles "public".users_roles_enum[] DEFAULT '{}'::"public".users_roles_enum[] NOT NULL,
    profile_image_url character varying,
    date_of_birth timestamp without time zone,
    "playerIds" jsonb,
    student_code character varying(6),
    parent_id integer,
    number_of_children integer,
    status "public".users_status_enum DEFAULT 'active'::"public".users_status_enum NOT NULL,
    suspended_at timestamp with time zone,
    suspended_reason text,
    suspended_by_admin_id integer
)`);
    await queryRunner.query(`ALTER SEQUENCE "public".app_versions_id_seq OWNED BY "public".app_versions.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".email_verifications_id_seq OWNED BY "public".email_verifications.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".faqs_id_seq OWNED BY "public".faqs.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".notification_recipients_id_seq OWNED BY "public".notification_recipients.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".notifications_id_seq OWNED BY "public".notifications.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".plans_id_seq OWNED BY "public".plans.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".recitations_id_seq OWNED BY "public".recitations.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".subscriptions_id_seq OWNED BY "public".subscriptions.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".token_id_seq OWNED BY "public".token.id`);
    await queryRunner.query(`ALTER SEQUENCE "public".users_id_seq OWNED BY "public".users.id`);
    await queryRunner.query(`ALTER TABLE ONLY "public".app_versions ALTER COLUMN id SET DEFAULT nextval('"public".app_versions_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".email_verifications ALTER COLUMN id SET DEFAULT nextval('"public".email_verifications_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".faqs ALTER COLUMN id SET DEFAULT nextval('"public".faqs_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".notification_recipients ALTER COLUMN id SET DEFAULT nextval('"public".notification_recipients_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".notifications ALTER COLUMN id SET DEFAULT nextval('"public".notifications_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".plans ALTER COLUMN id SET DEFAULT nextval('"public".plans_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".recitations ALTER COLUMN id SET DEFAULT nextval('"public".recitations_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".subscriptions ALTER COLUMN id SET DEFAULT nextval('"public".subscriptions_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".token ALTER COLUMN id SET DEFAULT nextval('"public".token_id_seq'::regclass)`);
    await queryRunner.query(`ALTER TABLE ONLY "public".users ALTER COLUMN id SET DEFAULT nextval('"public".users_id_seq'::regclass)`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_2ddf4f2c910f8e8fa2663a67bf0') THEN
    ALTER TABLE ONLY "public".faqs ADD CONSTRAINT "PK_2ddf4f2c910f8e8fa2663a67bf0" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_3720521a81c7c24fe9b7202ba61') THEN
    ALTER TABLE ONLY "public".plans ADD CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_5b748992dfbaf0aa61e58c8d362') THEN
    ALTER TABLE ONLY "public".recitations ADD CONSTRAINT "PK_5b748992dfbaf0aa61e58c8d362" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_6a72c3c0f683f6462415e653c3a') THEN
    ALTER TABLE ONLY "public".notifications ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_6b96abacd4096c17e309883358b') THEN
    ALTER TABLE ONLY "public".teacher_students ADD CONSTRAINT "PK_6b96abacd4096c17e309883358b" PRIMARY KEY (teacher_id, student_id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_82fae97f905930df5d62a702fc9') THEN
    ALTER TABLE ONLY "public".token ADD CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_8d36b0dcf0c026c7aad923c80fd') THEN
    ALTER TABLE ONLY "public".app_versions ADD CONSTRAINT "PK_8d36b0dcf0c026c7aad923c80fd" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_a3ffb1c0c8416b9fc6f907b7433') THEN
    ALTER TABLE ONLY "public".users ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_a87248d73155605cf782be9ee5e') THEN
    ALTER TABLE ONLY "public".subscriptions ADD CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_bd5b25c456987261a38c762b223') THEN
    ALTER TABLE ONLY "public".notification_recipients ADD CONSTRAINT "PK_bd5b25c456987261a38c762b223" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_c1ea2921e767f83cd44c0af203f') THEN
    ALTER TABLE ONLY "public".email_verifications ADD CONSTRAINT "PK_c1ea2921e767f83cd44c0af203f" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_dabc627eef37867fd10af3a67bd') THEN
    ALTER TABLE ONLY "public".app_settings ADD CONSTRAINT "PK_dabc627eef37867fd10af3a67bd" PRIMARY KEY (name);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_ecf323d7da5ff70886c4114c604') THEN
    ALTER TABLE ONLY "public".surahs ADD CONSTRAINT "PK_ecf323d7da5ff70886c4114c604" PRIMARY KEY (number);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PK_f7bafd4c76e971cbb3357bf5e90') THEN
    ALTER TABLE ONLY "public".ayahs ADD CONSTRAINT "PK_f7bafd4c76e971cbb3357bf5e90" PRIMARY KEY (id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_97672ac88f789774dd47f7c8be3') THEN
    ALTER TABLE ONLY "public".users ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_9be1df94aa1ef231ce18f4f11cd') THEN
    ALTER TABLE ONLY "public".users ADD CONSTRAINT "UQ_9be1df94aa1ef231ce18f4f11cd" UNIQUE (student_code);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_03b7ad8596195af69eb19034116') THEN
    ALTER TABLE ONLY "public".users ADD CONSTRAINT "FK_03b7ad8596195af69eb19034116" FOREIGN KEY (parent_id) REFERENCES "public".users(id) ON DELETE SET NULL;
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_0dd255e56cbaaf3baebc8bf01e9') THEN
    ALTER TABLE ONLY "public".recitations ADD CONSTRAINT "FK_0dd255e56cbaaf3baebc8bf01e9" FOREIGN KEY (surah_id) REFERENCES "public".surahs(number);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_234adaa36f97dd1b2bd3a22d65b') THEN
    ALTER TABLE ONLY "public".notification_recipients ADD CONSTRAINT "FK_234adaa36f97dd1b2bd3a22d65b" FOREIGN KEY ("notificationId") REFERENCES "public".notifications(id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_328c82890a2e85fca6e82f49a5c') THEN
    ALTER TABLE ONLY "public".teacher_students ADD CONSTRAINT "FK_328c82890a2e85fca6e82f49a5c" FOREIGN KEY (teacher_id) REFERENCES "public".users(id) ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_354b9ea0ab74c74ad7e0d331585') THEN
    ALTER TABLE ONLY "public".recitations ADD CONSTRAINT "FK_354b9ea0ab74c74ad7e0d331585" FOREIGN KEY (user_id) REFERENCES "public".users(id) ON DELETE CASCADE;
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_452385a8220b8053ab65317ffa6') THEN
    ALTER TABLE ONLY "public".notification_recipients ADD CONSTRAINT "FK_452385a8220b8053ab65317ffa6" FOREIGN KEY ("userId") REFERENCES "public".users(id) ON DELETE CASCADE;
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_4e63a91e0a684b31496bd50733e') THEN
    ALTER TABLE ONLY "public".email_verifications ADD CONSTRAINT "FK_4e63a91e0a684b31496bd50733e" FOREIGN KEY ("userId") REFERENCES "public".users(id) ON DELETE CASCADE;
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_8378666b935ffb8f64262580fc4') THEN
    ALTER TABLE ONLY "public".teacher_students ADD CONSTRAINT "FK_8378666b935ffb8f64262580fc4" FOREIGN KEY (student_id) REFERENCES "public".users(id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_94f168faad896c0786646fa3d4a') THEN
    ALTER TABLE ONLY "public".token ADD CONSTRAINT "FK_94f168faad896c0786646fa3d4a" FOREIGN KEY ("userId") REFERENCES "public".users(id) ON DELETE CASCADE;
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_d0a95ef8a28188364c546eb65c1') THEN
    ALTER TABLE ONLY "public".subscriptions ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY (user_id) REFERENCES "public".users(id) ON DELETE CASCADE;
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_e45fca5d912c3a2fab512ac25dc') THEN
    ALTER TABLE ONLY "public".subscriptions ADD CONSTRAINT "FK_e45fca5d912c3a2fab512ac25dc" FOREIGN KEY (plan_id) REFERENCES "public".plans(id);
  END IF;
END $$;`);
    await queryRunner.query(`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_f84a5f81d2e87e70b3335510b6c') THEN
    ALTER TABLE ONLY "public".ayahs ADD CONSTRAINT "FK_f84a5f81d2e87e70b3335510b6c" FOREIGN KEY (surah_number) REFERENCES "public".surahs(number);
  END IF;
END $$;`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_328c82890a2e85fca6e82f49a5" ON "public".teacher_students USING btree (teacher_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_8378666b935ffb8f64262580fc" ON "public".teacher_students USING btree (student_id)`);
  }

  public async down(): Promise<void> {
    // Intentionally irreversible: this is the base schema. Reverting it would
    // drop every user, recitation and subscription in the database.
    throw new Error(
      'BaselineSchema1733000000000 cannot be reverted — it defines the base schema.',
    );
  }
}
