import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'inicio-noticias' BEFORE 'radio-en-vivo';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'inicio-cine' BEFORE 'radio-en-vivo';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'inicio-participa' BEFORE 'radio-en-vivo';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'radio-en-vivo-abajo' BEFORE 'radio-programacion';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'radio-programacion-abajo' BEFORE 'radio-entrevistas';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'radio-entrevista' BEFORE 'noticias-listado';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'radio-entrevista-abajo' BEFORE 'noticias-listado';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'noticias-listado-abajo' BEFORE 'noticias-seccion';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'noticias-seccion-abajo' BEFORE 'noticias-nota';
  ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'noticias-nota-abajo' BEFORE 'cinevision';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'inicio-noticias' BEFORE 'radio-en-vivo';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'inicio-cine' BEFORE 'radio-en-vivo';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'inicio-participa' BEFORE 'radio-en-vivo';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'radio-en-vivo-abajo' BEFORE 'radio-programacion';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'radio-programacion-abajo' BEFORE 'radio-entrevistas';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'radio-entrevista' BEFORE 'noticias-listado';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'radio-entrevista-abajo' BEFORE 'noticias-listado';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'noticias-listado-abajo' BEFORE 'noticias-seccion';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'noticias-seccion-abajo' BEFORE 'noticias-nota';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'noticias-nota-abajo' BEFORE 'cinevision';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "anuncios_ubicaciones" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_anuncios_ubicaciones";
  CREATE TYPE "public"."enum_anuncios_ubicaciones" AS ENUM('inicio', 'radio-en-vivo', 'radio-programacion', 'radio-entrevistas', 'noticias-listado', 'noticias-seccion', 'noticias-nota', 'cinevision', 'cinevision-arriba', 'institucional', 'institucional-formularios');
  ALTER TABLE "anuncios_ubicaciones" ALTER COLUMN "value" SET DATA TYPE "public"."enum_anuncios_ubicaciones" USING "value"::"public"."enum_anuncios_ubicaciones";
  ALTER TABLE "anuncios_metricas" ALTER COLUMN "ubicacion" SET DATA TYPE text;
  DROP TYPE "public"."enum_anuncios_metricas_ubicacion";
  CREATE TYPE "public"."enum_anuncios_metricas_ubicacion" AS ENUM('inicio', 'radio-en-vivo', 'radio-programacion', 'radio-entrevistas', 'noticias-listado', 'noticias-seccion', 'noticias-nota', 'cinevision', 'cinevision-arriba', 'institucional', 'institucional-formularios');
  ALTER TABLE "anuncios_metricas" ALTER COLUMN "ubicacion" SET DATA TYPE "public"."enum_anuncios_metricas_ubicacion" USING "ubicacion"::"public"."enum_anuncios_metricas_ubicacion";`)
}
