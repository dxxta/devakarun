import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "gallery_images" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "image_id" integer NOT NULL,
      "caption" varchar,
      "order" numeric DEFAULT 0,
      "taken_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "gallery_images_id" integer;
    ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gallery_images_fk"
      FOREIGN KEY ("gallery_images_id") REFERENCES "public"."gallery_images"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "gallery_images_image_idx" ON "gallery_images" USING btree ("image_id");
    CREATE INDEX "gallery_images_updated_at_idx" ON "gallery_images" USING btree ("updated_at");
    CREATE INDEX "gallery_images_created_at_idx" ON "gallery_images" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_gallery_images_id_idx"
      ON "payload_locked_documents_rels" USING btree ("gallery_images_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_gallery_images_fk";
    ALTER TABLE "gallery_images" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "gallery_images" CASCADE;
    DROP INDEX "payload_locked_documents_rels_gallery_images_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "gallery_images_id";
  `)
}
