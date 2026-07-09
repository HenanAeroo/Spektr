import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { map, Observable } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  { data: T; message: string; statusCode: number }
> {
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
