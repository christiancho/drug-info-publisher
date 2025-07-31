import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Drug } from './entities/drug.entity';
import { DrugContent } from './entities/drug-content.entity';
import { CreateDrugDto } from './dto/create-drug.dto';
import { UpdateDrugDto } from './dto/update-drug.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DrugsService {
  constructor(
    @InjectRepository(Drug)
    private drugsRepository: Repository<Drug>,
    @InjectRepository(DrugContent)
    private drugContentRepository: Repository<DrugContent>,
  ) {}

  async create(createDrugDto: CreateDrugDto): Promise<Drug> {
    const drug = this.drugsRepository.create(createDrugDto);
    return this.drugsRepository.save(drug);
  }

  async findAll(search?: string, limit: number = 20, offset: number = 0): Promise<{ drugs: Drug[]; total: number }> {
    const query = this.drugsRepository.createQueryBuilder('drug');

    if (search) {
      query.leftJoin('drug.content', 'content')
        .where(
          'drug.drugName ILIKE :search OR content.genericName ILIKE :search',
          { search: `%${search}%` }
        );
    }

    query.take(limit).skip(offset);
    query.orderBy('drug.drugName', 'ASC');

    const [drugs, total] = await query.getManyAndCount();
    return { drugs, total };
  }

  async findOne(id: string): Promise<Drug> {
    const drug = await this.drugsRepository.findOne({ 
      where: { id },
      relations: ['content']
    });
    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }
    return drug;
  }

  async findBySlug(slug: string): Promise<Drug> {
    const drug = await this.drugsRepository.findOne({ 
      where: { slug },
      relations: ['content']
    });
    if (!drug) {
      throw new NotFoundException(`Drug with slug ${slug} not found`);
    }
    return drug;
  }

  async update(id: string, updateDrugDto: UpdateDrugDto): Promise<Drug> {
    const drug = await this.findOne(id);
    Object.assign(drug, updateDrugDto);
    return this.drugsRepository.save(drug);
  }

  async remove(id: string): Promise<void> {
    const drug = await this.findOne(id);
    await this.drugsRepository.remove(drug);
  }

  async updateBySlug(slug: string, updateDrugDto: UpdateDrugDto): Promise<Drug> {
    const drug = await this.findBySlug(slug);
    Object.assign(drug, updateDrugDto);
    return this.drugsRepository.save(drug);
  }

  async removeBySlug(slug: string): Promise<void> {
    const drug = await this.findBySlug(slug);
    await this.drugsRepository.remove(drug);
  }

  async loadDataFromJson(): Promise<{ loaded: number; errors: any[] }> {
    const dataDir = path.join(process.cwd(), 'data');
    const files = fs.readdirSync(dataDir).filter(file => file.startsWith('chunk_') && file.endsWith('.json'));
    
    let loaded = 0;
    const errors = [];

    for (const file of files) {
      try {
        const filePath = path.join(dataDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        for (const item of data) {
          try {
            const existingDrug = await this.drugsRepository.findOne({ 
              where: { setId: item.setId } 
            });

            if (!existingDrug) {
              const drugData = this.mapJsonToDrug(item);
              await this.create(drugData);
              loaded++;
            }
          } catch (itemError) {
            errors.push({ file, item: item.drugName || 'unknown', error: itemError.message });
          }
        }
      } catch (fileError) {
        errors.push({ file, error: fileError.message });
      }
    }

    return { loaded, errors };
  }

  private mapJsonToDrug(item: any): CreateDrugDto {
    const label = item.label || {};
    return {
      drugName: item.drugName,
      setId: item.setId,
      slug: item.slug,
      labeler: item.labeler,
      genericName: label.genericName,
      labelerName: label.labelerName,
      productType: label.productType,
      effectiveTime: label.effectiveTime,
      title: label.title,
      indicationsAndUsage: label.indicationsAndUsage,
      dosageAndAdministration: label.dosageAndAdministration,
      dosageFormsAndStrengths: label.dosageFormsAndStrengths,
      contraindications: label.contraindications,
      warningsAndPrecautions: label.warningsAndPrecautions,
      adverseReactions: label.adverseReactions,
      clinicalPharmacology: label.clinicalPharmacology,
      clinicalStudies: label.clinicalStudies,
      mechanismOfAction: label.mechanismOfAction,
      boxedWarning: label.boxedWarning,
      highlights: typeof label.highlights === 'object' ? JSON.stringify(label.highlights) : label.highlights,
    };
  }
}