import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer'; // Note: plainToClass is deprecated

interface ClassConstructor {
  new (...args: any[]): {};
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data: any) => {
        if (data?.items && data?.metadata) {
          const transformedItems = plainToInstance(this.dto, data.items, {
            excludeExtraneousValues: false,
            enableCircularCheck: true,
            enableImplicitConversion: true,
          });

          return {
            ...data,
            items: transformedItems,
          };
        }

        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: false,
          enableCircularCheck: true,
          enableImplicitConversion: true,
        });
      }),
    );
  }
}
