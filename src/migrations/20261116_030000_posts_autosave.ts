import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Posts enabled draft autosave, which adds an "autosave" flag to the versions table.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "autosave" boolean;
    CREATE INDEX IF NOT EXISTS "_posts_v_autosave_idx" ON "_posts_v" USING btree ("autosave");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "_posts_v_autosave_idx";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "autosave";
  `)
}
