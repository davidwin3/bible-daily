import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class CompressionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // 응답 크기가 1KB 이상일 때만 압축 헤더 설정
        const dataSize = JSON.stringify(data).length;

        if (dataSize > 1024) {
          response.setHeader('Content-Encoding', 'gzip');
        }

        // 캐시 헤더 설정
        if (this.isCacheable(context)) {
          response.setHeader('Cache-Control', 'public, max-age=300'); // 5분 캐시
          response.setHeader('ETag', this.generateETag(data));
        }

        return data;
      }),
    );
  }

  private isCacheable(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // GET 요청이고 특정 엔드포인트인 경우 캐시 가능
    return (
      method === 'GET' &&
      (url.includes('/posts') ||
        url.includes('/missions') ||
        url.includes('/cells'))
    );
  }

  private generateETag(data: any): string {
    // 간단한 ETag 생성 (실제로는 더 정교한 해싱 필요)
    const content = JSON.stringify(data);
    return `"${Buffer.from(content).toString('base64').slice(0, 16)}"`;
  }
}

