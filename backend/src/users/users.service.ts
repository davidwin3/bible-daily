import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CellMember } from '../entities/cell-member.entity';
import { UserMission } from '../entities/user-mission.entity';
import { Post } from '../entities/post.entity';
import * as admin from 'firebase-admin';

interface MissionStatRaw {
  userId: string;
  recentMissions: string;
  completedMissions: string;
}

interface PostCountRaw {
  authorId: string;
  totalPosts: string;
}

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
      realName:
        firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User', // 기존 사용자 호환성을 위해
      profileImage: firebaseUser.photoURL || null,
      firebaseUid: firebaseUser.uid,
    });

    return await this.usersRepository.save(user);
  }

  async createFromFirebaseWithRealName(
    firebaseUser: admin.auth.UserRecord,
    realName: string,
  ): Promise<User> {
    const user = this.usersRepository.create({
      email: firebaseUser.email || '',
      name: realName, // 실명을 표시명으로도 사용
      realName: realName,
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
    // 기본 사용자 정보 조회
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

    // 30일 전 날짜 계산
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 활성 셀 멤버십 정보를 한 번에 조회
    const activeCellMemberships = await this.cellMembersRepository
      .createQueryBuilder('cellMember')
      .leftJoinAndSelect('cellMember.cell', 'cell')
      .select(['cellMember.userId', 'cell.id', 'cell.name'])
      .where('cellMember.isActive = :isActive', { isActive: true })
      .getMany();

    // 모든 사용자의 미션 통계를 한 번에 조회
    const missionStats = await this.userMissionsRepository
      .createQueryBuilder('userMission')
      .select([
        'userMission.userId',
        'COUNT(*) as recentMissions',
        'SUM(CASE WHEN userMission.isCompleted = true THEN 1 ELSE 0 END) as completedMissions',
      ])
      .where('userMission.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('userMission.userId')
      .getRawMany<MissionStatRaw>();

    // 모든 사용자의 게시물 수를 한 번에 조회
    const postCounts = await this.postsRepository
      .createQueryBuilder('post')
      .select(['post.authorId', 'COUNT(*) as totalPosts'])
      .where('post.isDeleted = false')
      .groupBy('post.authorId')
      .getRawMany<PostCountRaw>();

    // 통계 데이터를 Map으로 변환하여 빠른 조회
    const cellMembershipMap = new Map(
      activeCellMemberships.map((membership) => [
        membership.userId,
        membership.cell,
      ]),
    );

    const missionStatsMap = new Map(
      missionStats.map((stat) => [
        stat.userId,
        {
          recentMissions: parseInt(stat.recentMissions, 10),
          completedMissions: parseInt(stat.completedMissions, 10),
        },
      ]),
    );

    const postCountsMap = new Map(
      postCounts.map((count) => [
        count.authorId,
        parseInt(count.totalPosts, 10),
      ]),
    );

    // 결과 조합
    const usersWithStats = users.map((user) => {
      const missionStat = missionStatsMap.get(user.id) || {
        recentMissions: 0,
        completedMissions: 0,
      };
      const totalPosts = postCountsMap.get(user.id) || 0;
      const cellInfo = cellMembershipMap.get(user.id) || null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        cellInfo,
        recentMissions: missionStat.recentMissions,
        completedMissions: missionStat.completedMissions,
        completionRate:
          missionStat.recentMissions > 0
            ? (missionStat.completedMissions / missionStat.recentMissions) * 100
            : 0,
        totalPosts,
      };
    });

    return usersWithStats;
  }

  async getUserDetailForAdmin(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'realName',
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
            realName: true,
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
