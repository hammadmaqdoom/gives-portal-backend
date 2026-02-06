import { Injectable } from '@nestjs/common';
import { StudentModuleNoteRepository } from './infrastructure/persistence/relational/repositories/student-module-note.repository';
import { SaveStudentNoteDto } from './dto/save-student-note.dto';

@Injectable()
export class StudentModuleNoteService {
  constructor(
    private readonly studentModuleNoteRepository: StudentModuleNoteRepository,
  ) {}

  async saveOrUpdate(dto: SaveStudentNoteDto): Promise<any> {
    const existing =
      await this.studentModuleNoteRepository.findByStudentAndModule(
        dto.studentId,
        dto.moduleId,
      );

    if (existing) {
      // Update existing note
      existing.noteContent = dto.noteContent || null;
      return this.studentModuleNoteRepository.save(existing);
    } else {
      // Create new note
      const note = await this.studentModuleNoteRepository.create({
        studentId: dto.studentId,
        moduleId: dto.moduleId,
        noteContent: dto.noteContent || null,
      });
      return this.studentModuleNoteRepository.save(note);
    }
  }

  async getStudentNotes(studentId: number): Promise<any[]> {
    return this.studentModuleNoteRepository.findByStudent(studentId);
  }

  async getModuleNotes(moduleId: number): Promise<any[]> {
    return this.studentModuleNoteRepository.findByModule(moduleId);
  }

  async getNoteForStudentAndModule(
    studentId: number,
    moduleId: number,
  ): Promise<any | null> {
    return this.studentModuleNoteRepository.findByStudentAndModule(
      studentId,
      moduleId,
    );
  }

  async deleteNote(studentId: number, moduleId: number): Promise<void> {
    const note =
      await this.studentModuleNoteRepository.findByStudentAndModule(
        studentId,
        moduleId,
      );
    if (note) {
      await this.studentModuleNoteRepository.delete(note);
    }
  }
}
