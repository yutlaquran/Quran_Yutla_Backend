import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResponseDto } from '../dto/pagination-metadata.response.dto';

export interface PaginationQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class PaginationService {
  static async paginateQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<any>,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      basePath?: string;
      defaultSortColumn?: string;
    },
  ): Promise<PaginatedResponseDto<T>> {
    // Set default values
    const limit = options.limit || 10;
    const page = options.page || 1;
    const basePath = options.basePath || '';

    // Apply sorting
    if (options?.sortBy) {
      const entity = queryBuilder.alias;

      if (!entity) {
        throw new Error('QueryBuilder alias is not set');
      }
      // Check if sortBy already contains an alias/table name
      const sortColumn = options.sortBy.includes('.')
        ? options.sortBy
        : `${entity}.${options.sortBy}`;

      queryBuilder.orderBy(sortColumn, options.sortOrder || 'DESC');
    } else if (options.defaultSortColumn) {
      // Check if defaultSortColumn already contains an alias/table name
      const sortColumn = options.defaultSortColumn.includes('.')
        ? options.defaultSortColumn
        : `${queryBuilder.alias}.${options.defaultSortColumn}`;

      queryBuilder.orderBy(sortColumn, 'DESC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results
    const [items, totalItems] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalItems / limit);

    // Create paginated response
    const paginatedResponse = new PaginatedResponseDto<T>();
    paginatedResponse.items = items as T[];
    paginatedResponse.metadata = {
      totalItems,
      itemsPerPage: Number(limit),
      totalPages,
      currentPage: Number(page),
    };

    // Add pagination links
    const queryParams = new URLSearchParams();
    queryParams.append('limit', limit.toString());

    paginatedResponse.links = {
      hasNext: page < totalPages,
      first:
        page > 1 ? `${basePath}?page=1&${queryParams.toString()}` : undefined,
      previous:
        page > 1
          ? `${basePath}?page=${page - 1}&${queryParams.toString()}`
          : undefined,
      next:
        page < totalPages
          ? `${basePath}?page=${page + 1}&${queryParams.toString()}`
          : undefined,
      last:
        page < totalPages
          ? `${basePath}?page=${totalPages}&${queryParams.toString()}`
          : undefined,
    };

    return paginatedResponse;
  }

  static async paginateRepository<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      basePath?: string;
      where?: any;
      relations?: string[];
      select?: string[];
    },
  ): Promise<PaginatedResponseDto<T>> {
    const queryBuilder = repository.createQueryBuilder('entity');

    // Apply where conditions
    if (options.where) {
      queryBuilder.where(options.where);
    }

    // Apply relations
    if (options.relations && options.relations.length > 0) {
      for (const relation of options.relations) {
        queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
      }
    }

    // Apply select
    if (options.select && options.select.length > 0) {
      queryBuilder.select(options.select);
    }

    return this.paginateQueryBuilder<T>(queryBuilder, options);
  }
}
