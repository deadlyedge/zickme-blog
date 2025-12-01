import * as migration_20251201_145914_init from './20251201_145914_init';

export const migrations = [
  {
    up: migration_20251201_145914_init.up,
    down: migration_20251201_145914_init.down,
    name: '20251201_145914_init'
  },
];
