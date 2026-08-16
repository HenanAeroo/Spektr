import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';

/**
 * Wraps every successful response in a uniform envelope
 * `{ data, message, statusCode }`, so the frontend can read results in one shape
 * across all endpoints.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  { data: T; message: string; statusCode: number }
> {
  /**
   * Maps the handler's return value into the standard response envelope.
   *
   * @param context - The execution context (used to read the HTTP status).
   * @param next - The downstream call handler.
   * @returns An observable emitting the wrapped response.
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<{ data: T; message: string; statusCode: number }> {
    const statusCode = context
      .switchToHttp()
      .getResponse<Response>().statusCode;

    return next
      .handle()
      .pipe(map((data) => ({ data, message: 'OK', statusCode: statusCode })));
  }
}
