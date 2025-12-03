export interface PaginationResult<T> {
  items: T[];
  metadata: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
  links?: {
    hasNext: boolean;
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
  };
}
