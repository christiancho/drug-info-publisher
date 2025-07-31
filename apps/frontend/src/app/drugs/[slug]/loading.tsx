import {
  Box,
  Container,
  Skeleton,
  Flex,
  Card,
  Grid,
} from '@radix-ui/themes';

export default function Loading() {
  return (
    <Box>
      {/* Header Skeleton */}
      <Box className="prescriber-point-header" style={{ color: 'white', padding: '2rem 1rem' }}>
        <Container size="4">
          <Flex direction="column" align="start" gap="4">
            <Skeleton style={{ height: '20px', width: '200px' }} />
            <Skeleton style={{ height: '30px', width: '100px' }} />
            <Skeleton style={{ height: '40px', width: '300px' }} />
            <Flex gap="4">
              <Skeleton style={{ height: '24px', width: '120px' }} />
              <Skeleton style={{ height: '24px', width: '100px' }} />
              <Skeleton style={{ height: '24px', width: '140px' }} />
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container size="4" style={{ padding: '2rem 1rem' }}>
        {/* Tab Navigation Skeleton */}
        <Flex direction="column" gap="6">
          <Flex gap="4">
            <Skeleton style={{ height: '40px', width: '80px' }} />
            <Skeleton style={{ height: '40px', width: '100px' }} />
            <Skeleton style={{ height: '40px', width: '70px' }} />
            <Skeleton style={{ height: '40px', width: '90px' }} />
            <Skeleton style={{ height: '40px', width: '120px' }} />
            <Skeleton style={{ height: '40px', width: '100px' }} />
            <Skeleton style={{ height: '40px', width: '90px' }} />
          </Flex>

          {/* Content Skeleton */}
          <Grid columns={{ initial: '1', lg: '2' }} gap="6">
            <Card>
              <Flex direction="column" gap="4" p="4">
                <Skeleton style={{ height: '24px', width: '150px' }} />
                <Flex direction="column" gap="3">
                  <Skeleton style={{ height: '20px', width: '100%' }} />
                  <Skeleton style={{ height: '20px', width: '80%' }} />
                  <Skeleton style={{ height: '20px', width: '90%' }} />
                  <Skeleton style={{ height: '20px', width: '85%' }} />
                  <Skeleton style={{ height: '20px', width: '95%' }} />
                </Flex>
              </Flex>
            </Card>

            <Card>
              <Flex direction="column" gap="4" p="4">
                <Skeleton style={{ height: '24px', width: '120px' }} />
                <Flex direction="column" gap="3">
                  <Skeleton style={{ height: '16px', width: '100%' }} />
                  <Skeleton style={{ height: '16px', width: '95%' }} />
                  <Skeleton style={{ height: '16px', width: '90%' }} />
                  <Skeleton style={{ height: '16px', width: '85%' }} />
                  <Skeleton style={{ height: '16px', width: '92%' }} />
                  <Skeleton style={{ height: '16px', width: '88%' }} />
                  <Skeleton style={{ height: '16px', width: '93%' }} />
                  <Skeleton style={{ height: '16px', width: '87%' }} />
                </Flex>
              </Flex>
            </Card>
          </Grid>
        </Flex>
      </Container>
    </Box>
  );
}