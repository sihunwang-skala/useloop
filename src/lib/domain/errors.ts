export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "SOLD_OUT"
  | "EXPIRED"
  | "RATE_LIMITED"
  | "FEATURE_DISABLED";

/** 사용자에게 그대로 보여줘도 안전한 메시지를 가진 오류 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
