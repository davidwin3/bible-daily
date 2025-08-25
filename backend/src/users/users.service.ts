import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
      email: firebaseUser.email,
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
}
