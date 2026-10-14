import * as migration_20261014_042502_inicial from './20261014_042502_inicial';

export const migrations = [
  {
    up: migration_20261014_042502_inicial.up,
    down: migration_20261014_042502_inicial.down,
    name: '20261014_042502_inicial'
  },
];
