import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoomCredentialsEntity } from '../entities/zoom-credentials.entity';
import { ZoomCredentials } from '../../../../domain/zoom-credentials';
import { ZoomCredentialsRepository } from '../../zoom-credentials.repository';
import { ZoomCredentialsMapper } from '../mappers/zoom-credentials.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { TeacherEntity } from '../../../../../teachers/infrastructure/persistence/relational/entities/teacher.entity';

@Injectable()
export class RelationalZoomCredentialsRepository
  implements ZoomCredentialsRepository
{
  constructor(
    @InjectRepository(ZoomCredentialsEntity)
    private readonly repository: Repository<ZoomCredentialsEntity>,
    @InjectRepository(TeacherEntity)
    private readonly teacherRepository: Repository<TeacherEntity>,
  ) {}

  async create(
    data: Omit<ZoomCredentials, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ZoomCredentials> {
    const persistenceModel = ZoomCredentialsMapper.toPersistence(
      data as ZoomCredentials,
    );
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return ZoomCredentialsMapper.toDomain(newEntity);
  }

  async findByTeacherId(
    teacherId: number,
  ): Promise<NullableType<ZoomCredentials>> {
    const entity = await this.repository.findOne({
      where: { teacherId, isActive: true },
    });
    return entity ? ZoomCredentialsMapper.toDomain(entity) : null;
  }

  async update(
    teacherId: number,
    payload: DeepPartial<ZoomCredentials>,
  ): Promise<ZoomCredentials | null> {
    const entity = await this.repository.findOne({
      where: { teacherId, isActive: true },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.repository.save(
      this.repository.create({
        ...entity,
        ...payload,
      }),
    );

    return ZoomCredentialsMapper.toDomain(updatedEntity);
  }

  async deactivateByTeacherId(teacherId: number): Promise<void> {
    await this.repository.update({ teacherId }, { isActive: false });
  }

  async storeOAuthTokens(teacherId: number, tokens: any): Promise<void> {
    const entity = await this.repository.findOne({
      where: { teacherId, isActive: true },
    });
    if (!entity) throw new Error('Zoom credentials not found');
    entity.zoomWebhookSecret = JSON.stringify(tokens);
    await this.repository.save(entity);
  }

  async getOAuthTokens(teacherId: number): Promise<any | null> {
    const entity = await this.repository.findOne({
      where: { teacherId, isActive: true },
    });
    if (!entity?.zoomWebhookSecret) return null;
    try {
      return JSON.parse(entity.zoomWebhookSecret);
    } catch {
      return null;
    }
  }

  async getTeacherStatistics(): Promise<{
    totalTeachers: number;
    connectedTeachers: number;
    notConnectedTeachers: number;
  }> {
    // Get total number of teachers
    const totalTeachers = await this.teacherRepository.count({
      where: { deletedAt: null as any },
    });

    // Get number of teachers with active Zoom credentials
    const connectedTeachers = await this.repository
      .createQueryBuilder('zoom_credentials')
      .where('zoom_credentials.isActive = :isActive', { isActive: true })
      .getCount();

    return {
      totalTeachers,
      connectedTeachers,
      notConnectedTeachers: totalTeachers - connectedTeachers,
    };
  }
}
