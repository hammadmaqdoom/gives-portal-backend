import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run() {
    const countAdmin = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.admin,
        },
      },
    });

    if (!countAdmin) {
      const adminEmail = 'admin@digitaro.co';
      const rawPassword = 'Digitaro123@'; // short but strong
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash(rawPassword, salt);

      await this.repository.save(
        this.repository.create({
          firstName: 'Super',
          lastName: 'Admin',
          email: adminEmail,
          password,
          role: {
            id: RoleEnum.superAdmin,
            name: 'SuperAdmin',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }

    // Also update existing admin@digitaro.co to super admin if it exists
    const existingAdmin = await this.repository.findOne({
      where: {
        email: 'admin@digitaro.co',
      },
    });

    if (existingAdmin && existingAdmin.role?.id !== RoleEnum.superAdmin) {
      existingAdmin.role = {
        id: RoleEnum.superAdmin,
        name: 'SuperAdmin',
      } as any;
      await this.repository.save(existingAdmin);
    }

    const countUser = await this.repository.count({
      where: {
        role: {
          id: RoleEnum.user,
        },
      },
    });

    if (!countUser) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      await this.repository.save(
        this.repository.create({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password,
          role: {
            id: RoleEnum.user,
            name: 'Admin',
          },
          status: {
            id: StatusEnum.active,
            name: 'Active',
          },
        }),
      );
    }
  }
}
