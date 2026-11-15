import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "profile" ADD COLUMN "avatar_alt_id" integer;
    ALTER TABLE "profile" ADD CONSTRAINT "profile_avatar_alt_id_media_id_fk" FOREIGN KEY ("avatar_alt_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX "profile_avatar_alt_idx" ON "profile" USING btree ("avatar_alt_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "profile_avatar_alt_idx";
    ALTER TABLE "profile" DROP CONSTRAINT "profile_avatar_alt_id_media_id_fk";
    ALTER TABLE "profile" DROP COLUMN "avatar_alt_id";
  `)
}
