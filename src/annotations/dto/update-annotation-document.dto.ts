import { PartialType } from '@nestjs/swagger';
import { CreateAnnotationDocumentDto } from './create-annotation-document.dto';

export class UpdateAnnotationDocumentDto extends PartialType(CreateAnnotationDocumentDto) {}
