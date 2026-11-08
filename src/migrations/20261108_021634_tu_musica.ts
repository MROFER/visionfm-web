import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_mensajes_tipo" ADD VALUE 'musica';
  ALTER TABLE "institucional" ADD COLUMN "tu_musica" jsonb;
  ALTER TABLE "ajustes" ADD COLUMN "emails_formularios_musica" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mensajes" ALTER COLUMN "tipo" SET DATA TYPE text;
  DROP TYPE "public"."enum_mensajes_tipo";
  CREATE TYPE "public"."enum_mensajes_tipo" AS ENUM('contacto', 'sumarse', 'tarifas');
  ALTER TABLE "mensajes" ALTER COLUMN "tipo" SET DATA TYPE "public"."enum_mensajes_tipo" USING "tipo"::"public"."enum_mensajes_tipo";
  ALTER TABLE "institucional" DROP COLUMN "tu_musica";
  ALTER TABLE "ajustes" DROP COLUMN "emails_formularios_musica";`)
}
