import { createAdapterFactory } from 'better-auth/adapters';
import { DataSource, In } from 'typeorm';

/**
 * Configuration interface for our TypeORM adapter
 * This defines what options users pass when using our adapter
 */
interface TypeORMAdapterConfig {
  dataSource: DataSource; // The TypeORM connection
}

/**
 * TypeORM Adapter for Better Auth
 *
 * This adapter translates Better Auth's database operations
 * into TypeORM queries, allowing Better Auth to use TypeORM
 * for all authentication data storage.
 *
 * @param config - Configuration with TypeORM DataSource
 * @returns Better Auth adapter factory
 */
export function typeORMAdapter(config: TypeORMAdapterConfig) {
  const { dataSource } = config;

  return createAdapterFactory({
    /**
     * ADAPTER CONFIGURATION
     * This tells Better Auth about our adapter's capabilities
     */
    config: {
      adapterId: 'typeorm',
      adapterName: 'TypeORM',
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: true,
      supportsUUIDs: true,
    },

    /**
     * ADAPTER IMPLEMENTATION
     * This is where we write the actual database operations
     *
     * Better Auth calls these methods when it needs to:
     * - Create users, sessions, accounts
     * - Find records
     * - Update/delete data
     *
     * IMPORTANT: This function is NOT async - it returns the methods directly
     */
    adapter: ({ options, schema }) => {
      /**
       * Helper function to get TypeORM repository for any table
       *
       * @param model - Table name (e.g., 'user', 'session')
       * @returns TypeORM repository for that entity
       */
      const getRepository = (model: string) => {
        // TypeORM stores entities with capitalized names
        // Better Auth uses lowercase model names
        // We need to map: 'user' -> User entity
        const entityMap: Record<string, any> = {
          user: 'User',
          session: 'Session',
          account: 'Account',
          verification: 'Verification',
        };

        const entityName = entityMap[model] || model;
        return dataSource.getRepository(entityName);
      };

      /**
       * Helper to transform Better Auth where clauses to TypeORM find options
       * Handles array values by converting them to In() operators
       */
      const transformWhere = (where: any) => {
        if (!where) return {};
        const transformed: any = {};

        Object.entries(where).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            transformed[key] = In(value);
          } else {
            transformed[key] = value;
          }
        });

        return transformed;
      };

      /**
       * Return object with all database operation methods
       * Better Auth will call these as needed
       *
       * Each method IS async (they return Promises)
       * But the adapter function itself is NOT async
       */
      return {
        /**
         * CREATE - Insert a new record
         */
        async create<T extends Record<string, any>>({
          model,
          data,
        }: {
          model: string;
          data: T;
        }) {
          const repository = getRepository(model);
          const entity = repository.create(data);
          const result = await repository.save(entity);
          return result as T;
        },

        /**
         * FIND ONE - Get a single record by criteria
         */
        async findOne<T>({
          model,
          where,
          join,
        }: {
          model: string;
          where: any;
          join?: any;
        }) {
          const repository = getRepository(model);

          // Build relations array from join config
          const relations: string[] = [];
          if (join) {
            Object.entries(join).forEach(([key, value]: [string, any]) => {
              if (value && typeof value === 'object' && value.as) {
                relations.push(key);
              }
            });
          }

          const result = await repository.findOne({
            where: transformWhere(where),
            relations: relations.length > 0 ? relations : undefined,
          });
          return (result || null) as T | null;
        },

        /**
         * FIND MANY - Get multiple records with filters/pagination
         */
        async findMany<T>({
          model,
          where,
          limit,
          offset,
          sortBy,
          join,
        }: {
          model: string;
          where?: any;
          limit?: number;
          offset?: number;
          sortBy?: { field: string; direction: 'asc' | 'desc' };
          join?: any;
        }) {
          const repository = getRepository(model);

          const order: any = {};
          if (sortBy) {
            order[sortBy.field] = sortBy.direction === 'asc' ? 'ASC' : 'DESC';
          }

          // Build relations array from join config
          const relations: string[] = [];
          if (join) {
            Object.entries(join).forEach(([key, value]: [string, any]) => {
              if (value && typeof value === 'object' && value.as) {
                relations.push(key);
              }
            });
          }

          const results = await repository.find({
            where: transformWhere(where),
            take: limit,
            skip: offset,
            order: Object.keys(order).length > 0 ? order : undefined,
            relations: relations.length > 0 ? relations : undefined,
          });

          return results as T[];
        },

        /**
         * UPDATE - Update a single record
         */
        async update<T>({
          model,
          where,
          update,
        }: {
          model: string;
          where: any;
          update: T;
        }) {
          const repository = getRepository(model);
          const criteria = transformWhere(where);

          await repository.update(criteria, update as any);

          const result = await repository.findOne({
            where: criteria,
          });

          return (result || null) as T | null;
        },

        /**
         * UPDATE MANY - Update multiple records at once
         */
        async updateMany({
          model,
          where,
          update,
        }: {
          model: string;
          where: any;
          update: Record<string, any>;
        }) {
          const repository = getRepository(model);
          const result = await repository.update(
            transformWhere(where),
            update as any,
          );
          return result.affected || 0;
        },

        /**
         * DELETE - Remove a single record
         */
        async delete({ model, where }: { model: string; where: any }) {
          const repository = getRepository(model);
          await repository.delete(transformWhere(where));
        },

        /**
         * DELETE MANY - Remove multiple records
         */
        async deleteMany({ model, where }: { model: string; where: any }) {
          const repository = getRepository(model);
          const result = await repository.delete(transformWhere(where));
          return result.affected || 0;
        },

        /**
         * COUNT - Count records matching criteria
         */
        async count({ model, where }: { model: string; where?: any }) {
          const repository = getRepository(model);
          const count = await repository.count({
            where: transformWhere(where),
          });
          return count;
        },
      };
    },
  });
}
