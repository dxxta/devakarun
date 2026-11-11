import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "profile_list_previews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"label" varchar
  );
  
  ALTER TABLE "profile_list_previews" ADD CONSTRAINT "profile_list_previews_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "profile_list_previews" ADD CONSTRAINT "profile_list_previews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "profile_list_previews_order_idx" ON "profile_list_previews" USING btree ("_order");
  CREATE INDEX "profile_list_previews_parent_id_idx" ON "profile_list_previews" USING btree ("_parent_id");
  CREATE INDEX "profile_list_previews_image_idx" ON "profile_list_previews" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "profile_list_previews" CASCADE;`)
}
