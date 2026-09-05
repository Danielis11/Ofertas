import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should intercept and log execution time', (done) => {
    const mockRequest = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      ip: '127.0.0.1',
    };
    const mockResponse = {
      statusCode: 200,
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () => of({ status: 'ok' }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (val) => {
        expect(val).toEqual({ status: 'ok' });
        done();
      },
    });
  });
});
