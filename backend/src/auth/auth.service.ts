import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
    private usersService: UsersService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      // Firebase 토큰 검증
      const decodedToken = await this.firebaseService.verifyToken(
        loginDto.firebaseToken,
      );

      // 사용자 정보 가져오기 또는 생성
      let user = await this.usersService.findByFirebaseUid(decodedToken.uid);

      if (!user) {
        // 새 사용자 생성
        const firebaseUser = await this.firebaseService.getUserByUid(
          decodedToken.uid,
        );
        user = await this.usersService.createFromFirebase(firebaseUser);
      }

      // 마지막 로그인 시간 업데이트
      await this.usersService.updateLastLogin(user.id);

      // JWT 토큰 생성
      const payload = { sub: user.id, email: user.email };
      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Login failed');
    }
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }
}
