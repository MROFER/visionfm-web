import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Búsqueda de texto completo en español sin distinguir tildes (docs/02-trd.md, sección 4). El índice usa
// `sin_tildes`, que envuelve a `unaccent` como inmutable: Postgres no indexa funciones que no lo son.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "noticias" ADD COLUMN "texto_busqueda" varchar;
  ALTER TABLE "_noticias_v" ADD COLUMN "version_texto_busqueda" varchar;
  ALTER TABLE "entrevistas" ADD COLUMN "texto_busqueda" varchar;
  ALTER TABLE "_entrevistas_v" ADD COLUMN "version_texto_busqueda" varchar;

  CREATE EXTENSION IF NOT EXISTS unaccent;
  CREATE OR REPLACE FUNCTION sin_tildes(text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
    AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

  UPDATE "noticias" SET "texto_busqueda" = concat_ws(E'\n', "titulo", "bajada",
    (SELECT string_agg(t #>> '{}', ' ') FROM jsonb_path_query("cuerpo", 'strict $.**.text') AS t));
  UPDATE "entrevistas" SET "texto_busqueda" = concat_ws(E'\n', "entrevistado", "tema", "resumen");

  CREATE INDEX "noticias_busqueda_idx" ON "noticias"
    USING gin (to_tsvector('spanish', sin_tildes(coalesce("texto_busqueda", ''))));
  CREATE INDEX "entrevistas_busqueda_idx" ON "entrevistas"
    USING gin (to_tsvector('spanish', sin_tildes(coalesce("texto_busqueda", ''))));`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "noticias_busqueda_idx";
  DROP INDEX IF EXISTS "entrevistas_busqueda_idx";
  DROP FUNCTION IF EXISTS sin_tildes(text);
  ALTER TABLE "noticias" DROP COLUMN "texto_busqueda";
  ALTER TABLE "_noticias_v" DROP COLUMN "version_texto_busqueda";
  ALTER TABLE "entrevistas" DROP COLUMN "texto_busqueda";
  ALTER TABLE "_entrevistas_v" DROP COLUMN "version_texto_busqueda";`)
}
