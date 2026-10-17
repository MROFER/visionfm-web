import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "entrevistas" ADD COLUMN "wordpress_id_medio" numeric;
  ALTER TABLE "entrevistas" ADD COLUMN "wordpress_id_post" numeric;
  ALTER TABLE "_entrevistas_v" ADD COLUMN "version_wordpress_id_medio" numeric;
  ALTER TABLE "_entrevistas_v" ADD COLUMN "version_wordpress_id_post" numeric;
  ALTER TABLE "archivos" ADD COLUMN "origen" varchar;
  CREATE UNIQUE INDEX "entrevistas_wordpress_wordpress_id_medio_idx" ON "entrevistas" USING btree ("wordpress_id_medio");
  CREATE INDEX "_entrevistas_v_version_wordpress_version_wordpress_id_me_idx" ON "_entrevistas_v" USING btree ("version_wordpress_id_medio");
  CREATE UNIQUE INDEX "archivos_origen_idx" ON "archivos" USING btree ("origen");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "entrevistas_wordpress_wordpress_id_medio_idx";
  DROP INDEX "_entrevistas_v_version_wordpress_version_wordpress_id_me_idx";
  DROP INDEX "archivos_origen_idx";
  ALTER TABLE "entrevistas" DROP COLUMN "wordpress_id_medio";
  ALTER TABLE "entrevistas" DROP COLUMN "wordpress_id_post";
  ALTER TABLE "_entrevistas_v" DROP COLUMN "version_wordpress_id_medio";
  ALTER TABLE "_entrevistas_v" DROP COLUMN "version_wordpress_id_post";
  ALTER TABLE "archivos" DROP COLUMN "origen";`)
}
