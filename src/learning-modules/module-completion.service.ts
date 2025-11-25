import { Injectable } from '@nestjs/common';
import { ModuleCompletionRepository } from './infrastructure/persistence/relational/repositories/module-completion.repository';
import { MarkModuleCompleteDto } from './dto/mark-module-complete.dto';

@Injectable()
export class ModuleCompletionService {
  constructor(
    private readonly moduleCompletionRepository: ModuleCompletionRepository,
  ) {}

  async markAsComplete(dto: MarkModuleCompleteDto): Promise<any> {
    const existing =
      await this.moduleCompletionRepository.findByStudentAndModule(
        dto.studentId,
        dto.moduleId,
      );

    if (existing) {
      // Update existing completion
      existing.isCompleted = dto.isCompleted;
      existing.completedAt = dto.isCompleted ? new Date() : null;
      return this.moduleCompletionRepository.save(existing);
    } else {
      // Create new completion
      const completion = await this.moduleCompletionRepository.create({
        studentId: dto.studentId,
        moduleId: dto.moduleId,
        isCompleted: dto.isCompleted,
        completedAt: dto.isCompleted ? new Date() : null,
      });
      return this.moduleCompletionRepository.save(completion);
    }
  }

  async getStudentCompletions(studentId: number): Promise<any[]> {
    return this.moduleCompletionRepository.findByStudent(studentId);
  }

  async getModuleCompletions(moduleId: number): Promise<any[]> {
    return this.moduleCompletionRepository.findByModule(moduleId);
  }

  async isModuleCompletedByStudent(
    studentId: number,
    moduleId: number,
  ): Promise<boolean> {
    const completion =
      await this.moduleCompletionRepository.findByStudentAndModule(
        studentId,
        moduleId,
      );
    return completion?.isCompleted || false;
  }
}
