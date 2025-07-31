import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
} from '@radix-ui/themes';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

export default function NotFound() {
  return (
    <Box>
      {/* Header */}
      <Box className="prescriber-point-header" style={{ color: 'white', padding: '2rem 1rem' }}>
        <Container size="4">
          <Flex direction="column" align="start" gap="4">
            <Button asChild variant="outline" size="2">
              <Link href="/">
                <ArrowLeftIcon width="16" height="16" />
                Back to Search
              </Link>
            </Button>
            <Heading size="8">
              Drug Not Found
            </Heading>
          </Flex>
        </Container>
      </Box>

      <Container size="4" style={{ padding: '4rem 1rem' }}>
        <Flex direction="column" align="center" justify="center" gap="6" style={{ textAlign: 'center' }}>
          <MagnifyingGlassIcon width="64" height="64" color="gray" />
          
          <Heading size="6" color="gray">
            Drug Information Not Available
          </Heading>
          
          <Text color="gray" size="4" style={{ maxWidth: '28rem', lineHeight: '1.6' }}>
            The drug you're looking for could not be found in our database. 
            It may have been removed or the link may be incorrect.
          </Text>
          
          <Flex direction="column" align="center" gap="4">
            <Button asChild size="3">
              <Link href="/">
                <MagnifyingGlassIcon width="16" height="16" />
                Search for Drugs
              </Link>
            </Button>
            
            <Text size="2" color="gray">
              or go back to the main page to browse available medications
            </Text>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}