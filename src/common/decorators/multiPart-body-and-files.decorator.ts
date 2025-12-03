import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const MultiPartBodyAndFiles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      ...request.body,
      files: request.files,
      file: request.file,
    };
  },
);
