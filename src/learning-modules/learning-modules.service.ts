import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningModuleEntity } from './infrastructure/persistence/relational/entities/learning-module.entity';

@Injectable()
export class LearningModulesService {
  constructor(
    @InjectRepository(LearningModuleEntity)
    private readonly repo: Repository<LearningModuleEntity>,
  ) {}

  async list({ classId }: { classId?: number }) {
    const where = classId ? { class: { id: classId } } : ({} as any);
    // Pinned modules come first, then by order index
    return this.repo.find({
      where,
      order: {
        isPinned: 'DESC',
        orderIndex: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async getPinnedModules(classId?: number) {
    const where = classId
      ? { class: { id: classId }, isPinned: true }
      : ({ isPinned: true } as any);
    return this.repo.find({
      where,
      order: { orderIndex: 'ASC', createdAt: 'ASC' },
    });
  }

  async get(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async create(payload: Partial<LearningModuleEntity>) {
    const entity = this.repo.create(payload);
    return this.repo.save(entity);
  }

  async update(id: number, payload: Partial<LearningModuleEntity>) {
    await this.repo.update({ id }, payload);
    return this.get(id);
  }

  async remove(id: number) {
    await this.repo.delete({ id });
  }

  async togglePinned(id: number): Promise<LearningModuleEntity> {
    const module = await this.get(id);
    if (!module) {
      throw new Error('Learning module not found');
    }

    module.isPinned = !module.isPinned;
    return this.repo.save(module);
  }

  async linkZoomMeeting(
    id: number,
    zoomMeetingId: number,
  ): Promise<LearningModuleEntity> {
    const module = await this.get(id);
    if (!module) {
      throw new Error('Learning module not found');
    }

    module.zoomMeetingId = zoomMeetingId;
    return this.repo.save(module);
  }

  async unlinkZoomMeeting(id: number): Promise<LearningModuleEntity> {
    const module = await this.get(id);
    if (!module) {
      throw new Error('Learning module not found');
    }

    module.zoomMeetingId = null;
    module.zoomMeetingUrl = null;
    module.zoomMeetingPassword = null;
    module.zoomMeetingStartTime = null;
    module.zoomMeetingDuration = null;
    return this.repo.save(module);
  }
}
