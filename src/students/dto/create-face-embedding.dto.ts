import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateFaceEmbeddingDto {
  @ApiProperty({
    description:
      '128-float face descriptor produced by face-api.js on the client.',
    type: [Number],
    minItems: 64,
    maxItems: 512,
  })
  @IsArray()
  @ArrayMinSize(64)
  @ArrayMaxSize(512)
  @IsNumber({}, { each: true })
  embedding: number[];

  @ApiProperty({
    description:
      'Identifier for the model/version used to generate the embedding. Used to invalidate old vectors when the model is upgraded.',
    example: 'face-api.js@1.7.14/ssd_mobilenetv1',
  })
  @IsString()
  modelName: string;

  @ApiPropertyOptional({ example: 0.98, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  qualityScore?: number;

  @ApiPropertyOptional({
    description: 'Optional file id the embedding was derived from.',
  })
  @IsOptional()
  @IsInt()
  sourceFileId?: number;
}
