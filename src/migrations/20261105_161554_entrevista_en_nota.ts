import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticias" ADD COLUMN "entrevista_id" integer;
  ALTER TABLE "_noticias_v" ADD COLUMN "version_entrevista_id" integer;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_entrevista_id_entrevistas_id_fk" FOREIGN KEY ("entrevista_id") REFERENCES "public"."entrevistas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_version_entrevista_id_entrevistas_id_fk" FOREIGN KEY ("version_entrevista_id") REFERENCES "public"."entrevistas"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "noticias_entrevista_idx" ON "noticias" USING btree ("entrevista_id");
  CREATE INDEX "_noticias_v_version_version_entrevista_idx" ON "_noticias_v" USING btree ("version_entrevista_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticias" DROP CONSTRAINT "noticias_entrevista_id_entrevistas_id_fk";
  
  ALTER TABLE "_noticias_v" DROP CONSTRAINT "_noticias_v_version_entrevista_id_entrevistas_id_fk";
  
  DROP INDEX "noticias_entrevista_idx";
  DROP INDEX "_noticias_v_version_version_entrevista_idx";
  ALTER TABLE "noticias" DROP COLUMN "entrevista_id";
  ALTER TABLE "_noticias_v" DROP COLUMN "version_entrevista_id";`)
}
