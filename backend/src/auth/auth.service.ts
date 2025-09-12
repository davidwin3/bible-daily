import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import * as crypto from 'crypto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private firebaseService: FirebaseService,
    private usersService: UsersService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
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
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
          role: user.role,
          createdAt: user.createdAt,
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

  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };

    // Access Token 생성
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '24h',
    });

    // Refresh Token 생성
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(
      refreshTokenExpiry.getDate() +
        parseInt(
          this.configService.get('JWT_REFRESH_EXPIRES_IN')?.replace('d', '') ||
            '7',
        ),
    );

    // 기존 refresh token들 무효화
    await this.revokeAllUserRefreshTokens(user.id);

    // 새 refresh token 저장
    const refreshToken = new RefreshToken();
    refreshToken.token = refreshTokenValue;
    refreshToken.userId = user.id;
    refreshToken.expiresAt = refreshTokenExpiry;

    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  async refreshAccessToken(refreshTokenValue: string): Promise<AuthTokens> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenValue },
      relations: ['user'],
    });

    if (!refreshToken || !refreshToken.isValid()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = refreshToken.user;
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // 새 토큰 생성
    const tokens = await this.generateTokens(user);

    // 기존 refresh token 무효화
    refreshToken.revoke(undefined, tokens.refreshToken);
    await this.refreshTokenRepository.save(refreshToken);

    return tokens;
  }

  async revokeRefreshToken(
    refreshTokenValue: string,
    ip?: string,
  ): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenValue },
    });

    if (refreshToken) {
      refreshToken.revoke(ip);
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
