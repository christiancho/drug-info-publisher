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
} from '@radix-ui/themes';
import { ArrowLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

interface DrugContent {
  genericName?: string;
  brandName?: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
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

  return (
    <Box>
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
          <Flex direction="column" gap="6">
            {/* Note: Detailed label content sections removed for performance */}
            <Callout.Root color="gray">
              <Callout.Text>
                Detailed prescribing information has been removed from this view for improved performance. 
                Essential drug information is displayed in the header above.
              </Callout.Text>
            </Callout.Root>
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