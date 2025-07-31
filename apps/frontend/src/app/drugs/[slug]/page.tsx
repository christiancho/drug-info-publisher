import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Badge,
  Card,
  Grid,
  Separator,
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
  indications?: any;
  dosageAdministration?: any;
  contraindications?: any;
  warnings?: any;
  adverseReactions?: any;
  clinicalPharmacology?: any;
  howSupplied?: any;
}

interface Drug {
  slug: string;
  drugName: string;
  labelerName: string;
  brandName?: string;
  content?: DrugContent;
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

function renderContent(content: any, title: string) {
  if (!content) return null;

  const renderValue = (value: any): React.ReactNode => {
    if (typeof value === 'string') {
      return <Text>{value}</Text>;
    }

    if (Array.isArray(value)) {
      return (
        <Flex direction="column" gap="2">
          {value.map((item, index) => (
            <Box key={index}>
              {typeof item === 'string' ? (
                <Text>• {item}</Text>
              ) : (
                <Box pl="4">
                  {renderValue(item)}
                </Box>
              )}
            </Box>
          ))}
        </Flex>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <Flex direction="column" gap="3">
          {Object.entries(value).map(([key, val]) => (
            <Box key={key}>
              <Text weight="bold" size="3">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</Text>
              <Box mt="1" pl="3">
                {renderValue(val)}
              </Box>
            </Box>
          ))}
        </Flex>
      );
    }

    return <Text>{String(value)}</Text>;
  };

  return (
    <Card>
      <Flex direction="column" gap="4" p="4">
        <Heading size="5">{title}</Heading>
        {renderValue(content)}
      </Flex>
    </Card>
  );
}

export default async function DrugDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const drug = await getDrug(params.slug);

  if (!drug) {
    notFound();
  }

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
            
            <Button asChild variant="outline" size="2">
              <Link href="/">
                <ArrowLeftIcon width="16" height="16" />
                Back to Search
              </Link>
            </Button>
            
            <Heading size="8">
              {drug.drugName}
            </Heading>
            
            <Flex gap="3" wrap="wrap">
              <Badge color="blue" variant="soft">
                Labeler: {drug.labelerName}
              </Badge>
              {drug.brandName && (
                <Badge color="green" variant="soft">
                  Brand: {drug.brandName}
                </Badge>
              )}
              {drug.content?.genericName && (
                <Badge color="purple" variant="soft">
                  Generic: {drug.content.genericName}
                </Badge>
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
            {/* Basic Information */}
            <Card>
              <Flex direction="column" gap="4" p="4">
                <Heading size="5">Basic Information</Heading>
                <Grid columns={{ initial: '1', md: '2' }} gap="3">
                  <Flex justify="between">
                    <Text weight="bold">Drug Name:</Text>
                    <Text>{drug.drugName}</Text>
                  </Flex>
                  {drug.content.genericName && (
                    <Flex justify="between">
                      <Text weight="bold">Generic Name:</Text>
                      <Text>{drug.content.genericName}</Text>
                    </Flex>
                  )}
                  {drug.content.strength && (
                    <Flex justify="between">
                      <Text weight="bold">Strength:</Text>
                      <Text>{drug.content.strength}</Text>
                    </Flex>
                  )}
                  {drug.content.dosageForm && (
                    <Flex justify="between">
                      <Text weight="bold">Dosage Form:</Text>
                      <Text>{drug.content.dosageForm}</Text>
                    </Flex>
                  )}
                  {drug.content.route && (
                    <Flex justify="between">
                      <Text weight="bold">Route:</Text>
                      <Text>{drug.content.route}</Text>
                    </Flex>
                  )}
                  <Flex justify="between">
                    <Text weight="bold">Labeler:</Text>
                    <Text>{drug.labelerName}</Text>
                  </Flex>
                </Grid>
              </Flex>
            </Card>

            {/* All drug content sections */}
            {renderContent(drug.content.indications, 'Indications and Usage')}
            {renderContent(drug.content.dosageAdministration, 'Dosage and Administration')}
            {renderContent(drug.content.warnings, 'Warnings and Precautions')}
            {renderContent(drug.content.contraindications, 'Contraindications')}
            {renderContent(drug.content.adverseReactions, 'Adverse Reactions')}
            {renderContent(drug.content.clinicalPharmacology, 'Clinical Pharmacology')}
            {renderContent(drug.content.howSupplied, 'How Supplied')}
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

  return {
    title: `${drug.drugName} - Drug Information | PrescriberPoint`,
    description: `Comprehensive drug information for ${drug.drugName} by ${drug.labelerName}. View indications, dosage, warnings, and more.`,
    keywords: [
      drug.drugName,
      drug.labelerName,
      drug.brandName,
      drug.content?.genericName,
      'drug information',
      'prescribing information',
      'medication guide',
    ].filter(Boolean).join(', '),
  };
}