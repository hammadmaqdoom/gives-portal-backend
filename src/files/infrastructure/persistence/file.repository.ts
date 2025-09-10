import { NullableType } from '../../../utils/types/nullable.type';
import { FileType } from '../../domain/file';

export abstract class FileRepository {
  abstract create(data: Omit<FileType, 'id'>): Promise<FileType>;

  abstract findById(id: FileType['id']): Promise<NullableType<FileType>>;

  abstract findByIds(ids: FileType['id'][]): Promise<FileType[]>;

  abstract findAll(): Promise<FileType[]>;

  abstract findByContext(
    contextType: string,
    contextId: string,
  ): Promise<FileType[]>;

  abstract findByUploadedBy(uploadedBy: string): Promise<FileType[]>;

  abstract update(
    id: FileType['id'],
    data: Partial<FileType>,
  ): Promise<FileType | null>;

  abstract delete(id: FileType['id']): Promise<void>;

  abstract deleteByContext(
    contextType: string,
    contextId: string,
  ): Promise<void>;

  abstract remove(id: FileType['id']): Promise<void>;
}
