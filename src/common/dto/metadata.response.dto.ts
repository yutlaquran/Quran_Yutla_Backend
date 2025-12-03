export class PaginationMetadataDto {
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export class PaginationLinksDto {
  hasNext: boolean;
  first?: string;
  previous?: string;
  next?: string;
  last?: string;
}

export class PaginatedResponseDto<T> {
  items: T[];
  metadata: PaginationMetadataDto;
  links: PaginationLinksDto;
}
