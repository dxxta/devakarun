import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_post_reactions_type" AS ENUM('like', 'love', 'fire', 'idea', 'clap');

    CREATE TABLE "post_reactions" (
      "id" serial PRIMARY KEY NOT NULL,
      "post_id" integer NOT NULL,
      "type" "enum_post_reactions_type" NOT NULL,
      "visitor_hash" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "post_views" (
      "id" serial PRIMARY KEY NOT NULL,
      "post_id" integer NOT NULL,
      "visitor_hash" varchar NOT NULL,
      "day" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "post_reactions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "post_views_id" integer;

    ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_posts_id_fk"
      FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "post_views" ADD CONSTRAINT "post_views_post_id_posts_id_fk"
      FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_post_reactions_fk"
      FOREIGN KEY ("post_reactions_id") REFERENCES "public"."post_reactions"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_post_views_fk"
      FOREIGN KEY ("post_views_id") REFERENCES "public"."post_views"("id") ON DELETE cascade ON UPDATE no action;

    CREATE UNIQUE INDEX "post_reactions_post_type_visitor_uidx" ON "post_reactions" USING btree ("post_id", "type", "visitor_hash");
    CREATE INDEX "post_reactions_visitor_hash_idx" ON "post_reactions" USING btree ("visitor_hash");
    CREATE INDEX "post_reactions_updated_at_idx" ON "post_reactions" USING btree ("updated_at");
    CREATE INDEX "post_reactions_created_at_idx" ON "post_reactions" USING btree ("created_at");
    CREATE UNIQUE INDEX "post_views_post_visitor_day_uidx" ON "post_views" USING btree ("post_id", "visitor_hash", "day");
    CREATE INDEX "post_views_visitor_hash_idx" ON "post_views" USING btree ("visitor_hash");
    CREATE INDEX "post_views_day_idx" ON "post_views" USING btree ("day");
    CREATE INDEX "post_views_updated_at_idx" ON "post_views" USING btree ("updated_at");
    CREATE INDEX "post_views_created_at_idx" ON "post_views" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_post_reactions_id_idx" ON "payload_locked_documents_rels" USING btree ("post_reactions_id");
    CREATE INDEX "payload_locked_documents_rels_post_views_id_idx" ON "payload_locked_documents_rels" USING btree ("post_views_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_post_reactions_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_post_views_fk";
    ALTER TABLE "post_reactions" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "post_views" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "post_reactions" CASCADE;
    DROP TABLE "post_views" CASCADE;
    DROP INDEX "payload_locked_documents_rels_post_reactions_id_idx";
    DROP INDEX "payload_locked_documents_rels_post_views_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "post_reactions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "post_views_id";
    DROP TYPE "public"."enum_post_reactions_type";
  `)
}
