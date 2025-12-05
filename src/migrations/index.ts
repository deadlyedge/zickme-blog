import * as migration_20251201_145914_init from './20251201_145914_init';
import * as migration_20251205_120000_update_users_table from './20251205_120000_update_users_table';

export const migrations = [
  {
    up: migration_20251201_145914_init.up,
    down: migration_20251201_145914_init.down,
    name: '20251201_145914_init'
  },
  {
    up: migration_20251205_120000_update_users_table.up,
    down: migration_20251205_120000_update_users_table.down,
    name: '20251205_120000_update_users_table'
  },
];
