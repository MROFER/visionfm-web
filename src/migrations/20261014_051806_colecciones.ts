import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_noticias_estado_editorial" AS ENUM('borrador', 'en-revision', 'devuelta', 'aprobada', 'publicada');
  CREATE TYPE "public"."enum_noticias_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__noticias_v_version_estado_editorial" AS ENUM('borrador', 'en-revision', 'devuelta', 'aprobada', 'publicada');
  CREATE TYPE "public"."enum__noticias_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_entrevistas_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__entrevistas_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_programas_horarios_dias" AS ENUM('lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom');
  CREATE TYPE "public"."enum_equipo_redes_red" AS ENUM('instagram', 'facebook', 'x', 'youtube', 'tiktok', 'linkedin', 'web');
  CREATE TYPE "public"."enum_equipo_grupo" AS ENUM('direccion', 'produccion-general', 'conduccion', 'columnistas', 'tecnico');
  CREATE TYPE "public"."enum_peliculas_idiomas" AS ENUM('subtitulada', 'doblada');
  CREATE TYPE "public"."enum_peliculas_formatos" AS ENUM('2d', '3d');
  CREATE TYPE "public"."enum_peliculas_calificacion" AS ENUM('atp', '7', '13', '16', '18');
  CREATE TYPE "public"."enum_peliculas_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__peliculas_v_version_idiomas" AS ENUM('subtitulada', 'doblada');
  CREATE TYPE "public"."enum__peliculas_v_version_formatos" AS ENUM('2d', '3d');
  CREATE TYPE "public"."enum__peliculas_v_version_calificacion" AS ENUM('atp', '7', '13', '16', '18');
  CREATE TYPE "public"."enum__peliculas_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_funciones_idioma" AS ENUM('subtitulada', 'doblada');
  CREATE TYPE "public"."enum_funciones_formato" AS ENUM('2d', '3d');
  CREATE TYPE "public"."enum_anuncios_ubicaciones" AS ENUM('inicio', 'radio-en-vivo', 'radio-programacion', 'radio-entrevistas', 'noticias-listado', 'noticias-seccion', 'noticias-nota', 'institucional', 'institucional-formularios');
  CREATE TYPE "public"."enum_anuncios_metricas_ubicacion" AS ENUM('inicio', 'radio-en-vivo', 'radio-programacion', 'radio-entrevistas', 'noticias-listado', 'noticias-seccion', 'noticias-nota', 'institucional', 'institucional-formularios');
  CREATE TYPE "public"."enum_mensajes_tipo" AS ENUM('contacto', 'sumarse', 'tarifas');
  CREATE TYPE "public"."enum_mensajes_estado" AS ENUM('nuevo', 'leido', 'respondido');
  CREATE TYPE "public"."enum_paginas_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__paginas_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_redirecciones_tipo" AS ENUM('301', '302', '410');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_ajustes_redes_red" AS ENUM('instagram', 'facebook', 'x', 'youtube', 'tiktok', 'whatsapp');
  CREATE TABLE "noticias" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar,
  	"slug" varchar,
  	"bajada" varchar,
  	"cuerpo" jsonb,
  	"foto_id" integer,
  	"epigrafe" varchar,
  	"seccion_id" integer,
  	"autor_id" integer,
  	"fecha_publicacion" timestamp(3) with time zone,
  	"fecha_actualizacion" timestamp(3) with time zone,
  	"estado_editorial" "enum_noticias_estado_editorial" DEFAULT 'borrador',
  	"comentario_editor" varchar,
  	"aprobado_por_id" integer,
  	"publicado_por_id" integer,
  	"destacada" boolean,
  	"seo_titulo" varchar,
  	"seo_descripcion" varchar,
  	"seo_imagen_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_noticias_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_noticias_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titulo" varchar,
  	"version_slug" varchar,
  	"version_bajada" varchar,
  	"version_cuerpo" jsonb,
  	"version_foto_id" integer,
  	"version_epigrafe" varchar,
  	"version_seccion_id" integer,
  	"version_autor_id" integer,
  	"version_fecha_publicacion" timestamp(3) with time zone,
  	"version_fecha_actualizacion" timestamp(3) with time zone,
  	"version_estado_editorial" "enum__noticias_v_version_estado_editorial" DEFAULT 'borrador',
  	"version_comentario_editor" varchar,
  	"version_aprobado_por_id" integer,
  	"version_publicado_por_id" integer,
  	"version_destacada" boolean,
  	"version_seo_titulo" varchar,
  	"version_seo_descripcion" varchar,
  	"version_seo_imagen_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__noticias_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "entrevistas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"entrevistado" varchar,
  	"tema" varchar,
  	"slug" varchar,
  	"programa_id" integer,
  	"fecha" timestamp(3) with time zone,
  	"audio_id" integer,
  	"duracion" numeric,
  	"foto_id" integer,
  	"resumen" varchar,
  	"destacada" boolean,
  	"autor_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_entrevistas_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_entrevistas_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_entrevistado" varchar,
  	"version_tema" varchar,
  	"version_slug" varchar,
  	"version_programa_id" integer,
  	"version_fecha" timestamp(3) with time zone,
  	"version_audio_id" integer,
  	"version_duracion" numeric,
  	"version_foto_id" integer,
  	"version_resumen" varchar,
  	"version_destacada" boolean,
  	"version_autor_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__entrevistas_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "programas_horarios_dias" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_programas_horarios_dias",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "programas_horarios" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"inicio" varchar NOT NULL,
  	"fin" varchar NOT NULL
  );
  
  CREATE TABLE "programas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" varchar,
  	"foto_id" integer,
  	"activo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "programas_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"equipo_id" integer
  );
  
  CREATE TABLE "excepciones_grilla" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fecha" timestamp(3) with time zone NOT NULL,
  	"inicio" varchar NOT NULL,
  	"fin" varchar NOT NULL,
  	"programa_id" integer,
  	"titulo" varchar,
  	"conduccion" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipo_redes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"red" "enum_equipo_redes_red" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "equipo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"rol" varchar NOT NULL,
  	"grupo" "enum_equipo_grupo" NOT NULL,
  	"foto_id" integer,
  	"bio" varchar,
  	"orden" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "peliculas_idiomas" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_peliculas_idiomas",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "peliculas_formatos" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_peliculas_formatos",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "peliculas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar,
  	"slug" varchar,
  	"titulo_original" varchar,
  	"anio" numeric,
  	"genero" varchar,
  	"duracion" numeric,
  	"calificacion" "enum_peliculas_calificacion",
  	"sinopsis" varchar,
  	"afiche_id" integer,
  	"trailer" varchar,
  	"creditos_direccion" varchar,
  	"creditos_reparto" varchar,
  	"creditos_guion" varchar,
  	"creditos_pais" varchar,
  	"creditos_idioma_original" varchar,
  	"creditos_distribuidora" varchar,
  	"es_estreno" boolean,
  	"fecha_estreno" timestamp(3) with time zone,
  	"seo_titulo" varchar,
  	"seo_descripcion" varchar,
  	"seo_imagen_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_peliculas_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_peliculas_v_version_idiomas" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__peliculas_v_version_idiomas",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_peliculas_v_version_formatos" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__peliculas_v_version_formatos",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_peliculas_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titulo" varchar,
  	"version_slug" varchar,
  	"version_titulo_original" varchar,
  	"version_anio" numeric,
  	"version_genero" varchar,
  	"version_duracion" numeric,
  	"version_calificacion" "enum__peliculas_v_version_calificacion",
  	"version_sinopsis" varchar,
  	"version_afiche_id" integer,
  	"version_trailer" varchar,
  	"version_creditos_direccion" varchar,
  	"version_creditos_reparto" varchar,
  	"version_creditos_guion" varchar,
  	"version_creditos_pais" varchar,
  	"version_creditos_idioma_original" varchar,
  	"version_creditos_distribuidora" varchar,
  	"version_es_estreno" boolean,
  	"version_fecha_estreno" timestamp(3) with time zone,
  	"version_seo_titulo" varchar,
  	"version_seo_descripcion" varchar,
  	"version_seo_imagen_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__peliculas_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "funciones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pelicula_id" integer NOT NULL,
  	"fecha_hora" timestamp(3) with time zone NOT NULL,
  	"idioma" "enum_funciones_idioma" NOT NULL,
  	"formato" "enum_funciones_formato" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "anuncios_ubicaciones" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_anuncios_ubicaciones",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "anuncios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"anunciante" varchar NOT NULL,
  	"email_reporte" varchar,
  	"imagen_web_id" integer NOT NULL,
  	"imagen_movil_id" integer NOT NULL,
  	"link" varchar,
  	"desde" timestamp(3) with time zone NOT NULL,
  	"hasta" timestamp(3) with time zone NOT NULL,
  	"peso" numeric DEFAULT 1,
  	"activo" boolean DEFAULT true,
  	"impresiones" numeric DEFAULT 0,
  	"clics" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "anuncios_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"secciones_id" integer
  );
  
  CREATE TABLE "anuncios_metricas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"anuncio_id" integer NOT NULL,
  	"ubicacion" "enum_anuncios_metricas_ubicacion" NOT NULL,
  	"fecha" timestamp(3) with time zone NOT NULL,
  	"impresiones" numeric DEFAULT 0 NOT NULL,
  	"clics" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "mensajes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tipo" "enum_mensajes_tipo" NOT NULL,
  	"nombre" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"telefono" varchar,
  	"datos" jsonb,
  	"mensaje" varchar,
  	"adjunto_id" integer,
  	"estado" "enum_mensajes_estado" DEFAULT 'nuevo' NOT NULL,
  	"consentimiento_aceptado" boolean DEFAULT false NOT NULL,
  	"consentimiento_fecha" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "paginas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar,
  	"slug" varchar,
  	"cuerpo" jsonb,
  	"seo_titulo" varchar,
  	"seo_descripcion" varchar,
  	"seo_imagen_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_paginas_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_paginas_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titulo" varchar,
  	"version_slug" varchar,
  	"version_cuerpo" jsonb,
  	"version_seo_titulo" varchar,
  	"version_seo_descripcion" varchar,
  	"version_seo_imagen_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__paginas_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "archivos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"descripcion" varchar,
  	"privado" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "redirecciones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"desde" varchar NOT NULL,
  	"hacia" varchar,
  	"tipo" "enum_redirecciones_tipo" DEFAULT '301' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "portada" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nota_destacada_id" integer,
  	"pelicula_destacada_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cinevision_carrusel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagen_web_id" integer NOT NULL,
  	"imagen_movil_id" integer NOT NULL,
  	"alt" varchar NOT NULL,
  	"link" varchar,
  	"orden" numeric DEFAULT 0
  );
  
  CREATE TABLE "cinevision_precios" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"concepto" varchar NOT NULL,
  	"precio" varchar NOT NULL
  );
  
  CREATE TABLE "cinevision_promociones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"detalle" varchar
  );
  
  CREATE TABLE "cinevision" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"como_se_compran" varchar,
  	"como_llegar_direccion" varchar,
  	"como_llegar_mapa_imagen_id" integer,
  	"como_llegar_mapa_link" varchar,
  	"como_llegar_telefono" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "institucional_hitos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"anio" numeric NOT NULL,
  	"titulo" varchar NOT NULL,
  	"texto" varchar
  );
  
  CREATE TABLE "institucional" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quienes_somos" jsonb,
  	"ser_parte" jsonb,
  	"publicidad" jsonb,
  	"kit_comercial_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ajustes_redes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"red" "enum_ajustes_redes_red" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "ajustes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stream_url" varchar NOT NULL,
  	"telefono" varchar NOT NULL,
  	"whatsapp" varchar NOT NULL,
  	"direccion" varchar,
  	"email" varchar,
  	"emails_formularios_contacto" varchar,
  	"emails_formularios_sumarse" varchar,
  	"emails_formularios_tarifas" varchar,
  	"aviso_propio_imagen_web_id" integer,
  	"aviso_propio_imagen_movil_id" integer,
  	"aviso_propio_link" varchar DEFAULT '/institucional/publicidad',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "usuarios" ADD COLUMN "equipo_id" integer;
  ALTER TABLE "medios" ADD COLUMN "sizes_w320_url" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w320_width" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w320_height" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w320_mime_type" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w320_filesize" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w320_filename" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w640_url" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w640_width" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w640_height" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w640_mime_type" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w640_filesize" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w640_filename" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w960_url" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w960_width" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w960_height" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w960_mime_type" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w960_filesize" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w960_filename" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1280_url" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1280_width" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1280_height" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1280_mime_type" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1280_filesize" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1280_filename" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1920_url" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1920_width" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1920_height" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1920_mime_type" varchar;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1920_filesize" numeric;
  ALTER TABLE "medios" ADD COLUMN "sizes_w1920_filename" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "noticias_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "entrevistas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "programas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "excepciones_grilla_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "equipo_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "peliculas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "funciones_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "anuncios_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "anuncios_metricas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "mensajes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "paginas_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "archivos_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "redirecciones_id" integer;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_foto_id_medios_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_seccion_id_secciones_id_fk" FOREIGN KEY ("seccion_id") REFERENCES "public"."secciones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_aprobado_por_id_usuarios_id_fk" FOREIGN KEY ("aprobado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_publicado_por_id_usuarios_id_fk" FOREIGN KEY ("publicado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "noticias" ADD CONSTRAINT "noticias_seo_imagen_id_medios_id_fk" FOREIGN KEY ("seo_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_parent_id_noticias_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."noticias"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_version_foto_id_medios_id_fk" FOREIGN KEY ("version_foto_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_version_seccion_id_secciones_id_fk" FOREIGN KEY ("version_seccion_id") REFERENCES "public"."secciones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_version_autor_id_usuarios_id_fk" FOREIGN KEY ("version_autor_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_version_aprobado_por_id_usuarios_id_fk" FOREIGN KEY ("version_aprobado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_version_publicado_por_id_usuarios_id_fk" FOREIGN KEY ("version_publicado_por_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_noticias_v" ADD CONSTRAINT "_noticias_v_version_seo_imagen_id_medios_id_fk" FOREIGN KEY ("version_seo_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_programa_id_programas_id_fk" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_audio_id_archivos_id_fk" FOREIGN KEY ("audio_id") REFERENCES "public"."archivos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_foto_id_medios_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "entrevistas" ADD CONSTRAINT "entrevistas_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_entrevistas_v" ADD CONSTRAINT "_entrevistas_v_parent_id_entrevistas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."entrevistas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_entrevistas_v" ADD CONSTRAINT "_entrevistas_v_version_programa_id_programas_id_fk" FOREIGN KEY ("version_programa_id") REFERENCES "public"."programas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_entrevistas_v" ADD CONSTRAINT "_entrevistas_v_version_audio_id_archivos_id_fk" FOREIGN KEY ("version_audio_id") REFERENCES "public"."archivos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_entrevistas_v" ADD CONSTRAINT "_entrevistas_v_version_foto_id_medios_id_fk" FOREIGN KEY ("version_foto_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_entrevistas_v" ADD CONSTRAINT "_entrevistas_v_version_autor_id_usuarios_id_fk" FOREIGN KEY ("version_autor_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programas_horarios_dias" ADD CONSTRAINT "programas_horarios_dias_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."programas_horarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programas_horarios" ADD CONSTRAINT "programas_horarios_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programas" ADD CONSTRAINT "programas_foto_id_medios_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "programas_rels" ADD CONSTRAINT "programas_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."programas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programas_rels" ADD CONSTRAINT "programas_rels_equipo_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "excepciones_grilla" ADD CONSTRAINT "excepciones_grilla_programa_id_programas_id_fk" FOREIGN KEY ("programa_id") REFERENCES "public"."programas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipo_redes" ADD CONSTRAINT "equipo_redes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipo" ADD CONSTRAINT "equipo_foto_id_medios_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "peliculas_idiomas" ADD CONSTRAINT "peliculas_idiomas_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."peliculas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "peliculas_formatos" ADD CONSTRAINT "peliculas_formatos_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."peliculas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "peliculas" ADD CONSTRAINT "peliculas_afiche_id_medios_id_fk" FOREIGN KEY ("afiche_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "peliculas" ADD CONSTRAINT "peliculas_seo_imagen_id_medios_id_fk" FOREIGN KEY ("seo_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_peliculas_v_version_idiomas" ADD CONSTRAINT "_peliculas_v_version_idiomas_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_peliculas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_peliculas_v_version_formatos" ADD CONSTRAINT "_peliculas_v_version_formatos_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_peliculas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_peliculas_v" ADD CONSTRAINT "_peliculas_v_parent_id_peliculas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."peliculas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_peliculas_v" ADD CONSTRAINT "_peliculas_v_version_afiche_id_medios_id_fk" FOREIGN KEY ("version_afiche_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_peliculas_v" ADD CONSTRAINT "_peliculas_v_version_seo_imagen_id_medios_id_fk" FOREIGN KEY ("version_seo_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "funciones" ADD CONSTRAINT "funciones_pelicula_id_peliculas_id_fk" FOREIGN KEY ("pelicula_id") REFERENCES "public"."peliculas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "anuncios_ubicaciones" ADD CONSTRAINT "anuncios_ubicaciones_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."anuncios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_imagen_web_id_medios_id_fk" FOREIGN KEY ("imagen_web_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "anuncios" ADD CONSTRAINT "anuncios_imagen_movil_id_medios_id_fk" FOREIGN KEY ("imagen_movil_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "anuncios_rels" ADD CONSTRAINT "anuncios_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."anuncios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "anuncios_rels" ADD CONSTRAINT "anuncios_rels_secciones_fk" FOREIGN KEY ("secciones_id") REFERENCES "public"."secciones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "anuncios_metricas" ADD CONSTRAINT "anuncios_metricas_anuncio_id_anuncios_id_fk" FOREIGN KEY ("anuncio_id") REFERENCES "public"."anuncios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mensajes" ADD CONSTRAINT "mensajes_adjunto_id_archivos_id_fk" FOREIGN KEY ("adjunto_id") REFERENCES "public"."archivos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seo_imagen_id_medios_id_fk" FOREIGN KEY ("seo_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_parent_id_paginas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."paginas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seo_imagen_id_medios_id_fk" FOREIGN KEY ("version_seo_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "portada" ADD CONSTRAINT "portada_nota_destacada_id_noticias_id_fk" FOREIGN KEY ("nota_destacada_id") REFERENCES "public"."noticias"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "portada" ADD CONSTRAINT "portada_pelicula_destacada_id_peliculas_id_fk" FOREIGN KEY ("pelicula_destacada_id") REFERENCES "public"."peliculas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cinevision_carrusel" ADD CONSTRAINT "cinevision_carrusel_imagen_web_id_medios_id_fk" FOREIGN KEY ("imagen_web_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cinevision_carrusel" ADD CONSTRAINT "cinevision_carrusel_imagen_movil_id_medios_id_fk" FOREIGN KEY ("imagen_movil_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cinevision_carrusel" ADD CONSTRAINT "cinevision_carrusel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cinevision"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cinevision_precios" ADD CONSTRAINT "cinevision_precios_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cinevision"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cinevision_promociones" ADD CONSTRAINT "cinevision_promociones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cinevision"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cinevision" ADD CONSTRAINT "cinevision_como_llegar_mapa_imagen_id_medios_id_fk" FOREIGN KEY ("como_llegar_mapa_imagen_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "institucional_hitos" ADD CONSTRAINT "institucional_hitos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."institucional"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "institucional" ADD CONSTRAINT "institucional_kit_comercial_id_archivos_id_fk" FOREIGN KEY ("kit_comercial_id") REFERENCES "public"."archivos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ajustes_redes" ADD CONSTRAINT "ajustes_redes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ajustes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ajustes" ADD CONSTRAINT "ajustes_aviso_propio_imagen_web_id_medios_id_fk" FOREIGN KEY ("aviso_propio_imagen_web_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ajustes" ADD CONSTRAINT "ajustes_aviso_propio_imagen_movil_id_medios_id_fk" FOREIGN KEY ("aviso_propio_imagen_movil_id") REFERENCES "public"."medios"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "noticias_slug_idx" ON "noticias" USING btree ("slug");
  CREATE INDEX "noticias_foto_idx" ON "noticias" USING btree ("foto_id");
  CREATE INDEX "noticias_seccion_idx" ON "noticias" USING btree ("seccion_id");
  CREATE INDEX "noticias_autor_idx" ON "noticias" USING btree ("autor_id");
  CREATE INDEX "noticias_fecha_publicacion_idx" ON "noticias" USING btree ("fecha_publicacion");
  CREATE INDEX "noticias_estado_editorial_idx" ON "noticias" USING btree ("estado_editorial");
  CREATE INDEX "noticias_aprobado_por_idx" ON "noticias" USING btree ("aprobado_por_id");
  CREATE INDEX "noticias_publicado_por_idx" ON "noticias" USING btree ("publicado_por_id");
  CREATE INDEX "noticias_seo_seo_imagen_idx" ON "noticias" USING btree ("seo_imagen_id");
  CREATE INDEX "noticias_updated_at_idx" ON "noticias" USING btree ("updated_at");
  CREATE INDEX "noticias_created_at_idx" ON "noticias" USING btree ("created_at");
  CREATE INDEX "noticias__status_idx" ON "noticias" USING btree ("_status");
  CREATE UNIQUE INDEX "seccion_slug_idx" ON "noticias" USING btree ("seccion_id","slug");
  CREATE INDEX "seccion_fechaPublicacion_idx" ON "noticias" USING btree ("seccion_id","fecha_publicacion");
  CREATE INDEX "_noticias_v_parent_idx" ON "_noticias_v" USING btree ("parent_id");
  CREATE INDEX "_noticias_v_version_version_slug_idx" ON "_noticias_v" USING btree ("version_slug");
  CREATE INDEX "_noticias_v_version_version_foto_idx" ON "_noticias_v" USING btree ("version_foto_id");
  CREATE INDEX "_noticias_v_version_version_seccion_idx" ON "_noticias_v" USING btree ("version_seccion_id");
  CREATE INDEX "_noticias_v_version_version_autor_idx" ON "_noticias_v" USING btree ("version_autor_id");
  CREATE INDEX "_noticias_v_version_version_fecha_publicacion_idx" ON "_noticias_v" USING btree ("version_fecha_publicacion");
  CREATE INDEX "_noticias_v_version_version_estado_editorial_idx" ON "_noticias_v" USING btree ("version_estado_editorial");
  CREATE INDEX "_noticias_v_version_version_aprobado_por_idx" ON "_noticias_v" USING btree ("version_aprobado_por_id");
  CREATE INDEX "_noticias_v_version_version_publicado_por_idx" ON "_noticias_v" USING btree ("version_publicado_por_id");
  CREATE INDEX "_noticias_v_version_seo_version_seo_imagen_idx" ON "_noticias_v" USING btree ("version_seo_imagen_id");
  CREATE INDEX "_noticias_v_version_version_updated_at_idx" ON "_noticias_v" USING btree ("version_updated_at");
  CREATE INDEX "_noticias_v_version_version_created_at_idx" ON "_noticias_v" USING btree ("version_created_at");
  CREATE INDEX "_noticias_v_version_version__status_idx" ON "_noticias_v" USING btree ("version__status");
  CREATE INDEX "_noticias_v_created_at_idx" ON "_noticias_v" USING btree ("created_at");
  CREATE INDEX "_noticias_v_updated_at_idx" ON "_noticias_v" USING btree ("updated_at");
  CREATE INDEX "_noticias_v_latest_idx" ON "_noticias_v" USING btree ("latest");
  CREATE INDEX "version_seccion_version_slug_idx" ON "_noticias_v" USING btree ("version_seccion_id","version_slug");
  CREATE INDEX "version_seccion_version_fechaPublicacion_idx" ON "_noticias_v" USING btree ("version_seccion_id","version_fecha_publicacion");
  CREATE UNIQUE INDEX "entrevistas_slug_idx" ON "entrevistas" USING btree ("slug");
  CREATE INDEX "entrevistas_programa_idx" ON "entrevistas" USING btree ("programa_id");
  CREATE INDEX "entrevistas_fecha_idx" ON "entrevistas" USING btree ("fecha");
  CREATE INDEX "entrevistas_audio_idx" ON "entrevistas" USING btree ("audio_id");
  CREATE INDEX "entrevistas_foto_idx" ON "entrevistas" USING btree ("foto_id");
  CREATE INDEX "entrevistas_autor_idx" ON "entrevistas" USING btree ("autor_id");
  CREATE INDEX "entrevistas_updated_at_idx" ON "entrevistas" USING btree ("updated_at");
  CREATE INDEX "entrevistas_created_at_idx" ON "entrevistas" USING btree ("created_at");
  CREATE INDEX "entrevistas__status_idx" ON "entrevistas" USING btree ("_status");
  CREATE INDEX "_entrevistas_v_parent_idx" ON "_entrevistas_v" USING btree ("parent_id");
  CREATE INDEX "_entrevistas_v_version_version_slug_idx" ON "_entrevistas_v" USING btree ("version_slug");
  CREATE INDEX "_entrevistas_v_version_version_programa_idx" ON "_entrevistas_v" USING btree ("version_programa_id");
  CREATE INDEX "_entrevistas_v_version_version_fecha_idx" ON "_entrevistas_v" USING btree ("version_fecha");
  CREATE INDEX "_entrevistas_v_version_version_audio_idx" ON "_entrevistas_v" USING btree ("version_audio_id");
  CREATE INDEX "_entrevistas_v_version_version_foto_idx" ON "_entrevistas_v" USING btree ("version_foto_id");
  CREATE INDEX "_entrevistas_v_version_version_autor_idx" ON "_entrevistas_v" USING btree ("version_autor_id");
  CREATE INDEX "_entrevistas_v_version_version_updated_at_idx" ON "_entrevistas_v" USING btree ("version_updated_at");
  CREATE INDEX "_entrevistas_v_version_version_created_at_idx" ON "_entrevistas_v" USING btree ("version_created_at");
  CREATE INDEX "_entrevistas_v_version_version__status_idx" ON "_entrevistas_v" USING btree ("version__status");
  CREATE INDEX "_entrevistas_v_created_at_idx" ON "_entrevistas_v" USING btree ("created_at");
  CREATE INDEX "_entrevistas_v_updated_at_idx" ON "_entrevistas_v" USING btree ("updated_at");
  CREATE INDEX "_entrevistas_v_latest_idx" ON "_entrevistas_v" USING btree ("latest");
  CREATE INDEX "programas_horarios_dias_order_idx" ON "programas_horarios_dias" USING btree ("order");
  CREATE INDEX "programas_horarios_dias_parent_idx" ON "programas_horarios_dias" USING btree ("parent_id");
  CREATE INDEX "programas_horarios_order_idx" ON "programas_horarios" USING btree ("_order");
  CREATE INDEX "programas_horarios_parent_id_idx" ON "programas_horarios" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "programas_slug_idx" ON "programas" USING btree ("slug");
  CREATE INDEX "programas_foto_idx" ON "programas" USING btree ("foto_id");
  CREATE INDEX "programas_updated_at_idx" ON "programas" USING btree ("updated_at");
  CREATE INDEX "programas_created_at_idx" ON "programas" USING btree ("created_at");
  CREATE INDEX "programas_rels_order_idx" ON "programas_rels" USING btree ("order");
  CREATE INDEX "programas_rels_parent_idx" ON "programas_rels" USING btree ("parent_id");
  CREATE INDEX "programas_rels_path_idx" ON "programas_rels" USING btree ("path");
  CREATE INDEX "programas_rels_equipo_id_idx" ON "programas_rels" USING btree ("equipo_id");
  CREATE INDEX "excepciones_grilla_fecha_idx" ON "excepciones_grilla" USING btree ("fecha");
  CREATE INDEX "excepciones_grilla_programa_idx" ON "excepciones_grilla" USING btree ("programa_id");
  CREATE INDEX "excepciones_grilla_updated_at_idx" ON "excepciones_grilla" USING btree ("updated_at");
  CREATE INDEX "excepciones_grilla_created_at_idx" ON "excepciones_grilla" USING btree ("created_at");
  CREATE INDEX "equipo_redes_order_idx" ON "equipo_redes" USING btree ("_order");
  CREATE INDEX "equipo_redes_parent_id_idx" ON "equipo_redes" USING btree ("_parent_id");
  CREATE INDEX "equipo_foto_idx" ON "equipo" USING btree ("foto_id");
  CREATE INDEX "equipo_updated_at_idx" ON "equipo" USING btree ("updated_at");
  CREATE INDEX "equipo_created_at_idx" ON "equipo" USING btree ("created_at");
  CREATE INDEX "peliculas_idiomas_order_idx" ON "peliculas_idiomas" USING btree ("order");
  CREATE INDEX "peliculas_idiomas_parent_idx" ON "peliculas_idiomas" USING btree ("parent_id");
  CREATE INDEX "peliculas_formatos_order_idx" ON "peliculas_formatos" USING btree ("order");
  CREATE INDEX "peliculas_formatos_parent_idx" ON "peliculas_formatos" USING btree ("parent_id");
  CREATE UNIQUE INDEX "peliculas_slug_idx" ON "peliculas" USING btree ("slug");
  CREATE INDEX "peliculas_afiche_idx" ON "peliculas" USING btree ("afiche_id");
  CREATE INDEX "peliculas_seo_seo_imagen_idx" ON "peliculas" USING btree ("seo_imagen_id");
  CREATE INDEX "peliculas_updated_at_idx" ON "peliculas" USING btree ("updated_at");
  CREATE INDEX "peliculas_created_at_idx" ON "peliculas" USING btree ("created_at");
  CREATE INDEX "peliculas__status_idx" ON "peliculas" USING btree ("_status");
  CREATE INDEX "_peliculas_v_version_idiomas_order_idx" ON "_peliculas_v_version_idiomas" USING btree ("order");
  CREATE INDEX "_peliculas_v_version_idiomas_parent_idx" ON "_peliculas_v_version_idiomas" USING btree ("parent_id");
  CREATE INDEX "_peliculas_v_version_formatos_order_idx" ON "_peliculas_v_version_formatos" USING btree ("order");
  CREATE INDEX "_peliculas_v_version_formatos_parent_idx" ON "_peliculas_v_version_formatos" USING btree ("parent_id");
  CREATE INDEX "_peliculas_v_parent_idx" ON "_peliculas_v" USING btree ("parent_id");
  CREATE INDEX "_peliculas_v_version_version_slug_idx" ON "_peliculas_v" USING btree ("version_slug");
  CREATE INDEX "_peliculas_v_version_version_afiche_idx" ON "_peliculas_v" USING btree ("version_afiche_id");
  CREATE INDEX "_peliculas_v_version_seo_version_seo_imagen_idx" ON "_peliculas_v" USING btree ("version_seo_imagen_id");
  CREATE INDEX "_peliculas_v_version_version_updated_at_idx" ON "_peliculas_v" USING btree ("version_updated_at");
  CREATE INDEX "_peliculas_v_version_version_created_at_idx" ON "_peliculas_v" USING btree ("version_created_at");
  CREATE INDEX "_peliculas_v_version_version__status_idx" ON "_peliculas_v" USING btree ("version__status");
  CREATE INDEX "_peliculas_v_created_at_idx" ON "_peliculas_v" USING btree ("created_at");
  CREATE INDEX "_peliculas_v_updated_at_idx" ON "_peliculas_v" USING btree ("updated_at");
  CREATE INDEX "_peliculas_v_latest_idx" ON "_peliculas_v" USING btree ("latest");
  CREATE INDEX "funciones_pelicula_idx" ON "funciones" USING btree ("pelicula_id");
  CREATE INDEX "funciones_fecha_hora_idx" ON "funciones" USING btree ("fecha_hora");
  CREATE INDEX "funciones_updated_at_idx" ON "funciones" USING btree ("updated_at");
  CREATE INDEX "funciones_created_at_idx" ON "funciones" USING btree ("created_at");
  CREATE INDEX "pelicula_fechaHora_idx" ON "funciones" USING btree ("pelicula_id","fecha_hora");
  CREATE INDEX "anuncios_ubicaciones_order_idx" ON "anuncios_ubicaciones" USING btree ("order");
  CREATE INDEX "anuncios_ubicaciones_parent_idx" ON "anuncios_ubicaciones" USING btree ("parent_id");
  CREATE INDEX "anuncios_anunciante_idx" ON "anuncios" USING btree ("anunciante");
  CREATE INDEX "anuncios_imagen_web_idx" ON "anuncios" USING btree ("imagen_web_id");
  CREATE INDEX "anuncios_imagen_movil_idx" ON "anuncios" USING btree ("imagen_movil_id");
  CREATE INDEX "anuncios_desde_idx" ON "anuncios" USING btree ("desde");
  CREATE INDEX "anuncios_hasta_idx" ON "anuncios" USING btree ("hasta");
  CREATE INDEX "anuncios_updated_at_idx" ON "anuncios" USING btree ("updated_at");
  CREATE INDEX "anuncios_created_at_idx" ON "anuncios" USING btree ("created_at");
  CREATE INDEX "anuncios_rels_order_idx" ON "anuncios_rels" USING btree ("order");
  CREATE INDEX "anuncios_rels_parent_idx" ON "anuncios_rels" USING btree ("parent_id");
  CREATE INDEX "anuncios_rels_path_idx" ON "anuncios_rels" USING btree ("path");
  CREATE INDEX "anuncios_rels_secciones_id_idx" ON "anuncios_rels" USING btree ("secciones_id");
  CREATE INDEX "anuncios_metricas_anuncio_idx" ON "anuncios_metricas" USING btree ("anuncio_id");
  CREATE INDEX "anuncios_metricas_fecha_idx" ON "anuncios_metricas" USING btree ("fecha");
  CREATE INDEX "anuncios_metricas_updated_at_idx" ON "anuncios_metricas" USING btree ("updated_at");
  CREATE INDEX "anuncios_metricas_created_at_idx" ON "anuncios_metricas" USING btree ("created_at");
  CREATE UNIQUE INDEX "anuncio_ubicacion_fecha_idx" ON "anuncios_metricas" USING btree ("anuncio_id","ubicacion","fecha");
  CREATE INDEX "mensajes_tipo_idx" ON "mensajes" USING btree ("tipo");
  CREATE INDEX "mensajes_adjunto_idx" ON "mensajes" USING btree ("adjunto_id");
  CREATE INDEX "mensajes_estado_idx" ON "mensajes" USING btree ("estado");
  CREATE INDEX "mensajes_updated_at_idx" ON "mensajes" USING btree ("updated_at");
  CREATE INDEX "mensajes_created_at_idx" ON "mensajes" USING btree ("created_at");
  CREATE UNIQUE INDEX "paginas_slug_idx" ON "paginas" USING btree ("slug");
  CREATE INDEX "paginas_seo_seo_imagen_idx" ON "paginas" USING btree ("seo_imagen_id");
  CREATE INDEX "paginas_updated_at_idx" ON "paginas" USING btree ("updated_at");
  CREATE INDEX "paginas_created_at_idx" ON "paginas" USING btree ("created_at");
  CREATE INDEX "paginas__status_idx" ON "paginas" USING btree ("_status");
  CREATE INDEX "_paginas_v_parent_idx" ON "_paginas_v" USING btree ("parent_id");
  CREATE INDEX "_paginas_v_version_version_slug_idx" ON "_paginas_v" USING btree ("version_slug");
  CREATE INDEX "_paginas_v_version_seo_version_seo_imagen_idx" ON "_paginas_v" USING btree ("version_seo_imagen_id");
  CREATE INDEX "_paginas_v_version_version_updated_at_idx" ON "_paginas_v" USING btree ("version_updated_at");
  CREATE INDEX "_paginas_v_version_version_created_at_idx" ON "_paginas_v" USING btree ("version_created_at");
  CREATE INDEX "_paginas_v_version_version__status_idx" ON "_paginas_v" USING btree ("version__status");
  CREATE INDEX "_paginas_v_created_at_idx" ON "_paginas_v" USING btree ("created_at");
  CREATE INDEX "_paginas_v_updated_at_idx" ON "_paginas_v" USING btree ("updated_at");
  CREATE INDEX "_paginas_v_latest_idx" ON "_paginas_v" USING btree ("latest");
  CREATE INDEX "archivos_updated_at_idx" ON "archivos" USING btree ("updated_at");
  CREATE INDEX "archivos_created_at_idx" ON "archivos" USING btree ("created_at");
  CREATE UNIQUE INDEX "archivos_filename_idx" ON "archivos" USING btree ("filename");
  CREATE UNIQUE INDEX "redirecciones_desde_idx" ON "redirecciones" USING btree ("desde");
  CREATE INDEX "redirecciones_updated_at_idx" ON "redirecciones" USING btree ("updated_at");
  CREATE INDEX "redirecciones_created_at_idx" ON "redirecciones" USING btree ("created_at");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "portada_nota_destacada_idx" ON "portada" USING btree ("nota_destacada_id");
  CREATE INDEX "portada_pelicula_destacada_idx" ON "portada" USING btree ("pelicula_destacada_id");
  CREATE INDEX "cinevision_carrusel_order_idx" ON "cinevision_carrusel" USING btree ("_order");
  CREATE INDEX "cinevision_carrusel_parent_id_idx" ON "cinevision_carrusel" USING btree ("_parent_id");
  CREATE INDEX "cinevision_carrusel_imagen_web_idx" ON "cinevision_carrusel" USING btree ("imagen_web_id");
  CREATE INDEX "cinevision_carrusel_imagen_movil_idx" ON "cinevision_carrusel" USING btree ("imagen_movil_id");
  CREATE INDEX "cinevision_precios_order_idx" ON "cinevision_precios" USING btree ("_order");
  CREATE INDEX "cinevision_precios_parent_id_idx" ON "cinevision_precios" USING btree ("_parent_id");
  CREATE INDEX "cinevision_promociones_order_idx" ON "cinevision_promociones" USING btree ("_order");
  CREATE INDEX "cinevision_promociones_parent_id_idx" ON "cinevision_promociones" USING btree ("_parent_id");
  CREATE INDEX "cinevision_como_llegar_como_llegar_mapa_imagen_idx" ON "cinevision" USING btree ("como_llegar_mapa_imagen_id");
  CREATE INDEX "institucional_hitos_order_idx" ON "institucional_hitos" USING btree ("_order");
  CREATE INDEX "institucional_hitos_parent_id_idx" ON "institucional_hitos" USING btree ("_parent_id");
  CREATE INDEX "institucional_kit_comercial_idx" ON "institucional" USING btree ("kit_comercial_id");
  CREATE INDEX "ajustes_redes_order_idx" ON "ajustes_redes" USING btree ("_order");
  CREATE INDEX "ajustes_redes_parent_id_idx" ON "ajustes_redes" USING btree ("_parent_id");
  CREATE INDEX "ajustes_aviso_propio_aviso_propio_imagen_web_idx" ON "ajustes" USING btree ("aviso_propio_imagen_web_id");
  CREATE INDEX "ajustes_aviso_propio_aviso_propio_imagen_movil_idx" ON "ajustes" USING btree ("aviso_propio_imagen_movil_id");
  ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_equipo_id_equipo_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipo"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_noticias_fk" FOREIGN KEY ("noticias_id") REFERENCES "public"."noticias"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_entrevistas_fk" FOREIGN KEY ("entrevistas_id") REFERENCES "public"."entrevistas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programas_fk" FOREIGN KEY ("programas_id") REFERENCES "public"."programas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_excepciones_grilla_fk" FOREIGN KEY ("excepciones_grilla_id") REFERENCES "public"."excepciones_grilla"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipo_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_peliculas_fk" FOREIGN KEY ("peliculas_id") REFERENCES "public"."peliculas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_funciones_fk" FOREIGN KEY ("funciones_id") REFERENCES "public"."funciones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_anuncios_fk" FOREIGN KEY ("anuncios_id") REFERENCES "public"."anuncios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_anuncios_metricas_fk" FOREIGN KEY ("anuncios_metricas_id") REFERENCES "public"."anuncios_metricas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mensajes_fk" FOREIGN KEY ("mensajes_id") REFERENCES "public"."mensajes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_paginas_fk" FOREIGN KEY ("paginas_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_archivos_fk" FOREIGN KEY ("archivos_id") REFERENCES "public"."archivos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirecciones_fk" FOREIGN KEY ("redirecciones_id") REFERENCES "public"."redirecciones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "usuarios_equipo_idx" ON "usuarios" USING btree ("equipo_id");
  CREATE INDEX "medios_sizes_w320_sizes_w320_filename_idx" ON "medios" USING btree ("sizes_w320_filename");
  CREATE INDEX "medios_sizes_w640_sizes_w640_filename_idx" ON "medios" USING btree ("sizes_w640_filename");
  CREATE INDEX "medios_sizes_w960_sizes_w960_filename_idx" ON "medios" USING btree ("sizes_w960_filename");
  CREATE INDEX "medios_sizes_w1280_sizes_w1280_filename_idx" ON "medios" USING btree ("sizes_w1280_filename");
  CREATE INDEX "medios_sizes_w1920_sizes_w1920_filename_idx" ON "medios" USING btree ("sizes_w1920_filename");
  CREATE INDEX "payload_locked_documents_rels_noticias_id_idx" ON "payload_locked_documents_rels" USING btree ("noticias_id");
  CREATE INDEX "payload_locked_documents_rels_entrevistas_id_idx" ON "payload_locked_documents_rels" USING btree ("entrevistas_id");
  CREATE INDEX "payload_locked_documents_rels_programas_id_idx" ON "payload_locked_documents_rels" USING btree ("programas_id");
  CREATE INDEX "payload_locked_documents_rels_excepciones_grilla_id_idx" ON "payload_locked_documents_rels" USING btree ("excepciones_grilla_id");
  CREATE INDEX "payload_locked_documents_rels_equipo_id_idx" ON "payload_locked_documents_rels" USING btree ("equipo_id");
  CREATE INDEX "payload_locked_documents_rels_peliculas_id_idx" ON "payload_locked_documents_rels" USING btree ("peliculas_id");
  CREATE INDEX "payload_locked_documents_rels_funciones_id_idx" ON "payload_locked_documents_rels" USING btree ("funciones_id");
  CREATE INDEX "payload_locked_documents_rels_anuncios_id_idx" ON "payload_locked_documents_rels" USING btree ("anuncios_id");
  CREATE INDEX "payload_locked_documents_rels_anuncios_metricas_id_idx" ON "payload_locked_documents_rels" USING btree ("anuncios_metricas_id");
  CREATE INDEX "payload_locked_documents_rels_mensajes_id_idx" ON "payload_locked_documents_rels" USING btree ("mensajes_id");
  CREATE INDEX "payload_locked_documents_rels_paginas_id_idx" ON "payload_locked_documents_rels" USING btree ("paginas_id");
  CREATE INDEX "payload_locked_documents_rels_archivos_id_idx" ON "payload_locked_documents_rels" USING btree ("archivos_id");
  CREATE INDEX "payload_locked_documents_rels_redirecciones_id_idx" ON "payload_locked_documents_rels" USING btree ("redirecciones_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticias" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_noticias_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "entrevistas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_entrevistas_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programas_horarios_dias" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programas_horarios" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "programas_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "excepciones_grilla" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipo_redes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "peliculas_idiomas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "peliculas_formatos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "peliculas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_peliculas_v_version_idiomas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_peliculas_v_version_formatos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_peliculas_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "funciones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "anuncios_ubicaciones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "anuncios" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "anuncios_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "anuncios_metricas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mensajes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "paginas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "archivos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "redirecciones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "portada" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cinevision_carrusel" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cinevision_precios" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cinevision_promociones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cinevision" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "institucional_hitos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "institucional" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ajustes_redes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ajustes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "noticias" CASCADE;
  DROP TABLE "_noticias_v" CASCADE;
  DROP TABLE "entrevistas" CASCADE;
  DROP TABLE "_entrevistas_v" CASCADE;
  DROP TABLE "programas_horarios_dias" CASCADE;
  DROP TABLE "programas_horarios" CASCADE;
  DROP TABLE "programas" CASCADE;
  DROP TABLE "programas_rels" CASCADE;
  DROP TABLE "excepciones_grilla" CASCADE;
  DROP TABLE "equipo_redes" CASCADE;
  DROP TABLE "equipo" CASCADE;
  DROP TABLE "peliculas_idiomas" CASCADE;
  DROP TABLE "peliculas_formatos" CASCADE;
  DROP TABLE "peliculas" CASCADE;
  DROP TABLE "_peliculas_v_version_idiomas" CASCADE;
  DROP TABLE "_peliculas_v_version_formatos" CASCADE;
  DROP TABLE "_peliculas_v" CASCADE;
  DROP TABLE "funciones" CASCADE;
  DROP TABLE "anuncios_ubicaciones" CASCADE;
  DROP TABLE "anuncios" CASCADE;
  DROP TABLE "anuncios_rels" CASCADE;
  DROP TABLE "anuncios_metricas" CASCADE;
  DROP TABLE "mensajes" CASCADE;
  DROP TABLE "paginas" CASCADE;
  DROP TABLE "_paginas_v" CASCADE;
  DROP TABLE "archivos" CASCADE;
  DROP TABLE "redirecciones" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "portada" CASCADE;
  DROP TABLE "cinevision_carrusel" CASCADE;
  DROP TABLE "cinevision_precios" CASCADE;
  DROP TABLE "cinevision_promociones" CASCADE;
  DROP TABLE "cinevision" CASCADE;
  DROP TABLE "institucional_hitos" CASCADE;
  DROP TABLE "institucional" CASCADE;
  DROP TABLE "ajustes_redes" CASCADE;
  DROP TABLE "ajustes" CASCADE;
  ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_equipo_id_equipo_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_noticias_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_entrevistas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_programas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_excepciones_grilla_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_equipo_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_peliculas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_funciones_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_anuncios_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_anuncios_metricas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_mensajes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_paginas_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_archivos_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_redirecciones_fk";
  
  DROP INDEX "medios_sizes_w320_sizes_w320_filename_idx";
  DROP INDEX "medios_sizes_w640_sizes_w640_filename_idx";
  DROP INDEX "medios_sizes_w960_sizes_w960_filename_idx";
  DROP INDEX "medios_sizes_w1280_sizes_w1280_filename_idx";
  DROP INDEX "medios_sizes_w1920_sizes_w1920_filename_idx";
  DROP INDEX "usuarios_equipo_idx";
  DROP INDEX "payload_locked_documents_rels_noticias_id_idx";
  DROP INDEX "payload_locked_documents_rels_entrevistas_id_idx";
  DROP INDEX "payload_locked_documents_rels_programas_id_idx";
  DROP INDEX "payload_locked_documents_rels_excepciones_grilla_id_idx";
  DROP INDEX "payload_locked_documents_rels_equipo_id_idx";
  DROP INDEX "payload_locked_documents_rels_peliculas_id_idx";
  DROP INDEX "payload_locked_documents_rels_funciones_id_idx";
  DROP INDEX "payload_locked_documents_rels_anuncios_id_idx";
  DROP INDEX "payload_locked_documents_rels_anuncios_metricas_id_idx";
  DROP INDEX "payload_locked_documents_rels_mensajes_id_idx";
  DROP INDEX "payload_locked_documents_rels_paginas_id_idx";
  DROP INDEX "payload_locked_documents_rels_archivos_id_idx";
  DROP INDEX "payload_locked_documents_rels_redirecciones_id_idx";
  ALTER TABLE "medios" DROP COLUMN "sizes_w320_url";
  ALTER TABLE "medios" DROP COLUMN "sizes_w320_width";
  ALTER TABLE "medios" DROP COLUMN "sizes_w320_height";
  ALTER TABLE "medios" DROP COLUMN "sizes_w320_mime_type";
  ALTER TABLE "medios" DROP COLUMN "sizes_w320_filesize";
  ALTER TABLE "medios" DROP COLUMN "sizes_w320_filename";
  ALTER TABLE "medios" DROP COLUMN "sizes_w640_url";
  ALTER TABLE "medios" DROP COLUMN "sizes_w640_width";
  ALTER TABLE "medios" DROP COLUMN "sizes_w640_height";
  ALTER TABLE "medios" DROP COLUMN "sizes_w640_mime_type";
  ALTER TABLE "medios" DROP COLUMN "sizes_w640_filesize";
  ALTER TABLE "medios" DROP COLUMN "sizes_w640_filename";
  ALTER TABLE "medios" DROP COLUMN "sizes_w960_url";
  ALTER TABLE "medios" DROP COLUMN "sizes_w960_width";
  ALTER TABLE "medios" DROP COLUMN "sizes_w960_height";
  ALTER TABLE "medios" DROP COLUMN "sizes_w960_mime_type";
  ALTER TABLE "medios" DROP COLUMN "sizes_w960_filesize";
  ALTER TABLE "medios" DROP COLUMN "sizes_w960_filename";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1280_url";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1280_width";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1280_height";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1280_mime_type";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1280_filesize";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1280_filename";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1920_url";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1920_width";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1920_height";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1920_mime_type";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1920_filesize";
  ALTER TABLE "medios" DROP COLUMN "sizes_w1920_filename";
  ALTER TABLE "usuarios" DROP COLUMN "equipo_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "noticias_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "entrevistas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "programas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "excepciones_grilla_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "equipo_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "peliculas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "funciones_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "anuncios_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "anuncios_metricas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "mensajes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "paginas_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "archivos_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "redirecciones_id";
  DROP TYPE "public"."enum_noticias_estado_editorial";
  DROP TYPE "public"."enum_noticias_status";
  DROP TYPE "public"."enum__noticias_v_version_estado_editorial";
  DROP TYPE "public"."enum__noticias_v_version_status";
  DROP TYPE "public"."enum_entrevistas_status";
  DROP TYPE "public"."enum__entrevistas_v_version_status";
  DROP TYPE "public"."enum_programas_horarios_dias";
  DROP TYPE "public"."enum_equipo_redes_red";
  DROP TYPE "public"."enum_equipo_grupo";
  DROP TYPE "public"."enum_peliculas_idiomas";
  DROP TYPE "public"."enum_peliculas_formatos";
  DROP TYPE "public"."enum_peliculas_calificacion";
  DROP TYPE "public"."enum_peliculas_status";
  DROP TYPE "public"."enum__peliculas_v_version_idiomas";
  DROP TYPE "public"."enum__peliculas_v_version_formatos";
  DROP TYPE "public"."enum__peliculas_v_version_calificacion";
  DROP TYPE "public"."enum__peliculas_v_version_status";
  DROP TYPE "public"."enum_funciones_idioma";
  DROP TYPE "public"."enum_funciones_formato";
  DROP TYPE "public"."enum_anuncios_ubicaciones";
  DROP TYPE "public"."enum_anuncios_metricas_ubicacion";
  DROP TYPE "public"."enum_mensajes_tipo";
  DROP TYPE "public"."enum_mensajes_estado";
  DROP TYPE "public"."enum_paginas_status";
  DROP TYPE "public"."enum__paginas_v_version_status";
  DROP TYPE "public"."enum_redirecciones_tipo";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_ajustes_redes_red";`)
}
