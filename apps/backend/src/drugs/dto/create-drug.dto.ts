import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDrugDto {
  @ApiProperty()
  @IsString()
  drugName: string;

  @ApiProperty()
  @IsString()
  setId: string;

  @ApiProperty()
  @IsString()
  slug: string;

  @ApiProperty()
  @IsString()
  labeler: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genericName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  labelerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  effectiveTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  indicationsAndUsage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dosageAndAdministration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dosageFormsAndStrengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contraindications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warningsAndPrecautions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adverseReactions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicalPharmacology?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicalStudies?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mechanismOfAction?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boxedWarning?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  highlights?: string;
}