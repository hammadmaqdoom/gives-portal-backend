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
    let entity = await this.repository.findOne({
      where: { teacherId, isActive: true },
    });
    
    // If no credentials exist, create a minimal record for OAuth-only connection
    // The S2S fields (zoomApiKey, zoomApiSecret, zoomAccountId) are required by the schema
    // but not needed for OAuth Authorization Code flow
    if (!entity) {
      entity = this.repository.create({
        teacherId,
        zoomApiKey: 'oauth-only', // Placeholder - not used for OAuth flow
        zoomApiSecret: 'oauth-only', // Placeholder - not used for OAuth flow
        zoomAccountId: 'oauth-only', // Placeholder - not used for OAuth flow
        zoomWebhookSecret: JSON.stringify(tokens),
        isActive: true,
      });
      await this.repository.save(entity);
    } else {
      entity.zoomWebhookSecret = JSON.stringify(tokens);
      await this.repository.save(entity);
    }
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
    teachers: {
      teacherId: number;
      name: string;
      email?: string | null;
      isConnected: boolean;
      lastUpdatedAt: Date | null;
    }[];
  }> {
    // Get all non-deleted teachers
    const teacherRows = await this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoin(
        'zoom_credentials',
        'zoom',
        'zoom.teacherId = teacher.id AND zoom.isActive = :isActive',
        { isActive: true },
      )
      .where('teacher.deletedAt IS NULL')
      .select([
        'teacher.id AS teacherId',
        'teacher.name AS name',
        'teacher.email AS email',
        'zoom.id AS zoomId',
        'zoom.updatedAt AS zoomUpdatedAt',
      ])
      .getRawMany<{
        teacherId: number;
        name: string;
        email: string | null;
        zoomId: number | null;
        zoomUpdatedAt: Date | null;
      }>();

    const totalTeachers = teacherRows.length;
    const teachers = teacherRows.map((row) => ({
      teacherId: row.teacherId,
      name: row.name,
      email: row.email,
      isConnected: !!row.zoomId,
      lastUpdatedAt: row.zoomUpdatedAt,
    }));

    const connectedTeachers = teachers.filter((t) => t.isConnected).length;

    return {
      totalTeachers,
      connectedTeachers,
      notConnectedTeachers: totalTeachers - connectedTeachers,
      teachers,
    };
  }
}
