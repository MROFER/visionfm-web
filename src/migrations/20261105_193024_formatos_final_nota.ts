import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_anuncios_formato_final_nota" AS ENUM('tira', 'cuadrado', 'ancho');
  CREATE TYPE "public"."enum_ajustes_cuadrados_final_nota" AS ENUM('1', '2', '3');
  ALTER TABLE "anuncios" ADD COLUMN "formato_final_nota" "enum_anuncios_formato_final_nota" DEFAULT 'tira';
  ALTER TABLE "anuncios" ADD COLUMN "imagen_ancha_id" integer;
  ALTER TABLE "ajustes" ADD COLUMN "cuadrados_final_nota" "enum_ajustes_cuadrados_final_nota" DEFAULT '3';
  ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_imagen_ancha_id_medios_id_fk" FOREIGN KEY ("imagen_ancha_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "anuncios_imagen_ancha_idx" ON "anuncios" USING btree ("imagen_ancha_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "anuncios" DROP CONSTRAINT "anuncios_imagen_ancha_id_medios_id_fk";
  
  DROP INDEX "anuncios_imagen_ancha_idx";
  ALTER TABLE "anuncios" DROP COLUMN "formato_final_nota";
  ALTER TABLE "anuncios" DROP COLUMN "imagen_ancha_id";
  ALTER TABLE "ajustes" DROP COLUMN "cuadrados_final_nota";
  DROP TYPE "public"."enum_anuncios_formato_final_nota";
  DROP TYPE "public"."enum_ajustes_cuadrados_final_nota";`)
}
