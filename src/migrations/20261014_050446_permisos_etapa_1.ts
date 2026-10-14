import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_usuarios_rol" AS ENUM('owner', 'administrador', 'manager', 'editor', 'periodista', 'colaborador', 'cinevision', 'comercial');
  CREATE TYPE "public"."enum_usuarios_ajuste_noticias_publicar" AS ENUM('rol', 'permitir', 'quitar');
  CREATE TYPE "public"."enum_usuarios_avisos_email" AS ENUM('al-instante', 'resumen-por-hora', 'nunca');
  CREATE TABLE "usuarios_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"secciones_id" integer
  );
  
  CREATE TABLE "secciones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" varchar,
  	"orden" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "usuarios" ADD COLUMN "rol" "enum_usuarios_rol" DEFAULT 'periodista' NOT NULL;
  ALTER TABLE "usuarios" ADD COLUMN "ajuste_noticias_publicar" "enum_usuarios_ajuste_noticias_publicar" DEFAULT 'rol';
  ALTER TABLE "usuarios" ADD COLUMN "motivo_ajuste" varchar;
  ALTER TABLE "usuarios" ADD COLUMN "activo" boolean DEFAULT true;
  ALTER TABLE "usuarios" ADD COLUMN "es_owner" boolean DEFAULT false;
  ALTER TABLE "usuarios" ADD COLUMN "recibe_avisos_revision" boolean DEFAULT false;
  ALTER TABLE "usuarios" ADD COLUMN "avisos_email" "enum_usuarios_avisos_email" DEFAULT 'al-instante';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "secciones_id" integer;
  ALTER TABLE "usuarios_rels" ADD CONSTRAINT "usuarios_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "usuarios_rels" ADD CONSTRAINT "usuarios_rels_secciones_fk" FOREIGN KEY ("secciones_id") REFERENCES "public"."secciones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "usuarios_rels_order_idx" ON "usuarios_rels" USING btree ("order");
  CREATE INDEX "usuarios_rels_parent_idx" ON "usuarios_rels" USING btree ("parent_id");
  CREATE INDEX "usuarios_rels_path_idx" ON "usuarios_rels" USING btree ("path");
  CREATE INDEX "usuarios_rels_secciones_id_idx" ON "usuarios_rels" USING btree ("secciones_id");
  CREATE UNIQUE INDEX "secciones_slug_idx" ON "secciones" USING btree ("slug");
  CREATE INDEX "secciones_updated_at_idx" ON "secciones" USING btree ("updated_at");
  CREATE INDEX "secciones_created_at_idx" ON "secciones" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_secciones_fk" FOREIGN KEY ("secciones_id") REFERENCES "public"."secciones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_secciones_id_idx" ON "payload_locked_documents_rels" USING btree ("secciones_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "usuarios_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "secciones" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "usuarios_rels" CASCADE;
  DROP TABLE "secciones" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_secciones_fk";
  
  DROP INDEX "payload_locked_documents_rels_secciones_id_idx";
  ALTER TABLE "usuarios" DROP COLUMN "rol";
  ALTER TABLE "usuarios" DROP COLUMN "ajuste_noticias_publicar";
  ALTER TABLE "usuarios" DROP COLUMN "motivo_ajuste";
  ALTER TABLE "usuarios" DROP COLUMN "activo";
  ALTER TABLE "usuarios" DROP COLUMN "es_owner";
  ALTER TABLE "usuarios" DROP COLUMN "recibe_avisos_revision";
  ALTER TABLE "usuarios" DROP COLUMN "avisos_email";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "secciones_id";
  DROP TYPE "public"."enum_usuarios_rol";
  DROP TYPE "public"."enum_usuarios_ajuste_noticias_publicar";
  DROP TYPE "public"."enum_usuarios_avisos_email";`)
}
