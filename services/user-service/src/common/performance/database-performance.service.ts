import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { ConfigService } from "@nestjs/config";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page?: number;
    limit: number;
    total?: number;
    totalPages?: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

@Injectable()
export class DatabasePerformanceService {
  private readonly logger = new Logger(DatabasePerformanceService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  /**
   * Apply cursor-based pagination to a query builder
   */
  async applyCursorPagination<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
    cursorField: string = "id",
  ): Promise<PaginatedResult<T>> {
    const limit = Math.min(options.limit || 20, 100); // Max 100 items per page

    // Apply cursor if provided
    if (options.cursor) {
      const cursorValue = Buffer.from(options.cursor, "base64").toString(
        "utf-8",
      );
      const operator = options.sortOrder === "DESC" ? "<" : ">";
      queryBuilder.andWhere(
        `${queryBuilder.alias}.${cursorField} ${operator} :cursor`,
        {
          cursor: cursorValue,
        },
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || cursorField;
    const sortOrder = options.sortOrder || "ASC";
    queryBuilder.orderBy(`${queryBuilder.alias}.${sortBy}`, sortOrder);

    // Fetch one extra item to check if there's a next page
    queryBuilder.limit(limit + 1);

    const items = await queryBuilder.getMany();
    const hasNext = items.length > limit;

    if (hasNext) {
      items.pop(); // Remove the extra item
    }

    const hasPrev = !!options.cursor;

    // Generate cursors
    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (hasNext && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = Buffer.from(String(lastItem[cursorField])).toString(
        "base64",
      );
    }

    if (hasPrev && items.length > 0) {
      const firstItem = items[0];
      prevCursor = Buffer.from(String(firstItem[cursorField])).toString(
        "base64",
      );
    }

    return {
      data: items,
      pagination: {
        limit,
        hasNext,
        hasPrev,
        nextCursor,
        prevCursor,
      },
    };
  }

  /**
   * Apply offset-based pagination to a query builder
   */
  async applyOffsetPagination<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(options.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Apply sorting
    if (options.sortBy) {
      const sortOrder = options.sortOrder || "ASC";
      queryBuilder.orderBy(
        `${queryBuilder.alias}.${options.sortBy}`,
        sortOrder,
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(offset).take(limit);
    const items = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Optimize query with proper eager loading and joins
   */
  optimizeQuery<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    relations: string[] = [],
    selectFields?: string[],
  ): SelectQueryBuilder<T> {
    // Apply selective field loading if specified
    if (selectFields && selectFields.length > 0) {
      queryBuilder.select(
        selectFields.map((field) => `${queryBuilder.alias}.${field}`),
      );
    }

    // Add efficient joins for relations
    relations.forEach((relation) => {
      const relationAlias = relation.replace(".", "_");
      queryBuilder.leftJoinAndSelect(
        `${queryBuilder.alias}.${relation}`,
        relationAlias,
      );
    });

    return queryBuilder;
  }

  /**
   * Execute bulk operations efficiently
   */
  async bulkInsert<T>(
    entityClass: new () => T,
    entities: Partial<T>[],
    batchSize: number = 1000,
  ): Promise<void> {
    const repository = this.dataSource.getRepository(entityClass);

    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      await repository.insert(batch as any);

      this.logger.debug(
        `Bulk inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entities.length / batchSize)}`,
      );
    }
  }

  /**
   * Execute bulk updates efficiently
   */
  async bulkUpdate<T>(
    entityClass: new () => T,
    criteria: any,
    updateData: Partial<T>,
  ): Promise<number> {
    const repository = this.dataSource.getRepository(entityClass);
    const result = await repository.update(criteria, updateData as any);
    return result.affected || 0;
  }

  /**
   * Get database connection pool status
   */
  getConnectionPoolStatus() {
    const driver = this.dataSource.driver as any;
    const pool = driver.master || driver.pool;

    if (pool && pool.totalCount !== undefined) {
      return {
        totalConnections: pool.totalCount,
        idleConnections: pool.idleCount,
        activeConnections: pool.totalCount - pool.idleCount,
        waitingClients: pool.waitingCount || 0,
      };
    }

    return {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingClients: 0,
    };
  }

  /**
   * Execute query with connection pooling optimization
   */
  async executeWithPool<T>(queryFn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;

      if (executionTime > 1000) {
        this.logger.warn(`Slow query detected: ${executionTime}ms`);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Query failed after ${executionTime}ms:`, error);
      throw error;
    }
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(sql: string): Promise<any> {
    try {
      const result = await this.dataSource.query(`EXPLAIN ANALYZE ${sql}`);
      return result;
    } catch (error) {
      this.logger.error("Failed to analyze query:", error);
      return null;
    }
  }

  /**
   * Create database indexes for better performance
   */
  async createIndexes(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      // User indexes
      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
        ON users(email) WHERE email IS NOT NULL
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username 
        ON users(username) WHERE username IS NOT NULL
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at 
        ON users(created_at)
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active 
        ON users(is_active) WHERE is_active = true
      `);

      // Followers indexes
      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followers_follower_id 
        ON followers(follower_id)
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followers_following_id 
        ON followers(following_id)
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_followers_created_at 
        ON followers(created_at)
      `);

      // Stream keys indexes
      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_keys_user_id 
        ON stream_keys(user_id)
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_keys_is_active 
        ON stream_keys(is_active) WHERE is_active = true
      `);

      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_keys_last_used_at 
        ON stream_keys(last_used_at) WHERE last_used_at IS NOT NULL
      `);

      // Composite indexes for common queries
      await queryRunner.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_active 
        ON users(username, is_active) WHERE is_active = true
      `);

      this.logger.log("Database indexes created successfully");
    } catch (error) {
      this.logger.error("Failed to create indexes:", error);
    } finally {
      await queryRunner.release();
    }
  }
}
