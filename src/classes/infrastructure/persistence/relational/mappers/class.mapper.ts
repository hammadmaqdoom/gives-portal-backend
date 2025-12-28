import { Injectable } from '@nestjs/common';
import { ClassEntity } from '../entities/class.entity';
import { Class } from '../../../../domain/class';
import { Subject } from '../../../../../subjects/domain/subject';
import { Teacher } from '../../../../../teachers/domain/teacher';
import { ClassSchedule } from '../../../../domain/class-schedule';
import { File } from '../../../../../files/domain/file';

@Injectable()
export class ClassMapper {
  toDomain(raw: ClassEntity): Class {
    const classObj = new Class();
    classObj.id = raw.id;
    classObj.name = raw.name;
    classObj.batchTerm = raw.batchTerm;
    classObj.weekdays = raw.weekdays || [];
    classObj.timing = raw.timing || '';
    classObj.timezone = raw.timezone || 'Asia/Karachi';
    classObj.courseOutline = raw.courseOutline;
    classObj.feeUSD = raw.feeUSD;
    classObj.feePKR = raw.feePKR;
    classObj.classMode = raw.classMode;
    (classObj as any).isPublicForSale = raw.isPublicForSale || false;
    (classObj as any).thumbnailUrl = raw.thumbnailUrl;
    (classObj as any).coverImageUrl = raw.coverImageUrl;
    (classObj as any).features = raw.features;

    // Map file entities
    if (raw.thumbnailFile) {
      (classObj as any).thumbnailFile = {
        id: raw.thumbnailFile.id,
        filename: raw.thumbnailFile.filename,
        originalName: raw.thumbnailFile.originalName,
        path: raw.thumbnailFile.path,
        url: raw.thumbnailFile.url,
        size: raw.thumbnailFile.size,
        mimeType: raw.thumbnailFile.mimeType,
        uploadedBy: raw.thumbnailFile.uploadedBy,
        uploadedAt: raw.thumbnailFile.uploadedAt,
        contextId: raw.thumbnailFile.contextId,
        createdAt: raw.thumbnailFile.createdAt,
        updatedAt: raw.thumbnailFile.updatedAt,
        deletedAt: raw.thumbnailFile.deletedAt,
      } as File;
    }

    if (raw.coverImageFile) {
      (classObj as any).coverImageFile = {
        id: raw.coverImageFile.id,
        filename: raw.coverImageFile.filename,
        originalName: raw.coverImageFile.originalName,
        path: raw.coverImageFile.path,
        url: raw.coverImageFile.url,
        size: raw.coverImageFile.size,
        mimeType: raw.coverImageFile.mimeType,
        uploadedBy: raw.coverImageFile.uploadedBy,
        uploadedAt: raw.coverImageFile.uploadedAt,
        contextId: raw.coverImageFile.contextId,
        createdAt: raw.coverImageFile.createdAt,
        updatedAt: raw.coverImageFile.updatedAt,
        deletedAt: raw.coverImageFile.deletedAt,
      } as File;
    }
    classObj.createdAt = raw.createdAt;
    classObj.updatedAt = raw.updatedAt;
    classObj.deletedAt = raw.deletedAt;

    if (raw.subject) {
      classObj.subject = {
        id: raw.subject.id,
        name: raw.subject.name,
        description: raw.subject.description,
        createdAt: raw.subject.createdAt,
        updatedAt: raw.subject.updatedAt,
        deletedAt: raw.subject.deletedAt,
      } as Subject;
    }

    if (raw.teacher) {
      classObj.teacher = {
        id: raw.teacher.id,
        name: raw.teacher.name,
        email: raw.teacher.email,
        phone: raw.teacher.phone,
        commissionPercentage: raw.teacher.commissionPercentage,
        subjectsAllowed: raw.teacher.subjectsAllowed,
        createdAt: raw.teacher.createdAt,
        updatedAt: raw.teacher.updatedAt,
        deletedAt: raw.teacher.deletedAt,
      } as Teacher;
    }

    if (raw.schedules) {
      classObj.schedules = raw.schedules.map(
        (schedule) =>
          ({
            id: schedule.id,
            classId: schedule.classId,
            weekday: schedule.weekday,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            timezone: schedule.timezone,
            isActive: schedule.isActive,
            effectiveFrom: schedule.effectiveFrom,
            effectiveUntil: schedule.effectiveUntil,
            notes: schedule.notes,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt,
            deletedAt: schedule.deletedAt,
          }) as ClassSchedule,
      );
    }

    return classObj;
  }

  toPersistence(classObj: Partial<Class>): Partial<ClassEntity> {
    const classEntity = new ClassEntity();

    if (classObj.id !== undefined) {
      classEntity.id = classObj.id;
    }
    if (classObj.name !== undefined) {
      classEntity.name = classObj.name;
    }
    if (classObj.batchTerm !== undefined) {
      classEntity.batchTerm = classObj.batchTerm;
    }
    if (classObj.weekdays !== undefined) {
      classEntity.weekdays = classObj.weekdays;
    }
    if (classObj.timing !== undefined) {
      classEntity.timing = classObj.timing;
    }
    if (classObj.timezone !== undefined) {
      classEntity.timezone = classObj.timezone;
    }
    if (classObj.courseOutline !== undefined) {
      classEntity.courseOutline = classObj.courseOutline;
    }
    if (classObj.feeUSD !== undefined) {
      classEntity.feeUSD = classObj.feeUSD;
    }
    if (classObj.feePKR !== undefined) {
      classEntity.feePKR = classObj.feePKR;
    }
    if (classObj.classMode !== undefined) {
      classEntity.classMode = classObj.classMode;
    }
    if ((classObj as any).isPublicForSale !== undefined) {
      classEntity.isPublicForSale = (classObj as any).isPublicForSale;
    }
    if ((classObj as any).thumbnailUrl !== undefined) {
      classEntity.thumbnailUrl = (classObj as any).thumbnailUrl;
    }
    if ((classObj as any).coverImageUrl !== undefined) {
      classEntity.coverImageUrl = (classObj as any).coverImageUrl;
    }
    if ((classObj as any).features !== undefined) {
      classEntity.features = (classObj as any).features;
    }

    // Map relations by id if provided as nested objects
    if ((classObj as any).subject?.id !== undefined) {
      (classEntity as any).subject = {
        id: (classObj as any).subject.id,
      } as any;
    }
    if ((classObj as any).teacher?.id !== undefined) {
      (classEntity as any).teacher = {
        id: (classObj as any).teacher.id,
      } as any;
    }

    // Map file relations by id
    if ((classObj as any).thumbnailFile?.id !== undefined) {
      (classEntity as any).thumbnailFile = {
        id: (classObj as any).thumbnailFile.id,
      } as any;
    } else if ((classObj as any).thumbnailFileId !== undefined) {
      (classEntity as any).thumbnailFile = (classObj as any).thumbnailFileId
        ? { id: (classObj as any).thumbnailFileId }
        : null;
    }

    if ((classObj as any).coverImageFile?.id !== undefined) {
      (classEntity as any).coverImageFile = {
        id: (classObj as any).coverImageFile.id,
      } as any;
    } else if ((classObj as any).coverImageFileId !== undefined) {
      (classEntity as any).coverImageFile = (classObj as any).coverImageFileId
        ? { id: (classObj as any).coverImageFileId }
        : null;
    }

    return classEntity;
  }
}
