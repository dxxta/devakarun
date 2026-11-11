import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_projects_locked_fields" ADD VALUE 'features' BEFORE 'coverImage';
  ALTER TYPE "public"."enum_projects_locked_fields" ADD VALUE 'architecture' BEFORE 'coverImage';
  CREATE TABLE "projects_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "projects_architecture_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"purpose" varchar,
  	"detail" varchar
  );
  
  ALTER TABLE "projects" ADD COLUMN "architecture_summary" varchar;
  ALTER TABLE "projects" ADD COLUMN "architecture_architecture_diagram" varchar;
  ALTER TABLE "projects_features" ADD CONSTRAINT "projects_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_architecture_items" ADD CONSTRAINT "projects_architecture_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_features_order_idx" ON "projects_features" USING btree ("_order");
  CREATE INDEX "projects_features_parent_id_idx" ON "projects_features" USING btree ("_parent_id");
  CREATE INDEX "projects_architecture_items_order_idx" ON "projects_architecture_items" USING btree ("_order");
  CREATE INDEX "projects_architecture_items_parent_id_idx" ON "projects_architecture_items" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "projects_features" CASCADE;
  DROP TABLE "projects_architecture_items" CASCADE;
  ALTER TABLE "projects_locked_fields" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_projects_locked_fields";
  CREATE TYPE "public"."enum_projects_locked_fields" AS ENUM('title', 'summary', 'description', 'coverImage', 'gallery');
  ALTER TABLE "projects_locked_fields" ALTER COLUMN "value" SET DATA TYPE "public"."enum_projects_locked_fields" USING "value"::"public"."enum_projects_locked_fields";
  ALTER TABLE "projects" DROP COLUMN "architecture_summary";
  ALTER TABLE "projects" DROP COLUMN "architecture_architecture_diagram";`)
}
