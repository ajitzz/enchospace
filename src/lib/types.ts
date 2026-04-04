export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

export interface ApiError {
  error: string;
  code: string;
  timestamp: string;
}
