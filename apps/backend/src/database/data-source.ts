import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database-config';

const dataSource = new DataSource(databaseConfig);
export default dataSource;
