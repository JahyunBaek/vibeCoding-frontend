/** 서버 에러 응답 */
export type ApiError = { code: string; message: string };

/** 모든 API 응답의 공통 래퍼 */
export type ApiResponse<T> = { success: boolean; data: T; error?: ApiError };
