import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "medios" ADD COLUMN "sizes_compartir_url" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_compartir_width" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_compartir_height" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_compartir_mime_type" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_compartir_filesize" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_compartir_filename" varchar;
  CREATE INDEX "medios_sizes_compartir_sizes_compartir_filename_idx" ON "medios" USING btree ("sizes_compartir_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "medios_sizes_compartir_sizes_compartir_filename_idx";
  ALTER TABLE "medios" DROP COLUMN "sizes_compartir_url";
  ALTER TABLE "medios" DROP COLUMN "sizes_compartir_width";
  ALTER TABLE "medios" DROP COLUMN "sizes_compartir_height";
  ALTER TABLE "medios" DROP COLUMN "sizes_compartir_mime_type";
  ALTER TABLE "medios" DROP COLUMN "sizes_compartir_filesize";
  ALTER TABLE "medios" DROP COLUMN "sizes_compartir_filename";`)
}
