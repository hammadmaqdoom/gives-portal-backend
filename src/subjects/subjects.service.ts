import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterSubjectDto, SortSubjectDto } from './dto/query-subject.dto';
import { SubjectRepository } from './infrastructure/persistence/subject.repository';
import { Subject } from './domain/subject';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly subjectsRepository: SubjectRepository) {}

  async create(createSubjectDto: CreateSubjectDto): Promise<Subject> {
    const existingSubject = await this.subjectsRepository.findByName(
      createSubjectDto.name,
    );
    if (existingSubject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectNameAlreadyExists',
        },
      });
    }

    try {
      return await this.subjectsRepository.create(createSubjectDto);
    } catch (error) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectCreationFailed',
        },
      });
    }
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterSubjectDto | null;
    sortOptions?: SortSubjectDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Subject[]> {
    return this.subjectsRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: Subject['id']): Promise<NullableType<Subject>> {
    return this.subjectsRepository.findById(id);
  }

  async findByName(name: Subject['name']): Promise<NullableType<Subject>> {
    return this.subjectsRepository.findByName(name);
  }

  async update(
    id: Subject['id'],
    updateSubjectDto: UpdateSubjectDto,
  ): Promise<Subject | null> {
    if (updateSubjectDto.name) {
      const existingSubject = await this.subjectsRepository.findByName(
        updateSubjectDto.name,
      );
      if (existingSubject && existingSubject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            name: 'subjectNameAlreadyExists',
          },
        });
      }
    }

    try {
      return await this.subjectsRepository.update(id, updateSubjectDto);
    } catch (error) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectUpdateFailed',
        },
      });
    }
  }

  async remove(id: Subject['id']): Promise<void> {
    try {
      await this.subjectsRepository.remove(id);
    } catch (error) {
      if (error.name === 'EntityNotFound') {
        throw new NotFoundException('Subject not found');
      }
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          name: 'subjectRemovalFailed',
        },
      });
    }
  }

  async bulkCreateFromFile(file: Express.Multer.File): Promise<{
    totalRows: number;
    successful: number;
    failed: number;
    results: Array<{
      row: number;
      name: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      subjectId?: number;
    }>;
  }> {
    // Parse the file
    let rows: any[] = [];

    try {
      if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')
      ) {
        const workbook = XLSX.read(file.buffer, {
          type: 'buffer',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
        });
      } else {
        throw new BadRequestException(
          'Invalid file type. Please upload a CSV or Excel file.',
        );
      }
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to parse file: ${error.message || 'Unknown error'}`,
      );
    }

    if (!rows || rows.length === 0) {
      throw new BadRequestException('File is empty or contains no data');
    }

    const results: Array<{
      row: number;
      name: string;
      status: 'success' | 'error' | 'skipped';
      message: string;
      subjectId?: number;
    }> = [];

    let successful = 0;
    let failed = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Extract and normalize data
        const name =
          row['Name'] ||
          row['name'] ||
          row['Subject Name'] ||
          row['SubjectName'] ||
          '';
        const description =
          row['Description'] ||
          row['description'] ||
          row['Desc'] ||
          '';
        const syllabusCode =
          row['Syllabus Code'] ||
          row['SyllabusCode'] ||
          row['syllabus_code'] ||
          row['Syllabus'] ||
          '';
        const level =
          row['Level'] ||
          row['level'] ||
          row['Educational Level'] ||
          row['EducationalLevel'] ||
          '';
        const officialLink =
          row['Official Link'] ||
          row['OfficialLink'] ||
          row['official_link'] ||
          row['Link'] ||
          row['URL'] ||
          '';

        // Validation
        if (!name || name.trim() === '') {
          results.push({
            row: rowNumber,
            name: name || 'Unknown',
            status: 'error',
            message: 'Name is required',
          });
          failed++;
          continue;
        }

        // Check if subject already exists
        const existingSubject = await this.subjectsRepository.findByName(
          name.trim(),
        );
        if (existingSubject) {
          results.push({
            row: rowNumber,
            name: name.trim(),
            status: 'skipped',
            message: 'Subject with this name already exists',
            subjectId: existingSubject.id,
          });
          failed++;
          continue;
        }

        // Create subject
        const createSubjectDto: CreateSubjectDto = {
          name: name.trim(),
          description: description?.trim() || undefined,
          syllabusCode: syllabusCode?.trim() || undefined,
          level: level?.trim() || undefined,
          officialLink: officialLink?.trim() || undefined,
        };

        const subject = await this.create(createSubjectDto);

        results.push({
          row: rowNumber,
          name: subject.name,
          status: 'success',
          message: 'Subject created successfully',
          subjectId: subject.id,
        });
        successful++;
      } catch (error: any) {
        const subjectName =
          row['Name'] ||
          row['name'] ||
          row['Subject Name'] ||
          row['SubjectName'] ||
          'Unknown';

        results.push({
          row: rowNumber,
          name: subjectName,
          status: 'error',
          message:
            error.message ||
            error.response?.message ||
            'Failed to create subject',
        });
        failed++;
      }
    }

    return {
      totalRows: rows.length,
      successful,
      failed,
      results,
    };
  }
}
