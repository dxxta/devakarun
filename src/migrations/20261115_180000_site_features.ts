import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "features_show_profile_download" boolean DEFAULT true;
   ALTER TABLE "site_settings" ADD COLUMN "features_show_gallery" boolean DEFAULT true;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "features_show_profile_download";
   ALTER TABLE "site_settings" DROP COLUMN "features_show_gallery";`)
}
