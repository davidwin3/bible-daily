import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CellMember } from '../entities/cell-member.entity';
import { UserMission } from '../entities/user-mission.entity';
import { Post } from '../entities/post.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(CellMember)
    private cellMembersRepository: Repository<CellMember>,
    @InjectRepository(UserMission)
    private userMissionsRepository: Repository<UserMission>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { firebaseUid, isActive: true },
    });
  }

  async createFromFirebase(firebaseUser: admin.auth.UserRecord): Promise<User> {
    const user = this.usersRepository.create({
      email: firebaseUser.email || '',
      name:
        firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      profileImage: firebaseUser.photoURL || null,
      firebaseUid: firebaseUser.uid,
    });

    return await this.usersRepository.save(user);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      { lastLoginAt: new Date() },
    );
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { isActive: true },
      select: [
        'id',
        'email',
        'name',
        'profileImage',
        'role',
        'createdAt',
        'lastLoginAt',
      ],
    });
  }

  async updateProfile(
    userId: string,
    updateData: Partial<Pick<User, 'name' | 'profileImage'>>,
  ) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepository.update({ id: userId }, updateData);
    return await this.findById(userId);
  }

  // Admin only methods
  async getAllUsersForAdmin() {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'email',
        'name',
        'profileImage',
        'role',
        'isActive',
        'createdAt',
        'lastLoginAt',
      ],
      order: { createdAt: 'DESC' },
    });

    // 각 사용자의 활동 통계 추가
    const usersWithStats: any[] = [];
    for (const user of users) {
      const cellMembership = await this.cellMembersRepository.findOne({
        where: { userId: user.id, isActive: true },
        relations: ['cell'],
        select: {
          cell: {
            id: true,
            name: true,
          },
        },
      });

      const recentMissions = await this.userMissionsRepository.count({
        where: {
          userId: user.id,
          createdAt: MoreThanOrEqual(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ),
        },
      });

      const completedMissions = await this.userMissionsRepository.count({
        where: {
          userId: user.id,
          isCompleted: true,
          createdAt: MoreThanOrEqual(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ),
        },
      });

      const totalPosts = await this.postsRepository.count({
        where: { authorId: user.id, isDeleted: false },
      });

      usersWithStats.push({
        ...user,
        cellInfo: cellMembership?.cell || null,
        recentMissions,
        completedMissions,
        completionRate:
          recentMissions > 0 ? (completedMissions / recentMissions) * 100 : 0,
        totalPosts,
      });
    }

    return usersWithStats;
  }

  async getUserDetailForAdmin(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'profileImage',
        'role',
        'isActive',
        'createdAt',
        'lastLoginAt',
        'firebaseUid',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 셀 정보
    const cellMembership = await this.cellMembersRepository.findOne({
      where: { userId: id, isActive: true },
      relations: ['cell', 'cell.leader'],
      select: {
        cell: {
          id: true,
          name: true,
          description: true,
          leader: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 미션 통계
    const totalMissions = await this.userMissionsRepository.count({
      where: { userId: id },
    });

    const completedMissions = await this.userMissionsRepository.count({
      where: { userId: id, isCompleted: true },
    });

    const recentMissions = await this.userMissionsRepository.count({
      where: {
        userId: id,
        createdAt: MoreThanOrEqual(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ),
      },
    });

    const recentCompletedMissions = await this.userMissionsRepository.count({
      where: {
        userId: id,
        isCompleted: true,
        createdAt: MoreThanOrEqual(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ),
      },
    });

    // 게시물 통계
    const totalPosts = await this.postsRepository.count({
      where: { authorId: id, isDeleted: false },
    });

    const recentPosts = await this.postsRepository.count({
      where: {
        authorId: id,
        isDeleted: false,
        createdAt: MoreThanOrEqual(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ),
      },
    });

    return {
      ...user,
      cellInfo: cellMembership?.cell || null,
      missionStats: {
        totalMissions,
        completedMissions,
        overallCompletionRate:
          totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0,
        recentMissions,
        recentCompletedMissions,
        recentCompletionRate:
          recentMissions > 0
            ? (recentCompletedMissions / recentMissions) * 100
            : 0,
      },
      postStats: {
        totalPosts,
        recentPosts,
      },
    };
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    await this.usersRepository.save(user);

    return user;
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.usersRepository.save(user);

    return user;
  }

  async reactivateUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = true;
    await this.usersRepository.save(user);

    return user;
  }

  async getUserStatistics() {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({
      where: { isActive: true },
    });
    const adminUsers = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });
    const teacherUsers = await this.usersRepository.count({
      where: { role: UserRole.TEACHER },
    });
    const studentUsers = await this.usersRepository.count({
      where: { role: UserRole.STUDENT },
    });

    // 최근 로그인 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActiveUsers = await this.usersRepository.count({
      where: {
        isActive: true,
        lastLoginAt: MoreThanOrEqual(sevenDaysAgo),
      },
    });

    // 셀에 속하지 않은 사용자
    const usersInCells = await this.cellMembersRepository.count({
      where: { isActive: true },
    });

    const usersNotInCells = activeUsers - usersInCells;

    // 신규 가입자 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await this.usersRepository.count({
      where: {
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      roleDistribution: {
        admin: adminUsers,
        teacher: teacherUsers,
        student: studentUsers,
      },
      recentActiveUsers,
      usersInCells,
      usersNotInCells,
      newUsers,
      activityRate:
        activeUsers > 0 ? (recentActiveUsers / activeUsers) * 100 : 0,
    };
  }
}
