import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Teacher or Admin access required');
    }

    return true;
  }
}
