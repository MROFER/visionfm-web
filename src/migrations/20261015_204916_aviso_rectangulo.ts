import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "anuncios" ADD COLUMN "imagen_rectangulo_id" integer;
  ALTER TABLE "ajustes" ADD COLUMN "aviso_propio_imagen_rectangulo_id" integer;
  ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_imagen_rectangulo_id_medios_id_fk" FOREIGN KEY ("imagen_rectangulo_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ajustes" ADD CONSTRAINT "ajustes_aviso_propio_imagen_rectangulo_id_medios_id_fk" FOREIGN KEY ("aviso_propio_imagen_rectangulo_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "anuncios_imagen_rectangulo_idx" ON "anuncios" USING btree ("imagen_rectangulo_id");
  CREATE INDEX "ajustes_aviso_propio_aviso_propio_imagen_rectangulo_idx" ON "ajustes" USING btree ("aviso_propio_imagen_rectangulo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "anuncios" DROP CONSTRAINT "anuncios_imagen_rectangulo_id_medios_id_fk";
  
  ALTER TABLE "ajustes" DROP CONSTRAINT "ajustes_aviso_propio_imagen_rectangulo_id_medios_id_fk";
  
  DROP INDEX "anuncios_imagen_rectangulo_idx";
  DROP INDEX "ajustes_aviso_propio_aviso_propio_imagen_rectangulo_idx";
  ALTER TABLE "anuncios" DROP COLUMN "imagen_rectangulo_id";
  ALTER TABLE "ajustes" DROP COLUMN "aviso_propio_imagen_rectangulo_id";`)
}
