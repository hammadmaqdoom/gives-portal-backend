import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningModuleEntity } from './infrastructure/persistence/relational/entities/learning-module.entity';
import { LearningModuleSectionEntity } from './infrastructure/persistence/relational/entities/learning-module-section.entity';
import { ModuleCompletionEntity } from './infrastructure/persistence/relational/entities/module-completion.entity';
import { AccessControlService } from '../access-control/access-control.service';
import { FilesService } from '../files/files.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class LearningModulesService {
  constructor(
    @InjectRepository(LearningModuleEntity)
    private readonly repo: Repository<LearningModuleEntity>,
    @InjectRepository(LearningModuleSectionEntity)
    private readonly sectionRepo: Repository<LearningModuleSectionEntity>,
    @InjectRepository(ModuleCompletionEntity)
    private readonly completionRepo: Repository<ModuleCompletionEntity>,
    @Inject(forwardRef(() => AccessControlService))
    private readonly accessControlService: AccessControlService,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
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
    // Validate videoFileId if provided
    if (payload.videoFileId) {
      await this.validateVideoFile(payload.videoFileId, payload.classId);
    }

    const entity = this.repo.create(payload);
    return this.repo.save(entity);
  }

  async update(id: number, payload: Partial<LearningModuleEntity>) {
    // Get existing module to check classId
    const existingModule = await this.get(id);
    if (!existingModule) {
      throw new BadRequestException('Module not found');
    }

    // Validate videoFileId if provided
    if (payload.videoFileId) {
      const classId = payload.classId || existingModule.classId;
      await this.validateVideoFile(payload.videoFileId, classId);
    }

    await this.repo.update({ id }, payload);
    return this.get(id);
  }

  /**
   * Validate that a video file exists, belongs to the class, and is a video file
   */
  private async validateVideoFile(
    videoFileId: string,
    classId?: number | null,
  ): Promise<void> {
    if (!videoFileId) {
      return;
    }

    const file = await this.filesService.getFileById(videoFileId);
    if (!file) {
      throw new BadRequestException('Video file not found');
    }

    // Check if it's a video file
    if (!file.mimeType.startsWith('video/')) {
      throw new BadRequestException('File is not a video file');
    }

    // If classId is provided, verify the file belongs to that class
    if (classId) {
      if (file.contextType !== 'class' || file.contextId !== classId.toString()) {
        throw new BadRequestException(
          'Video file does not belong to this class',
        );
      }
    }
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

  // Sections CRUD
  async listSectionsByClass(
    classId: number,
  ): Promise<LearningModuleSectionEntity[]> {
    return this.sectionRepo.find({
      where: { classId },
      order: { orderIndex: 'ASC', id: 'ASC' },
    });
  }

  async createSection(
    classId: number,
    title: string,
    orderIndex = 0,
  ): Promise<LearningModuleSectionEntity> {
    const section = this.sectionRepo.create({ classId, title, orderIndex });
    return this.sectionRepo.save(section);
  }

  async updateSection(
    sectionId: number,
    payload: Partial<LearningModuleSectionEntity>,
  ): Promise<LearningModuleSectionEntity> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');
    Object.assign(section, payload);
    return this.sectionRepo.save(section);
  }

  async deleteSection(sectionId: number): Promise<void> {
    // Ensure no modules remain in this section
    const mods = await this.repo.find({ where: { sectionId } as any });
    if (mods.length > 0) {
      // Hard delete modules in section prior to removing section
      const ids = mods.map((m) => m.id);
      await this.repo.delete(ids);
    }
    await this.sectionRepo.delete(sectionId);
  }

  async createModuleInSection(
    sectionId: number,
    modulePayload: Partial<LearningModuleEntity>,
  ): Promise<LearningModuleEntity> {
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');
    const module = this.repo.create({
      ...modulePayload,
      classId: section.classId,
      sectionId: section.id,
    });
    return this.repo.save(module);
  }

  async moveModuleToSection(
    moduleId: number,
    sectionId: number,
  ): Promise<LearningModuleEntity> {
    const module = await this.repo.findOne({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('Module not found');
    const section = await this.sectionRepo.findOne({
      where: { id: sectionId },
    });
    if (!section) throw new NotFoundException('Section not found');
    module.sectionId = sectionId;
    module.classId = section.classId;
    return this.repo.save(module);
  }

  // Drip Content Methods
  async getModulesForStudent(
    classId: number,
    studentId: number,
  ): Promise<LearningModuleEntity[]> {
    // Check payment status first
    const accessStatus = await this.accessControlService.checkCourseAccess(
      studentId,
      classId,
    );

    if (!accessStatus.hasAccess) {
      // Return empty array if payment not verified
      return [];
    }

    const allModules = await this.list({ classId });
    const completions = await this.getCompletedModules(studentId);
    const completedModuleIds = new Set(completions.map((c) => c.moduleId));

    return allModules.filter((module) => {
      // If drip content is not enabled for this module, show it
      if (!module.dripEnabled) return true;

      // Check if prerequisites are met
      if (module.dripPrerequisites && module.dripPrerequisites.length > 0) {
        const prerequisitesMet = module.dripPrerequisites.every((prereqId) =>
          completedModuleIds.has(prereqId),
        );
        if (!prerequisitesMet) return false;
      }

      // Check release date
      if (module.dripReleaseDate) {
        const now = new Date();
        if (now < module.dripReleaseDate) return false;
      }

      // Check delay days after prerequisites
      if (
        module.dripDelayDays &&
        module.dripPrerequisites &&
        module.dripPrerequisites.length > 0
      ) {
        const lastPrereqCompletion = Math.max(
          ...module.dripPrerequisites.map((prereqId) => {
            const completion = completions.find((c) => c.moduleId === prereqId);
            return completion
              ? new Date(
                  (completion.completedAt as Date) ||
                    (completion.createdAt as Date),
                ).getTime()
              : 0;
          }),
        );

        if (lastPrereqCompletion > 0) {
          const releaseTime =
            lastPrereqCompletion + module.dripDelayDays * 24 * 60 * 60 * 1000;
          if (Date.now() < releaseTime) return false;
        }
      }

      return true;
    });
  }

  // Module Completion Methods
  async markModuleCompleted(
    moduleId: number,
    studentId: number,
  ): Promise<ModuleCompletionEntity> {
    let completion = await this.completionRepo.findOne({
      where: { moduleId, studentId },
    });

    if (!completion) {
      completion = this.completionRepo.create({
        moduleId,
        studentId,
        isCompleted: true,
        completedAt: new Date(),
        progressPercentage: 100,
      });
    } else {
      completion.isCompleted = true;
      completion.completedAt = new Date();
      completion.progressPercentage = 100;
    }

    return this.completionRepo.save(completion);
  }

  async getCompletedModules(
    studentId: number,
  ): Promise<ModuleCompletionEntity[]> {
    return this.completionRepo.find({
      where: { studentId, isCompleted: true },
    });
  }

  async getModuleCompletion(
    moduleId: number,
    studentId: number,
  ): Promise<ModuleCompletionEntity | null> {
    return this.completionRepo.findOne({
      where: { moduleId, studentId },
    });
  }

  async updateModuleProgress(
    moduleId: number,
    studentId: number,
    progressPercentage: number,
    timeSpent?: number,
  ): Promise<ModuleCompletionEntity> {
    let completion = await this.completionRepo.findOne({
      where: { moduleId, studentId },
    });

    if (!completion) {
      completion = this.completionRepo.create({
        moduleId,
        studentId,
        progressPercentage,
        timeSpent: timeSpent || 0,
        isCompleted: progressPercentage >= 100,
        completedAt: progressPercentage >= 100 ? new Date() : null,
      });
      return this.completionRepo.save(completion);
    } else {
      const nextTimeSpent =
        (completion.timeSpent || 0) + (timeSpent !== undefined ? timeSpent : 0);
      const isCompleted = progressPercentage >= 100;
      const completedAt = isCompleted ? new Date() : null;

      await this.completionRepo.update(
        { id: completion.id },
        {
          moduleId,
          studentId,
          progressPercentage,
          timeSpent: nextTimeSpent,
          isCompleted,
          completedAt,
        },
      );
      // Return fresh entity
      return (await this.completionRepo.findOne({
        where: { id: completion.id },
      })) as ModuleCompletionEntity;
    }
  }
}
