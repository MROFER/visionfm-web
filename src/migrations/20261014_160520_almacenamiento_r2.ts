import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "medios" ADD COLUMN "prefix" varchar DEFAULT 'medios';
  ALTER TABLE "medios" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "archivos" ADD COLUMN "prefix" varchar DEFAULT 'archivos';
  ALTER TABLE "archivos" ADD COLUMN "_objectkey" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "medios" DROP COLUMN "prefix";
  ALTER TABLE "medios" DROP COLUMN "_objectkey";
  ALTER TABLE "archivos" DROP COLUMN "prefix";
  ALTER TABLE "archivos" DROP COLUMN "_objectkey";`)
}
