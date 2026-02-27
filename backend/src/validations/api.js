export class ApiResponse {
  constructor({ success = true, data = null, message = '', error = '', details = '' }) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.details = details;
  }
}

export class ListResponse {
  constructor({ data = [], pagination = {}, summary = null }) {
    this.data = data;
    this.pagination = pagination;
    this.summary = summary;
  }
}

export class PaginationMeta {
  constructor({ totalCount = 0, totalPages = 0, currentPage = 1, pageSize = 10, hasNext = false, hasPrev = false }) {
    this.totalCount = totalCount;
    this.totalPages = totalPages;
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.hasNext = hasNext;
    this.hasPrev = hasPrev;
  }
}
