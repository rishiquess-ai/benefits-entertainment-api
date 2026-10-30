import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';
import { ResponseMessage } from '../decorators/response-message.decorator.js';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
}

// Wraps every successful response as { statusCode, message, data }.
// Errors keep Nest's { statusCode, message, error } shape.
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const message =
      this.reflector.get(ResponseMessage, context.getHandler()) ?? 'Success';
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        message,
        data: data ?? null,
      })),
    );
  }
}
