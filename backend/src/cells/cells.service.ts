import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Cell } from '../entities/cell.entity';
import { CellMember } from '../entities/cell-member.entity';
import { User, UserRole } from '../entities/user.entity';
import { UserMission } from '../entities/user-mission.entity';
import { CreateCellDto } from './dto/create-cell.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class CellsService {
  constructor(
    @InjectRepository(Cell)
    private cellsRepository: Repository<Cell>,
    @InjectRepository(CellMember)
    private cellMembersRepository: Repository<CellMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserMission)
    private userMissionsRepository: Repository<UserMission>,
  ) {}

  // 셀 생성 (관리자만 가능)
  async create(createCellDto: CreateCellDto, leaderId: string): Promise<Cell> {
    const cell = this.cellsRepository.create({
      ...createCellDto,
      leaderId,
    });

    return await this.cellsRepository.save(cell);
  }

  // 모든 셀 조회
  async findAll(): Promise<Cell[]> {
    return await this.cellsRepository.find({
      where: { isActive: true },
      relations: ['leader'],
      select: {
        leader: {
          id: true,
          name: true,
          email: true,
        },
      },
    });
  }

  // 단일 셀 조회
  async findOne(id: string): Promise<Cell> {
    const cell = await this.cellsRepository.findOne({
      where: { id, isActive: true },
      relations: ['leader', 'members', 'members.user'],
      select: {
        leader: {
          id: true,
          name: true,
          email: true,
        },
        members: {
          id: true,
          isActive: true,
          joinedAt: true,
          user: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!cell) {
      throw new NotFoundException('Cell not found');
    }

    // 활성 멤버만 필터링
    cell.members = cell.members.filter((member) => member.isActive);
    cell.memberCount = cell.members.length;

    return cell;
  }

  // 셀 수정 (리더 또는 관리자만 가능)
  async update(
    id: string,
    updateCellDto: UpdateCellDto,
    userId: string,
  ): Promise<Cell> {
    const cell = await this.findOne(id);

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 권한 확인 (리더 또는 관리자만)
    if (cell.leaderId !== userId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to update this cell',
      );
    }

    await this.cellsRepository.update(id, updateCellDto);
    return await this.findOne(id);
  }

  // 셀 삭제 (관리자만 가능)
  async remove(id: string, userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete cells');
    }

    const cell = await this.findOne(id);
    await this.cellsRepository.update(id, { isActive: false });
  }

  // 셀에 멤버 추가 (리더 또는 관리자만 가능)
  async addMember(
    cellId: string,
    addMemberDto: AddMemberDto,
    requesterId: string,
  ): Promise<CellMember> {
    const cell = await this.findOne(cellId);
    const requester = await this.usersRepository.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    // 권한 확인 (리더 또는 관리자만)
    if (cell.leaderId !== requesterId && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to add members to this cell',
      );
    }

    const user = await this.usersRepository.findOne({
      where: { id: addMemberDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 이미 다른 셀에 속해 있는지 확인
    const existingMembership = await this.cellMembersRepository.findOne({
      where: { userId: addMemberDto.userId, isActive: true },
    });

    if (existingMembership) {
      throw new ConflictException('User is already a member of another cell');
    }

    const member = this.cellMembersRepository.create({
      cellId,
      userId: addMemberDto.userId,
    });

    return await this.cellMembersRepository.save(member);
  }

  // 셀에서 멤버 제거 (리더 또는 관리자만 가능)
  async removeMember(
    cellId: string,
    memberId: string,
    requesterId: string,
  ): Promise<void> {
    const cell = await this.findOne(cellId);
    const requester = await this.usersRepository.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    // 권한 확인 (리더 또는 관리자만)
    if (cell.leaderId !== requesterId && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to remove members from this cell',
      );
    }

    const member = await this.cellMembersRepository.findOne({
      where: { id: memberId, cellId, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this cell');
    }

    await this.cellMembersRepository.update(memberId, {
      isActive: false,
      leftAt: new Date(),
    });
  }

  // 사용자의 셀 정보 조회
  async getUserCell(userId: string): Promise<Cell | null> {
    const membership = await this.cellMembersRepository.findOne({
      where: { userId, isActive: true },
      relations: ['cell', 'cell.leader'],
      select: {
        cell: {
          id: true,
          name: true,
          description: true,
          leader: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return membership ? membership.cell : null;
  }

  // 셀 리더인지 확인
  async isLeader(cellId: string, userId: string): Promise<boolean> {
    const cell = await this.cellsRepository.findOne({
      where: { id: cellId, leaderId: userId, isActive: true },
    });

    return !!cell;
  }

  // 셀 멤버인지 확인
  async isMember(cellId: string, userId: string): Promise<boolean> {
    const member = await this.cellMembersRepository.findOne({
      where: { cellId, userId, isActive: true },
    });

    return !!member;
  }

  // Admin only methods
  async createCell(createCellDto: CreateCellDto): Promise<Cell> {
    const { leaderId, name, description } = createCellDto;

    // 리더가 존재하는지 확인
    const leader = await this.usersRepository.findOne({
      where: { id: leaderId, isActive: true },
    });

    if (!leader) {
      throw new NotFoundException('Leader not found');
    }

    // 리더가 이미 다른 셀을 담당하고 있는지 확인
    const existingCell = await this.cellsRepository.findOne({
      where: { leaderId, isActive: true },
    });

    if (existingCell) {
      throw new ConflictException('This user is already leading another cell');
    }

    const cell = this.cellsRepository.create({
      name,
      description,
      leaderId,
    });

    return await this.cellsRepository.save(cell);
  }

  async updateCell(id: string, updateCellDto: UpdateCellDto): Promise<Cell> {
    const cell = await this.cellsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!cell) {
      throw new NotFoundException('Cell not found');
    }

    // 리더가 변경되는 경우 검증
    if (updateCellDto.leaderId && updateCellDto.leaderId !== cell.leaderId) {
      const newLeader = await this.usersRepository.findOne({
        where: { id: updateCellDto.leaderId, isActive: true },
      });

      if (!newLeader) {
        throw new NotFoundException('New leader not found');
      }

      // 새 리더가 이미 다른 셀을 담당하고 있는지 확인
      const existingCell = await this.cellsRepository.findOne({
        where: { leaderId: updateCellDto.leaderId, isActive: true },
      });

      if (existingCell) {
        throw new ConflictException(
          'This user is already leading another cell',
        );
      }
    }

    Object.assign(cell, updateCellDto);
    return await this.cellsRepository.save(cell);
  }

  async deleteCell(id: string): Promise<void> {
    const cell = await this.cellsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!cell) {
      throw new NotFoundException('Cell not found');
    }

    // 활성 멤버가 있는지 확인
    const activeMemberCount = await this.cellMembersRepository.count({
      where: { cellId: id, isActive: true },
    });

    if (activeMemberCount > 0) {
      throw new ConflictException('Cannot delete cell with active members');
    }

    cell.isActive = false;
    await this.cellsRepository.save(cell);
  }

  async getAllCellsForAdmin() {
    const cells = await this.cellsRepository.find({
      relations: ['leader'],
      select: {
        leader: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    });

    // 각 셀에 멤버 수 추가
    for (const cell of cells) {
      const memberCount = await this.cellMembersRepository.count({
        where: { cellId: cell.id, isActive: true },
      });
      cell.memberCount = memberCount;
    }

    return cells;
  }

  async getCellStatistics() {
    const totalCells = await this.cellsRepository.count({
      where: { isActive: true },
    });
    const totalMembers = await this.cellMembersRepository.count({
      where: { isActive: true },
    });
    const totalLeaders = await this.cellsRepository.count({
      where: { isActive: true },
    });

    // 가장 활발한 셀들 (최근 7일 미션 완료율 기준)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeCells = await this.cellsRepository.find({
      where: { isActive: true },
      relations: ['leader'],
      select: {
        leader: {
          id: true,
          name: true,
        },
      },
    });

    const cellActivities: any[] = [];
    for (const cell of activeCells) {
      const members = await this.cellMembersRepository.find({
        where: { cellId: cell.id, isActive: true },
        select: ['userId'],
      });

      const memberIds = members.map((m) => m.userId);

      if (memberIds.length > 0) {
        const totalMissions = await this.userMissionsRepository.count({
          where: {
            userId: memberIds.length === 1 ? memberIds[0] : undefined,
            createdAt: MoreThanOrEqual(sevenDaysAgo),
          },
        });

        const completedMissions = await this.userMissionsRepository.count({
          where: {
            userId: memberIds.length === 1 ? memberIds[0] : undefined,
            isCompleted: true,
            createdAt: MoreThanOrEqual(sevenDaysAgo),
          },
        });

        const completionRate =
          totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

        cellActivities.push({
          cellId: cell.id,
          cellName: cell.name,
          leaderName: cell.leader.name,
          memberCount: memberIds.length,
          totalMissions,
          completedMissions,
          completionRate,
        });
      }
    }

    // 완료율 기준으로 정렬
    cellActivities.sort((a, b) => b.completionRate - a.completionRate);

    return {
      totalCells,
      totalMembers,
      totalLeaders,
      averageMembersPerCell:
        totalCells > 0 ? Math.round(totalMembers / totalCells) : 0,
      topActiveCells: cellActivities.slice(0, 5),
      allCellActivities: cellActivities,
    };
  }

  async getCellDetailForAdmin(id: string) {
    const cell = await this.cellsRepository.findOne({
      where: { id },
      relations: ['leader'],
      select: {
        leader: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    });

    if (!cell) {
      throw new NotFoundException('Cell not found');
    }

    const members = await this.cellMembersRepository.find({
      where: { cellId: id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
        },
      },
      order: { joinedAt: 'DESC' },
    });

    // 각 멤버의 최근 활동 통계
    const memberStats: any[] = [];
    for (const member of members) {
      const recentMissions = await this.userMissionsRepository.count({
        where: {
          userId: member.userId,
          createdAt: MoreThanOrEqual(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ), // 최근 30일
        },
      });

      const completedMissions = await this.userMissionsRepository.count({
        where: {
          userId: member.userId,
          isCompleted: true,
          createdAt: MoreThanOrEqual(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ),
        },
      });

      memberStats.push({
        ...member,
        recentMissions,
        completedMissions,
        completionRate:
          recentMissions > 0 ? (completedMissions / recentMissions) * 100 : 0,
      });
    }

    return {
      ...cell,
      members: memberStats,
      memberCount: members.filter((m) => m.isActive).length,
    };
  }

  async addMemberToCell(
    cellId: string,
    addMemberDto: AddMemberDto,
  ): Promise<CellMember> {
    const { userId } = addMemberDto;

    // 셀 존재 확인
    const cell = await this.cellsRepository.findOne({
      where: { id: cellId, isActive: true },
    });

    if (!cell) {
      throw new NotFoundException('Cell not found');
    }

    // 사용자 존재 확인
    const user = await this.usersRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 이미 해당 셀의 멤버인지 확인
    const existingMember = await this.cellMembersRepository.findOne({
      where: { cellId, userId, isActive: true },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this cell');
    }

    // 다른 셀의 활성 멤버인지 확인
    const otherCellMembership = await this.cellMembersRepository.findOne({
      where: { userId, isActive: true },
    });

    if (otherCellMembership) {
      throw new ConflictException('User is already a member of another cell');
    }

    const member = this.cellMembersRepository.create({
      userId,
      cellId,
      role: 'member',
    });

    return await this.cellMembersRepository.save(member);
  }

  async removeMemberFromCell(cellId: string, userId: string): Promise<void> {
    const member = await this.cellMembersRepository.findOne({
      where: { cellId, userId, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this cell');
    }

    member.isActive = false;
    member.leftAt = new Date();
    await this.cellMembersRepository.save(member);
  }
}
