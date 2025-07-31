import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Callout,
  Card,
} from '@radix-ui/themes';
import { ArrowLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { renderContentNode } from '../../../components/JsonToReact/JsonToReact';

interface DrugContent {
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
  indicationsAndUsage?: any;
  dosageAndAdministration?: any;
  dosageFormsAndStrengths?: any;
  contraindications?: any;
  warningsAndPrecautions?: any;
  adverseReactions?: any;
  clinicalPharmacology?: any;
  clinicalStudies?: any;
  mechanismOfAction?: any;
  boxedWarning?: any;
  highlights?: any;
  description?: any;
  howSupplied?: any;
  instructionsForUse?: any;
  nonclinicalToxicology?: any;
  useInSpecificPopulations?: any;
  drugInteractions?: any;
}

interface AiSeoDrugContent {
  title: string;
  metaDescription: string;
  active: boolean;
}

interface Drug {
  slug: string;
  drugName: string;
  labeler?: string;
  brandName?: string;
  content?: DrugContent;
  aiSeoContents?: AiSeoDrugContent[];
}

async function getDrug(slug: string): Promise<Drug | null> {
  try {
    // Use different URLs for server-side (Docker internal) vs client-side
    const apiUrl = typeof window === 'undefined' 
      ? 'http://backend:3001' // Server-side: use Docker service name
      : 'http://localhost:3001'; // Client-side: use localhost
      
    const response = await fetch(`${apiUrl}/api/drugs/${slug}`, {
      cache: 'no-store', // Ensure fresh data on each request
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch drug');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching drug:', error);
    return null;
  }
}


export default async function DrugDetailPage({ params }: {
  params: { slug: string };
}) {
  const drug = await getDrug(params.slug);

  if (!drug) return notFound();

  // Generate structured data for SEO
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Drug",
      "name": drug.drugName,
      "url": `https://prescriberpoint.com/drugs/${drug.slug}`,
      "description": drug.aiSeoContents?.[0]?.metaDescription || `Comprehensive drug information for ${drug.drugName}`,
      ...(drug.content?.genericName && { "nonProprietaryName": drug.content.genericName }),
      ...(drug.brandName && { "tradeName": drug.brandName }),
      ...(drug.labeler && { "manufacturer": { "@type": "Organization", "name": drug.labeler } }),
      ...(drug.content?.dosageForm && { "dosageForm": drug.content.dosageForm }),
      ...(drug.content?.route && { "administrationRoute": drug.content.route }),
      ...(drug.content?.strength && { "drugUnit": drug.content.strength }),
      ...(drug.content?.indicationsAndUsage && { "indication": "See full prescribing information" }),
      ...(drug.content?.contraindications && { "contraindication": "See full prescribing information" }),
      ...(drug.content?.warningsAndPrecautions && { "warning": "See full prescribing information" }),
      ...(drug.content?.clinicalPharmacology && { "clinicalPharmacology": "See full prescribing information" }),
      ...(drug.content?.mechanismOfAction && { "mechanismOfAction": "See full prescribing information" }),
      "isProprietary": !!drug.brandName,
      "prescriptionStatus": "PrescriptionOnly"
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://prescriberpoint.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Drugs",
          "item": "https://prescriberpoint.com"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": drug.drugName,
          "item": `https://prescriberpoint.com/drugs/${drug.slug}`
        }
      ]
    }
  ];

  return (
    <Box>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* Header */}
      <Box className="prescriber-point-header" style={{ color: 'white', padding: '2rem 1rem' }}>
        <Container size="4">
          <Flex direction="column" align="start" gap="4">
            <Flex align="center" gap="2" style={{ fontSize: '14px', opacity: 0.9 }}>
              <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
                Home
              </Link>
              <ChevronRightIcon />
              <Text style={{ opacity: 0.8 }}>{drug.drugName}</Text>
            </Flex>
            
            <Button asChild variant="solid" size="2" style={{ backgroundColor: 'white', color: '#333' }}>
              <Link href="/">
                <ArrowLeftIcon width="16" height="16" />
                Back to Search
              </Link>
            </Button>
            
            <Heading size="8">
              {drug.aiSeoContents?.[0]?.title || drug.drugName}
            </Heading>
            
            <Flex direction="column" gap="2">
              {drug.content?.genericName && (
                <Text size="4" style={{ opacity: 0.9 }}>
                  {drug.content.genericName}
                </Text>
              )}
              {drug.labeler && (
                <Text size="3" style={{ opacity: 0.8 }}>
                  {drug.labeler}
                </Text>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container size="4" style={{ padding: '2rem 1rem' }}>
        {!drug.content ? (
          <Callout.Root color="blue">
            <Callout.Text>
              No detailed information available for this drug.
            </Callout.Text>
          </Callout.Root>
        ) : (
          <Flex direction="column" gap="2">
            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Indications and Usage</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.indicationsAndUsage ? (
                  <div>{renderContentNode(drug.content.indicationsAndUsage)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Dosage and Administration</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.dosageAndAdministration ? (
                  <div>{renderContentNode(drug.content.dosageAndAdministration)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Dosage Forms and Strengths</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.dosageFormsAndStrengths ? (
                  <div>{renderContentNode(drug.content.dosageFormsAndStrengths)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Contraindications</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.contraindications ? (
                  <div>{renderContentNode(drug.content.contraindications)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Warnings and Precautions</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.warningsAndPrecautions ? (
                  <div>{renderContentNode(drug.content.warningsAndPrecautions)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Adverse Reactions</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.adverseReactions ? (
                  <div>{renderContentNode(drug.content.adverseReactions)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Clinical Pharmacology</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.clinicalPharmacology ? (
                  <div>{renderContentNode(drug.content.clinicalPharmacology)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Clinical Studies</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.clinicalStudies ? (
                  <div>{renderContentNode(drug.content.clinicalStudies)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Mechanism of Action</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.mechanismOfAction ? (
                  <div>{renderContentNode(drug.content.mechanismOfAction)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Boxed Warning</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.boxedWarning ? (
                  <div>{renderContentNode(drug.content.boxedWarning)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Highlights</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.highlights ? (
                  <div>{renderContentNode(drug.content.highlights)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Description</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.description ? (
                  <div>{renderContentNode(drug.content.description)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">How Supplied</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.howSupplied ? (
                  <div>{renderContentNode(drug.content.howSupplied)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Instructions for Use</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.instructionsForUse ? (
                  <div>{renderContentNode(drug.content.instructionsForUse)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Nonclinical Toxicology</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.nonclinicalToxicology ? (
                  <div>{renderContentNode(drug.content.nonclinicalToxicology)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Use in Specific Populations</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.useInSpecificPopulations ? (
                  <div>{renderContentNode(drug.content.useInSpecificPopulations)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>

            <details style={{ marginBottom: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', padding: '1rem', backgroundColor: 'var(--color-panel)', borderRadius: '8px', marginBottom: '0.5rem', borderBottom: '1px solid var(--gray-6)' }}>
                <Text weight="medium">Drug Interactions</Text>
              </summary>
              <Box style={{ padding: '1rem', backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                {drug.content?.drugInteractions ? (
                  <div>{renderContentNode(drug.content.drugInteractions)}</div>
                ) : (
                  <Text size="2" color="gray">No content available</Text>
                )}
              </Box>
            </details>
          </Flex>
        )}
      </Container>
    </Box>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const drug = await getDrug(params.slug);

  if (!drug) {
    return {
      title: 'Drug Not Found - PrescriberPoint',
      description: 'The requested drug information could not be found.',
    };
  }

  const seoTitle = drug.aiSeoContents?.[0]?.title;
  const seoDescription = drug.aiSeoContents?.[0]?.metaDescription;

  return {
    title: seoTitle ? `${seoTitle} | PrescriberPoint` : `${drug.drugName} - Drug Information | PrescriberPoint`,
    description: seoDescription || `Comprehensive drug information for ${drug.drugName} by ${drug.labeler}. View indications, dosage, warnings, and more.`,
    keywords: [
      drug.drugName,
      drug.labeler,
      drug.brandName,
      drug.content?.genericName,
      'drug information',
      'prescribing information',
      'medication guide',
    ].filter(Boolean).join(', '),
  };
}