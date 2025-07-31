import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugsService } from './drugs.service';
import { DrugsController } from './drugs.controller';
import { Drug } from './entities/drug.entity';
import { DrugContent } from './entities/drug-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Drug, DrugContent])],
  controllers: [DrugsController],
  providers: [DrugsService],
  exports: [DrugsService],
})
export class DrugsModule {}