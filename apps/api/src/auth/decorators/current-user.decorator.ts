import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // Get the context of the request
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If @CurrentUser('email') => return only the email
    // else => return req.user
    return data ? user?.[data] : user;
  },
);
