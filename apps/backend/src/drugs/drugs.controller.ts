import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DrugsService } from './drugs.service';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';
import { Drug } from './entities/drug.entity';

@ApiTags('drugs')
@Controller('api/drugs')
export class DrugsController {
  constructor(private readonly drugsService: DrugsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new drug' })
  @ApiResponse({ status: 201, description: 'Drug created successfully', type: Drug })
  create(@Body() createDrugDto: CreateDrugDto): Promise<Drug> {
    return this.drugsService.create(createDrugDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all drugs with optional search' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for drug name or indication' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results per page', type: Number })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of results to skip', type: Number })
  @ApiResponse({ status: 200, description: 'Drugs retrieved successfully' })
  findAll(
    @Query('search') search?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    return this.drugsService.findAll(search, limit, offset);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get drug by slug' })
  @ApiResponse({ status: 200, description: 'Drug found', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  findOne(@Param('slug') slug: string): Promise<Drug> {
    return this.drugsService.findBySlug(slug);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Update drug by slug' })
  @ApiResponse({ status: 200, description: 'Drug updated successfully', type: Drug })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  update(@Param('slug') slug: string, @Body() updateDrugDto: UpdateDrugDto): Promise<Drug> {
    return this.drugsService.updateBySlug(slug, updateDrugDto);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Delete drug by slug' })
  @ApiResponse({ status: 200, description: 'Drug deleted successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  remove(@Param('slug') slug: string): Promise<void> {
    return this.drugsService.removeBySlug(slug);
  }

  @Post('load-data')
  @ApiOperation({ summary: 'Load drug data from JSON files' })
  @ApiResponse({ status: 200, description: 'Data loading completed' })
  loadData() {
    return this.drugsService.loadDataFromJson();
  }
}