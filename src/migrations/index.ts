import * as migration_20261014_042502_inicial from './20261014_042502_inicial';
import * as migration_20261014_050446_permisos_etapa_1 from './20261014_050446_permisos_etapa_1';
import * as migration_20261014_050853_registro_actividad from './20261014_050853_registro_actividad';
import * as migration_20261014_051806_colecciones from './20261014_051806_colecciones';
import * as migration_20261014_160520_almacenamiento_r2 from './20261014_160520_almacenamiento_r2';
import * as migration_20261014_161825_tareas_publicidad from './20261014_161825_tareas_publicidad';
import * as migration_20261015_020800_sincronizar_access from './20261015_020800_sincronizar_access';
import * as migration_20261015_163800_cinevision_publicidad from './20261015_163800_cinevision_publicidad';
import * as migration_20261015_204916_aviso_rectangulo from './20261015_204916_aviso_rectangulo';
import * as migration_20261017_000159_compartir from './20261017_000159_compartir';

export const migrations = [
  {
    up: migration_20261014_042502_inicial.up,
    down: migration_20261014_042502_inicial.down,
    name: '20261014_042502_inicial',
  },
  {
    up: migration_20261014_050446_permisos_etapa_1.up,
    down: migration_20261014_050446_permisos_etapa_1.down,
    name: '20261014_050446_permisos_etapa_1',
  },
  {
    up: migration_20261014_050853_registro_actividad.up,
    down: migration_20261014_050853_registro_actividad.down,
    name: '20261014_050853_registro_actividad',
  },
  {
    up: migration_20261014_051806_colecciones.up,
    down: migration_20261014_051806_colecciones.down,
    name: '20261014_051806_colecciones',
  },
  {
    up: migration_20261014_160520_almacenamiento_r2.up,
    down: migration_20261014_160520_almacenamiento_r2.down,
    name: '20261014_160520_almacenamiento_r2',
  },
  {
    up: migration_20261014_161825_tareas_publicidad.up,
    down: migration_20261014_161825_tareas_publicidad.down,
    name: '20261014_161825_tareas_publicidad',
  },
  {
    up: migration_20261015_020800_sincronizar_access.up,
    down: migration_20261015_020800_sincronizar_access.down,
    name: '20261015_020800_sincronizar_access',
  },
  {
    up: migration_20261015_163800_cinevision_publicidad.up,
    down: migration_20261015_163800_cinevision_publicidad.down,
    name: '20261015_163800_cinevision_publicidad',
  },
  {
    up: migration_20261015_204916_aviso_rectangulo.up,
    down: migration_20261015_204916_aviso_rectangulo.down,
    name: '20261015_204916_aviso_rectangulo',
  },
  {
    up: migration_20261017_000159_compartir.up,
    down: migration_20261017_000159_compartir.down,
    name: '20261017_000159_compartir'
  },
];
