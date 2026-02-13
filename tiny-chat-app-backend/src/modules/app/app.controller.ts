import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({
    description:
      'This endpoint serves as a basic connectivity test to ensure that the API is operational and accessible. It is a lightweight, read-only operation that requires no authentication or parameters.',
    summary: 'Ping the API',
  })
  @ApiOkResponse({
    description:
      'Upon a successful request, the endpoint returns a standard response to indicate that the API is online and functioning correctly. This response is a simple message "pong".',
  })
  @SkipThrottle()
  @Get('/ping')
  ping(): string {
    return 'pong';
  }

  @ApiOperation({
    description:
      'This endpoint provides information about the current version of the API. It is a lightweight, read-only operation that requires no authentication or parameters.',
    summary: 'Get app version',
  })
  @ApiOkResponse({
    description: 'API Version. Example: v2.3.4',
  })
  @SkipThrottle()
  @Get('/version')
  version(): string {
    return this.configService.getOrThrow<string>('version');
  }
}
