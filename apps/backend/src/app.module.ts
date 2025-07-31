import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugsModule } from './drugs/drugs.module';
import { AiModule } from './ai/ai.module';
import { Drug } from './drugs/entities/drug.entity';
import { DrugContent } from './drugs/entities/drug-content.entity';
import { AiSeoDrugContent } from './drugs/entities/ai-seo-drug-content.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'prescriberpoint',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'prescriberpoint',
      entities: [Drug, DrugContent, AiSeoDrugContent],
      synchronize: true, // Set to false in production
    }),
    DrugsModule,
    AiModule,
  ],
})
export class AppModule {}