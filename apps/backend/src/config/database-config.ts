import { DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { join } from 'path';
import { SnakeNamingStrategy } from '../database/snake-naming.strategy';
import * as dotenv from 'dotenv';
import { Account, Session, User, Verification } from 'src/lib/entities';

dotenv.config();

export const databaseConfig: DataSourceOptions & SeederOptions = {
  type: <any>process.env.DB_TYPE,
  ...(process.env.DB_URL
    ? { url: process.env.DB_URL }
    : {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT!, 10) || 5432,
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
        database: process.env.DB_NAME || 'storify',
      }),
  entities: [
    join(__dirname, '../**/*.entity{.ts,.js}'),
    User,
    Session,
    Account,
    Verification,
  ],
  migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
  synchronize: false,
  dropSchema: false,
  namingStrategy: new SnakeNamingStrategy(),
};
