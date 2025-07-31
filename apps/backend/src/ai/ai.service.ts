import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Drug } from '../drugs/entities/drug.entity';

interface AIEnhancedContent {
  title: string;
  metaDescription: string;
  summary: string;
  faq: string;
  relatedDrugs: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('CLAUDE_API_KEY');
    if (!apiKey) {
      this.logger.warn('CLAUDE_API_KEY not provided. AI features will be disabled.');
      return;
    }
    
    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  /**
   * Sanitize text using Claude AI to fix encoding issues, remove artifacts, and improve readability
   */
  async sanitizeTextWithAI(text: string, context?: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Claude API not configured');
    }

    if (!text || text.length === 0) {
      return text;
    }

    try {
      const prompt = this.buildSanitizationPrompt(text, context);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }
      const sanitizedText = content.text.trim();
      
      this.logger.log(`Sanitized text: ${text.length} → ${sanitizedText.length} characters`);
      return sanitizedText;
      
    } catch (error) {
      this.logger.error('Failed to sanitize text with AI', error);
      // Fallback to basic sanitization
      return this.basicTextSanitization(text);
    }
  }

  /**
   * Enhanced drug content using AI
   */
  async enhanceDrugContent(drug: Drug): Promise<AIEnhancedContent> {
    if (!this.anthropic) {
      throw new Error('Claude API not configured');
    }

    try {
      const prompt = this.buildEnhancementPrompt(drug);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }
      return this.parseAIResponse(content.text);
    } catch (error) {
      this.logger.error('Failed to enhance drug content with AI', error);
      throw new Error('AI content enhancement failed');
    }
  }

  /**
   * Generate SEO-optimized title
   */
  async generateSEOTitle(drugName: string, indications: string): Promise<string> {
    if (!this.anthropic) {
      return `${drugName} - Drug Information`;
    }

    try {
      const prompt = `Generate an SEO-optimized title (under 60 characters) for a drug information page about ${drugName}. 
      Key indications: ${this.stripHtml(indications?.substring(0, 200) || '')}.
      The title should be compelling for healthcare professionals and include the drug name.
      Format: Just return the title, nothing else.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }
      return content.text.trim();
    } catch (error) {
      this.logger.error('Failed to generate SEO title', error);
      return `${drugName} - Drug Information`;
    }
  }

  /**
   * Generate meta description
   */
  async generateMetaDescription(drug: Drug): Promise<string> {
    if (!this.anthropic) {
      return `Comprehensive information about ${drug.drugName} including dosage, side effects, and clinical uses.`;
    }

    try {
      const prompt = `Generate an SEO-optimized meta description (under 160 characters) for ${drug.drugName}.
      Generic name: ${drug.content?.genericName || 'N/A'}
      Key indications: ${this.stripHtml(drug.content?.indicationsAndUsage?.substring(0, 300) || '')}
      
      The description should be informative for healthcare professionals and include key therapeutic uses.
      Format: Just return the meta description, nothing else.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }
      return content.text.trim();
    } catch (error) {
      this.logger.error('Failed to generate meta description', error);
      return `Comprehensive information about ${drug.drugName} including dosage, side effects, and clinical uses.`;
    }
  }

  /**
   * Build sanitization prompt for Claude
   */
  private buildSanitizationPrompt(text: string, context?: string): string {
    return `Please clean and sanitize this text from an FDA drug label. Fix encoding issues, remove artifacts, and improve readability while preserving all medical information and HTML structure.

${context ? `Context: This text is from the ${context} section of a drug label.` : ''}

Common issues to fix:
- Encoding artifacts like "Â" characters
- Malformed HTML entities 
- Inconsistent spacing and formatting
- Invisible or control characters
- Broken Unicode characters
- Redundant whitespace

IMPORTANT: 
- Preserve all medical information exactly
- Keep HTML tags and structure intact
- Fix only formatting/encoding issues, not medical content
- Return only the cleaned text, no explanations

Text to clean:
${text}`;
  }

  /**
   * Build enhancement prompt for drug content
   */
  private buildEnhancementPrompt(drug: Drug): string {
    return `As a medical information expert, analyze this FDA drug label data and provide enhanced content for healthcare professionals.

Drug: ${drug.drugName} (${drug.content?.genericName || 'Generic name not specified'})

FDA Label Information:
- Indications: ${this.stripHtml(drug.content?.indicationsAndUsage?.substring(0, 500) || 'Not specified')}
- Dosage: ${this.stripHtml(drug.content?.dosageAndAdministration?.substring(0, 500) || 'Not specified')}
- Warnings: ${this.stripHtml(drug.content?.warningsAndPrecautions?.substring(0, 500) || 'Not specified')}
- Mechanism: ${this.stripHtml(drug.content?.mechanismOfAction?.substring(0, 300) || 'Not specified')}

Please provide:

1. SEO_TITLE: An optimized page title (under 60 characters) for healthcare professionals
2. META_DESCRIPTION: A compelling meta description (under 160 characters) highlighting key therapeutic uses
3. SUMMARY: A 2-3 paragraph provider-friendly summary explaining what this drug is, how it works, and key clinical considerations
4. FAQ: 5 common questions healthcare providers might have about this drug with concise answers
5. RELATED_DRUGS: Suggest 3-5 related drugs in the same therapeutic class or for similar conditions

Format your response exactly like this:
SEO_TITLE: [title here]
META_DESCRIPTION: [description here]
SUMMARY: [summary here]
FAQ: [Q1: question? A1: answer. Q2: question? A2: answer. etc.]
RELATED_DRUGS: [drug1, drug2, drug3, etc.]

Keep all content medically accurate and appropriate for healthcare professionals.`;
  }

  /**
   * Basic text sanitization fallback
   */
  private basicTextSanitization(text: string): string {
    if (!text) return text;
    
    let sanitized = text;
    
    // Fix common encoding issues
    sanitized = sanitized
      .replace(/Â/g, '') // Remove standalone Â characters
      .replace(/â€™/g, "'") // Fix apostrophes
      .replace(/â€œ/g, '"') // Fix opening quotes
      .replace(/â€/g, '"') // Fix closing quotes
      .replace(/â€"/g, '—') // Fix em dashes
      .replace(/â€"/g, '–') // Fix en dashes
      .replace(/Ã¡/g, 'á') // Fix accented characters
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú');
    
    // Remove invisible characters and control characters
    sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    
    // Clean up whitespace
    sanitized = sanitized
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
    
    return sanitized.trim();
  }

  /**
   * Parse AI response for enhanced content
   */
  private parseAIResponse(response: string): AIEnhancedContent {
    const sections = {
      title: this.extractSection(response, 'SEO_TITLE'),
      metaDescription: this.extractSection(response, 'META_DESCRIPTION'),
      summary: this.extractSection(response, 'SUMMARY'),
      faq: this.extractSection(response, 'FAQ'),
      relatedDrugs: this.extractSection(response, 'RELATED_DRUGS'),
    };

    return sections;
  }

  /**
   * Extract section from AI response
   */
  private extractSection(text: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || '';
  }
}