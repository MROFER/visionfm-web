import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_registro_actividad_accion" AS ENUM('crear', 'editar', 'borrar', 'cambiar-permisos', 'ingresar', 'salir');
  CREATE TABLE "registro_actividad" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fecha" timestamp(3) with time zone NOT NULL,
  	"quien_id" integer,
  	"accion" "enum_registro_actividad_accion" NOT NULL,
  	"resumen" varchar,
  	"coleccion" varchar,
  	"documento_id" varchar,
  	"campos" jsonb,
  	"antes" jsonb,
  	"despues" jsonb,
  	"ip" varchar,
  	"dispositivo" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "registro_actividad_id" integer;
  ALTER TABLE "registro_actividad" ADD CONSTRAINT "registro_actividad_quien_id_usuarios_id_fk" FOREIGN KEY ("quien_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "registro_actividad_fecha_idx" ON "registro_actividad" USING btree ("fecha");
  CREATE INDEX "registro_actividad_quien_idx" ON "registro_actividad" USING btree ("quien_id");
  CREATE INDEX "registro_actividad_accion_idx" ON "registro_actividad" USING btree ("accion");
  CREATE INDEX "registro_actividad_coleccion_idx" ON "registro_actividad" USING btree ("coleccion");
  CREATE INDEX "registro_actividad_documento_id_idx" ON "registro_actividad" USING btree ("documento_id");
  CREATE INDEX "registro_actividad_updated_at_idx" ON "registro_actividad" USING btree ("updated_at");
  CREATE INDEX "registro_actividad_created_at_idx" ON "registro_actividad" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_registro_actividad_fk" FOREIGN KEY ("registro_actividad_id") REFERENCES "public"."registro_actividad"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_registro_actividad_id_idx" ON "payload_locked_documents_rels" USING btree ("registro_actividad_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "registro_actividad" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "registro_actividad" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_registro_actividad_fk";
  
  DROP INDEX "payload_locked_documents_rels_registro_actividad_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "registro_actividad_id";
  DROP TYPE "public"."enum_registro_actividad_accion";`)
}
