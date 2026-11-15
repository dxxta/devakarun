import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ADD COLUMN "announcement_enabled" boolean DEFAULT true;
   ALTER TABLE "site_settings" ADD COLUMN "announcement_text" varchar;
   ALTER TABLE "site_settings" ADD COLUMN "announcement_link_label" varchar;
   ALTER TABLE "site_settings" ADD COLUMN "announcement_link_url" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "announcement_enabled";
   ALTER TABLE "site_settings" DROP COLUMN "announcement_text";
   ALTER TABLE "site_settings" DROP COLUMN "announcement_link_label";
   ALTER TABLE "site_settings" DROP COLUMN "announcement_link_url";`)
}
