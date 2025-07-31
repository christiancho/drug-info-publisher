import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugsService } from './drugs.service';
import { DrugsController } from './drugs.controller';
import { Drug } from './entities/drug.entity';
import { DrugContent } from './entities/drug-content.entity';
import { AiSeoDrugContent } from './entities/ai-seo-drug-content.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Drug, DrugContent, AiSeoDrugContent]), AiModule],
  controllers: [DrugsController],
  providers: [DrugsService],
  exports: [DrugsService],
})
export class DrugsModule {}