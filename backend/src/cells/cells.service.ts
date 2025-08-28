import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cell } from '../entities/cell.entity';
import { CellMember } from '../entities/cell-member.entity';
import { User, UserRole } from '../entities/user.entity';
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
}
