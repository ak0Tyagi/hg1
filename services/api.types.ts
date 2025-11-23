
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ErrorResponse {
    success: false;
    error: string;
    code: number;
}
