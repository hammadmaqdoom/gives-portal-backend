import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentModuleNoteEntity } from '../entities/student-module-note.entity';

@Injectable()
export class StudentModuleNoteRepository {
  constructor(
    @InjectRepository(StudentModuleNoteEntity)
    private readonly repository: Repository<StudentModuleNoteEntity>,
  ) {}

  async findByStudentAndModule(
    studentId: number,
    moduleId: number,
  ): Promise<StudentModuleNoteEntity | null> {
    return this.repository.findOne({
      where: { studentId, moduleId },
    });
  }

  async findByStudent(studentId: number): Promise<StudentModuleNoteEntity[]> {
    return this.repository.find({
      where: { studentId },
      relations: ['module'],
    });
  }

  async findByModule(moduleId: number): Promise<StudentModuleNoteEntity[]> {
    return this.repository.find({
      where: { moduleId },
      relations: ['student'],
    });
  }

  async save(entity: StudentModuleNoteEntity): Promise<StudentModuleNoteEntity> {
    return this.repository.save(entity);
  }

  async create(
    data: Partial<StudentModuleNoteEntity>,
  ): Promise<StudentModuleNoteEntity> {
    return this.repository.create(data);
  }

  async delete(entity: StudentModuleNoteEntity): Promise<void> {
    await this.repository.remove(entity);
  }
}
