import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_anuncios_ubicaciones" ADD VALUE 'noticias-nota-medio' BEFORE 'noticias-nota-abajo';
  ALTER TYPE "public"."enum_anuncios_metricas_ubicacion" ADD VALUE 'noticias-nota-medio' BEFORE 'noticias-nota-abajo';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "anuncios_ubicaciones" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_anuncios_ubicaciones";
  CREATE TYPE "public"."enum_anuncios_ubicaciones" AS ENUM('inicio', 'inicio-noticias', 'inicio-cine', 'inicio-participa', 'radio-en-vivo', 'radio-en-vivo-abajo', 'radio-programacion', 'radio-programacion-abajo', 'radio-entrevistas', 'radio-entrevista', 'radio-entrevista-abajo', 'noticias-listado', 'noticias-listado-abajo', 'noticias-seccion', 'noticias-seccion-abajo', 'noticias-nota', 'noticias-nota-abajo', 'cinevision', 'cinevision-arriba', 'institucional', 'institucional-formularios');
  ALTER TABLE "anuncios_ubicaciones" ALTER COLUMN "value" SET DATA TYPE "public"."enum_anuncios_ubicaciones" USING "value"::"public"."enum_anuncios_ubicaciones";
  ALTER TABLE "anuncios_metricas" ALTER COLUMN "ubicacion" SET DATA TYPE text;
  DROP TYPE "public"."enum_anuncios_metricas_ubicacion";
  CREATE TYPE "public"."enum_anuncios_metricas_ubicacion" AS ENUM('inicio', 'inicio-noticias', 'inicio-cine', 'inicio-participa', 'radio-en-vivo', 'radio-en-vivo-abajo', 'radio-programacion', 'radio-programacion-abajo', 'radio-entrevistas', 'radio-entrevista', 'radio-entrevista-abajo', 'noticias-listado', 'noticias-listado-abajo', 'noticias-seccion', 'noticias-seccion-abajo', 'noticias-nota', 'noticias-nota-abajo', 'cinevision', 'cinevision-arriba', 'institucional', 'institucional-formularios');
  ALTER TABLE "anuncios_metricas" ALTER COLUMN "ubicacion" SET DATA TYPE "public"."enum_anuncios_metricas_ubicacion" USING "ubicacion"::"public"."enum_anuncios_metricas_ubicacion";`)
}
