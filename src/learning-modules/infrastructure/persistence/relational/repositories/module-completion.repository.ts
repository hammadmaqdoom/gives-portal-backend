import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleCompletionEntity } from '../entities/module-completion.entity';

@Injectable()
export class ModuleCompletionRepository {
  constructor(
    @InjectRepository(ModuleCompletionEntity)
    private readonly repository: Repository<ModuleCompletionEntity>,
  ) {}

  async findByStudentAndModule(
    studentId: number,
    moduleId: number,
  ): Promise<ModuleCompletionEntity | null> {
    return this.repository.findOne({
      where: { studentId, moduleId },
    });
  }

  async findByStudent(studentId: number): Promise<ModuleCompletionEntity[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['module'],
    });
  }

  async findByModule(moduleId: number): Promise<ModuleCompletionEntity[]> {
    return this.repository.find({
      where: { moduleId },
      relations: ['student'],
    });
  }

  async save(entity: ModuleCompletionEntity): Promise<ModuleCompletionEntity> {
    return this.repository.save(entity);
  }

  async create(
    data: Partial<ModuleCompletionEntity>,
  ): Promise<ModuleCompletionEntity> {
    return this.repository.create(data);
  }
}
