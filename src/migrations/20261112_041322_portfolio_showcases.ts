import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "portfolio_showcases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"featured" boolean DEFAULT false,
  	"project_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "portfolio_showcases_id" integer;
  ALTER TABLE "profile" ADD COLUMN "portfolio_pdf_id" integer;
  ALTER TABLE "portfolio_showcases" ADD CONSTRAINT "portfolio_showcases_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portfolio_showcases" ADD CONSTRAINT "portfolio_showcases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "portfolio_showcases_image_idx" ON "portfolio_showcases" USING btree ("image_id");
  CREATE INDEX "portfolio_showcases_project_idx" ON "portfolio_showcases" USING btree ("project_id");
  CREATE INDEX "portfolio_showcases_updated_at_idx" ON "portfolio_showcases" USING btree ("updated_at");
  CREATE INDEX "portfolio_showcases_created_at_idx" ON "portfolio_showcases" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_portfolio_showcases_fk" FOREIGN KEY ("portfolio_showcases_id") REFERENCES "public"."portfolio_showcases"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profile" ADD CONSTRAINT "profile_portfolio_pdf_id_media_id_fk" FOREIGN KEY ("portfolio_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_portfolio_showcases_id_idx" ON "payload_locked_documents_rels" USING btree ("portfolio_showcases_id");
  CREATE INDEX "profile_portfolio_pdf_idx" ON "profile" USING btree ("portfolio_pdf_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "portfolio_showcases" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "portfolio_showcases" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_portfolio_showcases_fk";
  
  ALTER TABLE "profile" DROP CONSTRAINT "profile_portfolio_pdf_id_media_id_fk";
  
  DROP INDEX "payload_locked_documents_rels_portfolio_showcases_id_idx";
  DROP INDEX "profile_portfolio_pdf_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "portfolio_showcases_id";
  ALTER TABLE "profile" DROP COLUMN "portfolio_pdf_id";`)
}
