import { Reflector } from '@nestjs/core';

// Sets the `message` of a route's success response, e.g.
// @ResponseMessage('Employee details fetched successfully')
export const ResponseMessage = Reflector.createDecorator<string>();
