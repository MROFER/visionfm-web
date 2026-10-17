import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticias" ADD COLUMN "wordpress_id_post" numeric;
  ALTER TABLE "noticias" ADD COLUMN "wordpress_enlace" varchar;
  ALTER TABLE "noticias" ADD COLUMN "wordpress_modificada" timestamp(3) with time zone;
  ALTER TABLE "noticias" ADD COLUMN "wordpress_importada" timestamp(3) with time zone;
  ALTER TABLE "_noticias_v" ADD COLUMN "version_wordpress_id_post" numeric;
  ALTER TABLE "_noticias_v" ADD COLUMN "version_wordpress_enlace" varchar;
  ALTER TABLE "_noticias_v" ADD COLUMN "version_wordpress_modificada" timestamp(3) with time zone;
  ALTER TABLE "_noticias_v" ADD COLUMN "version_wordpress_importada" timestamp(3) with time zone;
  ALTER TABLE "medios" ADD COLUMN "origen" varchar;
  CREATE UNIQUE INDEX "noticias_wordpress_wordpress_id_post_idx" ON "noticias" USING btree ("wordpress_id_post");
  CREATE INDEX "_noticias_v_version_wordpress_version_wordpress_id_post_idx" ON "_noticias_v" USING btree ("version_wordpress_id_post");
  CREATE UNIQUE INDEX "medios_origen_idx" ON "medios" USING btree ("origen");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "noticias_wordpress_wordpress_id_post_idx";
  DROP INDEX "_noticias_v_version_wordpress_version_wordpress_id_post_idx";
  DROP INDEX "medios_origen_idx";
  ALTER TABLE "noticias" DROP COLUMN "wordpress_id_post";
  ALTER TABLE "noticias" DROP COLUMN "wordpress_enlace";
  ALTER TABLE "noticias" DROP COLUMN "wordpress_modificada";
  ALTER TABLE "noticias" DROP COLUMN "wordpress_importada";
  ALTER TABLE "_noticias_v" DROP COLUMN "version_wordpress_id_post";
  ALTER TABLE "_noticias_v" DROP COLUMN "version_wordpress_enlace";
  ALTER TABLE "_noticias_v" DROP COLUMN "version_wordpress_modificada";
  ALTER TABLE "_noticias_v" DROP COLUMN "version_wordpress_importada";
  ALTER TABLE "medios" DROP COLUMN "origen";`)
}
