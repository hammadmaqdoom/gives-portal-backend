import { PartialType } from '@nestjs/swagger';
import { CreateBatchTermDto } from './create-batch-term.dto';

export class UpdateBatchTermDto extends PartialType(CreateBatchTermDto) {}
