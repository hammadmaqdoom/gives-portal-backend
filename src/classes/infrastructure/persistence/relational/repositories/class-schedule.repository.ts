import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassScheduleEntity } from '../entities/class-schedule.entity';
import { CreateClassScheduleDto } from '../../../../dto/class-schedule.dto';

@Injectable()
export class ClassScheduleRepository {
  constructor(
    @InjectRepository(ClassScheduleEntity)
    private readonly classScheduleRepository: Repository<ClassScheduleEntity>,
  ) {}

  async createMany(
    schedules: CreateClassScheduleDto[],
    classId: number,
  ): Promise<ClassScheduleEntity[]> {
    const scheduleEntities = schedules.map((schedule) =>
      this.classScheduleRepository.create({
        ...schedule,
        classId,
        effectiveFrom: schedule.effectiveFrom
          ? new Date(schedule.effectiveFrom)
          : undefined,
        effectiveUntil: schedule.effectiveUntil
          ? new Date(schedule.effectiveUntil)
          : undefined,
      }),
    );

    return this.classScheduleRepository.save(scheduleEntities);
  }

  async updateMany(
    classId: number,
    schedules: CreateClassScheduleDto[],
  ): Promise<ClassScheduleEntity[]> {
    // Delete existing schedules for this class
    await this.classScheduleRepository.delete({ classId });

    // Create new schedules
    return this.createMany(schedules, classId);
  }

  async deleteByClassId(classId: number): Promise<void> {
    await this.classScheduleRepository.delete({ classId });
  }

  async findByClassId(classId: number): Promise<ClassScheduleEntity[]> {
    return this.classScheduleRepository.find({
      where: { classId },
      order: { weekday: 'ASC', startTime: 'ASC' },
    });
  }
}
