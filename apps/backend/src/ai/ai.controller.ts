import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';

class SanitizeTextDto {
  text: string;
  context?: string;
}

class EnhanceContentDto {
  drugId: string;
}

@ApiTags('ai')
@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('sanitize-text')
  @ApiOperation({ summary: 'Sanitize text using AI to fix encoding issues and improve readability' })
  @ApiBody({ type: SanitizeTextDto })
  @ApiResponse({ status: 200, description: 'Text sanitized successfully' })
  async sanitizeText(@Body() dto: SanitizeTextDto): Promise<{ sanitizedText: string }> {
    const sanitizedText = await this.aiService.sanitizeTextWithAI(dto.text, dto.context);
    return { sanitizedText };
  }

  @Post('generate-seo-title')
  @ApiOperation({ summary: 'Generate SEO-optimized title for a drug' })
  @ApiResponse({ status: 200, description: 'SEO title generated successfully' })
  async generateSEOTitle(
    @Body() dto: { drugName: string; indications: string }
  ): Promise<{ title: string }> {
    const title = await this.aiService.generateSEOTitle(dto.drugName, dto.indications);
    return { title };
  }

  @Post('generate-meta-description')
  @ApiOperation({ summary: 'Generate meta description for a drug' })
  @ApiResponse({ status: 200, description: 'Meta description generated successfully' })
  async generateMetaDescription(
    @Body() dto: { drugName: string; genericName?: string; indications: string }
  ): Promise<{ metaDescription: string }> {
    // Create a minimal drug object for the service
    const drugData = {
      drugName: dto.drugName,
      genericName: dto.genericName,
      indicationsAndUsage: dto.indications
    } as any;
    
    const metaDescription = await this.aiService.generateMetaDescription(drugData);
    return { metaDescription };
  }
}