import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from '../entities/mission.entity';
import { MissionScripture } from '../entities/mission-scripture.entity';
import { UserMission } from '../entities/user-mission.entity';
import { User } from '../entities/user.entity';
import { GetMissionsDto } from './dto/get-missions.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission)
    private missionsRepository: Repository<Mission>,
    @InjectRepository(MissionScripture)
    private missionScripturesRepository: Repository<MissionScripture>,
    @InjectRepository(UserMission)
    private userMissionsRepository: Repository<UserMission>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getTodayMission(date?: string): Promise<Mission | null> {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
    const today = date || new Date().toISOString().split('T')[0];

    const mission = await this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.scriptures', 'scriptures')
      .where('mission.date = :date', { date: today })
      .andWhere('mission.isActive = :isActive', { isActive: true })
      .orderBy('scriptures.order', 'ASC')
      .getOne();

    if (mission) {
      // 완료 통계 추가
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      mission.completionCount = completionCount;
      mission.totalUsers = totalUsers;
      mission.completionRate =
        totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return mission;
  }

  async findAll(getMissionsDto: GetMissionsDto) {
    const { startDate, endDate, month } = getMissionsDto;
    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.scriptures', 'scriptures')
      .where('mission.isActive = :isActive', { isActive: true })
      .orderBy('mission.date', 'DESC')
      .addOrderBy('scriptures.order', 'ASC');

    if (month) {
      // YYYY-MM 형식으로 월별 조회
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 2,
        0,
      );

      // DATE 타입 컬럼에 맞춰 YYYY-MM-DD 형식으로 변환
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      queryBuilder.andWhere(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth: startDateStr,
          endOfMonth: endDateStr,
        },
      );
    } else {
      if (startDate) {
        queryBuilder.andWhere('mission.date >= :startDate', {
          startDate,
        });
      }
      if (endDate) {
        queryBuilder.andWhere('mission.date <= :endDate', {
          endDate,
        });
      }
    }

    const missions = await queryBuilder.getMany();

    // 각 미션에 완료 통계 추가
    for (const mission of missions) {
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      mission.completionCount = completionCount;
      mission.totalUsers = totalUsers;
      mission.completionRate =
        totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return missions;
  }

  async findOne(id: string): Promise<Mission> {
    const mission = await this.missionsRepository.findOne({
      where: { id, isActive: true },
      relations: ['scriptures'],
      order: {
        scriptures: {
          order: 'ASC',
        },
      },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    // 완료 통계 추가
    const completionCount = await this.userMissionsRepository.count({
      where: { missionId: mission.id, isCompleted: true },
    });
    const totalUsers = await this.userMissionsRepository.count({
      where: { missionId: mission.id },
    });

    mission.completionCount = completionCount;
    mission.totalUsers = totalUsers;
    mission.completionRate =
      totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;

    return mission;
  }

  async getMissionByDate(date: string): Promise<Mission | null> {
    const mission = await this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.scriptures', 'scriptures')
      .where('mission.date = :date', { date })
      .andWhere('mission.isActive = :isActive', { isActive: true })
      .orderBy('scriptures.order', 'ASC')
      .getOne();

    if (!mission) {
      return null;
    }

    // 미션 통계 계산 (기존 로직 유지)
    const completionCount = await this.userMissionsRepository.count({
      where: {
        mission: { id: mission.id },
        isCompleted: true,
      },
    });

    const totalUsers = await this.usersRepository.count({
      where: { isActive: true },
    });

    mission.completionCount = completionCount;
    mission.totalUsers = totalUsers;
    mission.completionRate =
      totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;

    return mission;
  }

  async toggleCompletion(
    missionId: string,
    userId: string,
  ): Promise<{ completed: boolean }> {
    await this.findOne(missionId);

    let userMission = await this.userMissionsRepository.findOne({
      where: { missionId, userId },
    });

    if (!userMission) {
      // 새로운 UserMission 생성
      userMission = this.userMissionsRepository.create({
        missionId,
        userId,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      // 기존 UserMission 토글
      userMission.isCompleted = !userMission.isCompleted;
      userMission.completedAt = userMission.isCompleted ? new Date() : null;
    }

    await this.userMissionsRepository.save(userMission);
    return { completed: userMission.isCompleted };
  }

  async getCompletionStatus(
    missionId: string,
    userId: string,
  ): Promise<{ completed: boolean }> {
    const userMission = await this.userMissionsRepository.findOne({
      where: { missionId, userId },
    });

    return { completed: userMission?.isCompleted || false };
  }

  async getUserProgress(userId: string, month?: string) {
    const queryBuilder = this.userMissionsRepository
      .createQueryBuilder('userMission')
      .leftJoinAndSelect('userMission.mission', 'mission')
      .where('userMission.userId = :userId', { userId })
      .orderBy('mission.date', 'DESC');

    if (month) {
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 2,
        0,
      );

      // DATE 타입 컬럼에 맞춰 YYYY-MM-DD 형식으로 변환
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      queryBuilder.andWhere(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth: startDateStr,
          endOfMonth: endDateStr,
        },
      );
    }

    const userMissions = await queryBuilder.getMany();

    const totalMissions = userMissions.length;
    const completedMissions = userMissions.filter(
      (um) => um.isCompleted,
    ).length;
    const completionRate =
      totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    return {
      userMissions,
      totalMissions,
      completedMissions,
      completionRate,
    };
  }

  // Admin only methods
  async createMission(createMissionDto: CreateMissionDto): Promise<Mission> {
    const { date, scriptures, title, description } = createMissionDto;

    const existingMission = await this.missionsRepository
      .createQueryBuilder('mission')
      .where('mission.date = :date', { date })
      .getOne();

    if (existingMission) {
      throw new ConflictException('Mission for this date already exists');
    }

    const mission = this.missionsRepository.create({
      date,
      title,
      description,
    });

    const savedMission = await this.missionsRepository.save(mission);

    // 성경구절들 저장
    if (scriptures && scriptures.length > 0) {
      const missionScriptures = scriptures.map((scripture) =>
        this.missionScripturesRepository.create({
          ...scripture,
          missionId: savedMission.id,
        }),
      );

      await this.missionScripturesRepository.save(missionScriptures);
    }

    return savedMission;
  }

  async updateMission(
    id: string,
    updateMissionDto: UpdateMissionDto,
  ): Promise<Mission> {
    // 트랜잭션 내에서 업데이트 수행
    return await this.missionsRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const mission = await transactionalEntityManager.findOne(Mission, {
          where: { id, isActive: true },
          relations: ['scriptures'],
        });

        if (!mission) {
          throw new NotFoundException('Mission not found');
        }

        // 날짜가 변경되는 경우 중복 체크
        if (updateMissionDto.date) {
          const existingMission = await transactionalEntityManager
            .createQueryBuilder(Mission, 'mission')
            .where('mission.date = :date', { date: updateMissionDto.date })
            .andWhere('mission.id != :id', { id })
            .getOne();

          if (existingMission) {
            throw new ConflictException('Mission for this date already exists');
          }
        }

        // 기존 성경구절들 완전 삭제 (CASCADE로 자동 삭제되지만 명시적으로 처리)
        if (mission.scriptures && mission.scriptures.length > 0) {
          await transactionalEntityManager.delete('MissionScripture', {
            missionId: id,
          });
        }

        // 업데이트할 필드들 설정
        const { scriptures, ...missionUpdates } = updateMissionDto;

        // 미션 기본 정보 업데이트
        await transactionalEntityManager.update(Mission, id, {
          ...missionUpdates,
          date: updateMissionDto.date ? updateMissionDto.date : mission.date,
        });

        // 새로운 성경구절들 저장
        if (scriptures && scriptures.length > 0) {
          const missionScriptures = scriptures.map((scripture, index) => ({
            ...scripture,
            missionId: id,
            order: scripture.order ?? index, // order가 없으면 배열 인덱스 사용
          }));

          await transactionalEntityManager.save(
            'MissionScripture',
            missionScriptures,
          );
        }

        // 업데이트된 미션 반환 (관계 포함)
        const updatedMission = await transactionalEntityManager.findOne(
          Mission,
          {
            where: { id },
            relations: ['scriptures'],
          },
        );

        if (!updatedMission) {
          throw new NotFoundException('Updated mission not found');
        }

        return updatedMission;
      },
    );
  }

  async deleteMission(id: string): Promise<void> {
    const mission = await this.missionsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    // 사용자 활동이 있는지 체크
    const userMissionCount = await this.userMissionsRepository.count({
      where: { missionId: id },
    });

    if (userMissionCount > 0) {
      throw new ConflictException(
        'Cannot delete mission with user activities. Use soft delete instead.',
      );
    }

    await this.missionsRepository.remove(mission);
  }

  async softDeleteMission(id: string): Promise<Mission> {
    const mission = await this.missionsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!mission) {
      throw new NotFoundException('Mission not found');
    }

    mission.isActive = false;
    return await this.missionsRepository.save(mission);
  }

  async getAllMissionsForAdmin(getMissionsDto: GetMissionsDto) {
    const { startDate, endDate, month } = getMissionsDto;
    const queryBuilder = this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.scriptures', 'scriptures')
      .orderBy('mission.date', 'DESC')
      .addOrderBy('scriptures.order', 'ASC');

    if (month) {
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 2,
        0,
      );

      // DATE 타입 컬럼에 맞춰 YYYY-MM-DD 형식으로 변환
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];

      queryBuilder.andWhere(
        'mission.date BETWEEN :startOfMonth AND :endOfMonth',
        {
          startOfMonth: startDateStr,
          endOfMonth: endDateStr,
        },
      );
    } else {
      if (startDate) {
        queryBuilder.andWhere('mission.date >= :startDate', {
          startDate,
        });
      }
      if (endDate) {
        queryBuilder.andWhere('mission.date <= :endDate', {
          endDate,
        });
      }
    }

    const missions = await queryBuilder.getMany();

    // 각 미션에 완료 통계 추가
    for (const mission of missions) {
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      mission.completionCount = completionCount;
      mission.totalUsers = totalUsers;
      mission.completionRate =
        totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0;
    }

    return missions;
  }

  async getMissionStatistics() {
    const totalMissions = await this.missionsRepository.count({
      where: { isActive: true },
    });
    const totalUserMissions = await this.userMissionsRepository.count();
    const completedUserMissions = await this.userMissionsRepository.count({
      where: { isCompleted: true },
    });

    const overallCompletionRate =
      totalUserMissions > 0
        ? (completedUserMissions / totalUserMissions) * 100
        : 0;

    // 최근 7일 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const recentMissions = await this.missionsRepository
      .createQueryBuilder('mission')
      .leftJoinAndSelect('mission.scriptures', 'scriptures')
      .where('mission.date >= :sevenDaysAgo', { sevenDaysAgo: sevenDaysAgoStr })
      .andWhere('mission.isActive = :isActive', { isActive: true })
      .orderBy('mission.date', 'DESC')
      .addOrderBy('scriptures.order', 'ASC')
      .getMany();

    const recentStats: any[] = [];
    for (const mission of recentMissions) {
      const completionCount = await this.userMissionsRepository.count({
        where: { missionId: mission.id, isCompleted: true },
      });
      const totalUsers = await this.userMissionsRepository.count({
        where: { missionId: mission.id },
      });

      // scriptures에서 첫 번째 구절로 제목 생성
      let defaultTitle = '미션';
      if (mission.scriptures && mission.scriptures.length > 0) {
        const firstScripture = mission.scriptures[0];
        defaultTitle = `${firstScripture.startBook} ${firstScripture.startChapter}장`;
      }

      recentStats.push({
        date: mission.date,
        title: mission.title || defaultTitle,
        completionCount,
        totalUsers,
        completionRate:
          totalUsers > 0 ? (completionCount / totalUsers) * 100 : 0,
      });
    }

    return {
      totalMissions,
      totalUserMissions,
      completedUserMissions,
      overallCompletionRate,
      recentStats,
    };
  }
}
