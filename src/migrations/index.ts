import * as migration_20261014_042502_inicial from './20261014_042502_inicial';
import * as migration_20261014_050446_permisos_etapa_1 from './20261014_050446_permisos_etapa_1';

export const migrations = [
  {
    up: migration_20261014_042502_inicial.up,
    down: migration_20261014_042502_inicial.down,
    name: '20261014_042502_inicial',
  },
  {
    up: migration_20261014_050446_permisos_etapa_1.up,
    down: migration_20261014_050446_permisos_etapa_1.down,
    name: '20261014_050446_permisos_etapa_1'
  },
];
