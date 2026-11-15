import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "post_views" ADD COLUMN "country" varchar DEFAULT 'XX' NOT NULL;

    CREATE TABLE "page_visits" (
      "id" serial PRIMARY KEY NOT NULL,
      "path" varchar NOT NULL,
      "country" varchar DEFAULT 'XX' NOT NULL,
      "visitor_hash" varchar NOT NULL,
      "day" varchar NOT NULL,
      "referrer_host" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "analytics_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "event" varchar NOT NULL,
      "path" varchar NOT NULL,
      "label" varchar,
      "country" varchar DEFAULT 'XX' NOT NULL,
      "visitor_hash" varchar NOT NULL,
      "day" varchar NOT NULL,
      "reason" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "page_visits_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_events_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_visits_fk"
      FOREIGN KEY ("page_visits_id") REFERENCES "public"."page_visits"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_events_fk"
      FOREIGN KEY ("analytics_events_id") REFERENCES "public"."analytics_events"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "page_visits_path_visitor_hash_day_idx" ON "page_visits" USING btree ("path", "visitor_hash", "day");
    CREATE INDEX "page_visits_country_idx" ON "page_visits" USING btree ("country");
    CREATE INDEX "page_visits_visitor_hash_idx" ON "page_visits" USING btree ("visitor_hash");
    CREATE INDEX "page_visits_day_idx" ON "page_visits" USING btree ("day");
    CREATE INDEX "page_visits_referrer_host_idx" ON "page_visits" USING btree ("referrer_host");
    CREATE INDEX "page_visits_updated_at_idx" ON "page_visits" USING btree ("updated_at");
    CREATE INDEX "page_visits_created_at_idx" ON "page_visits" USING btree ("created_at");

    CREATE INDEX "analytics_events_event_day_idx" ON "analytics_events" USING btree ("event", "day");
    CREATE INDEX "analytics_events_path_idx" ON "analytics_events" USING btree ("path");
    CREATE INDEX "analytics_events_country_idx" ON "analytics_events" USING btree ("country");
    CREATE INDEX "analytics_events_visitor_hash_idx" ON "analytics_events" USING btree ("visitor_hash");
    CREATE INDEX "analytics_events_day_idx" ON "analytics_events" USING btree ("day");
    CREATE INDEX "analytics_events_updated_at_idx" ON "analytics_events" USING btree ("updated_at");
    CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");

    CREATE INDEX "post_views_country_idx" ON "post_views" USING btree ("country");
    CREATE INDEX "payload_locked_documents_rels_page_visits_id_idx" ON "payload_locked_documents_rels" USING btree ("page_visits_id");
    CREATE INDEX "payload_locked_documents_rels_analytics_events_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_events_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_page_visits_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_events_fk";
    ALTER TABLE "page_visits" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "analytics_events" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "page_visits" CASCADE;
    DROP TABLE "analytics_events" CASCADE;
    DROP INDEX "payload_locked_documents_rels_page_visits_id_idx";
    DROP INDEX "payload_locked_documents_rels_analytics_events_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "page_visits_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_events_id";
    DROP INDEX "post_views_country_idx";
    ALTER TABLE "post_views" DROP COLUMN "country";
  `)
}
