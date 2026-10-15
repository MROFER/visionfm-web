import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'cinevision' BEFORE 'institucional';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'cinevision' BEFORE 'institucional';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "anuncios_ubicaciones" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_anuncios_ubicaciones";
  CREATE TYPE "public"."enum_anuncios_ubicaciones" AS ENUM('inicio', 'radio-en-vivo', 'radio-programacion', 'radio-entrevistas', 'noticias-listado', 'noticias-seccion', 'noticias-nota', 'institucional', 'institucional-formularios');
  ALTER TABLE "anuncios_ubicaciones" ALTER COLUMN "value" SET DATA TYPE "public"."enum_anuncios_ubicaciones" USING "value"::"public"."enum_anuncios_ubicaciones";
  ALTER TABLE "anuncios_metricas" ALTER COLUMN "ubicacion" SET DATA TYPE text;
  DROP TYPE "public"."enum_anuncios_metricas_ubicacion";
  CREATE TYPE "public"."enum_anuncios_metricas_ubicacion" AS ENUM('inicio', 'radio-en-vivo', 'radio-programacion', 'radio-entrevistas', 'noticias-listado', 'noticias-seccion', 'noticias-nota', 'institucional', 'institucional-formularios');
  ALTER TABLE "anuncios_metricas" ALTER COLUMN "ubicacion" SET DATA TYPE "public"."enum_anuncios_metricas_ubicacion" USING "ubicacion"::"public"."enum_anuncios_metricas_ubicacion";`)
}
