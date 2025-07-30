import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrugsModule } from './drugs/drugs.module';
import { AiModule } from './ai/ai.module';
import { McpModule } from './mcp/mcp.module';

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
      autoLoadEntities: true,
      synchronize: true, // Set to false in production
    }),
    DrugsModule,
    AiModule,
    McpModule,
  ],
})
export class AppModule {}