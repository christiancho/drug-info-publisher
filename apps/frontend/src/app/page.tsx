'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  TextField,
  Card,
  Text,
  Spinner,
  Callout,
  Flex,
  Badge,
  Separator,
  Button,
  Grid,
} from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

interface Drug {
  slug: string;
  drugName: string;
  labelerName: string;
  brandName?: string;
}

interface DrugListResponse {
  drugs: Drug[];
  total: number;
}

export default function Home() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(3);

  const fetchDrugs = async (searchTerm: string = '', currentPage: number = 1, currentLimit: number = limit) => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * currentLimit;
      const params = new URLSearchParams({
        limit: currentLimit.toString(),
        offset: offset.toString(),
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/drugs?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch drugs');
      }

      const data: DrugListResponse = await response.json();
      setDrugs(data.drugs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs(search, page, limit);
  }, [search, page, limit]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handlePageChange = (e: any, { activePage }: any) => {
    setPage(activePage);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Box>
      {/* Header */}
      <Box className="prescriber-point-header" style={{ color: 'white', padding: '4rem 1rem' }}>
        <Container size="3">
          <Heading size="9" weight="regular" mb="4">
            PrescriberPoint
          </Heading>
          <Heading size="6" weight="regular" style={{ opacity: 0.9 }}>
            Comprehensive Drug Information Platform
          </Heading>
        </Container>
      </Box>

      <Container size="4" style={{ padding: '2rem 1rem' }}>
        {/* Search and Limit */}
        <Flex direction={{ initial: 'column', md: 'row' }} gap="4" mb="6">
          <Box style={{ flex: 1 }}>
            <TextField.Root size="3" placeholder="Search drugs by name..." value={search} onChange={handleSearchChange}>
              <TextField.Slot>
                <MagnifyingGlassIcon height="16" width="16" />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          <Box>
            <Flex align="center" gap="2">
              <Text size="2" color="gray">Items per page:</Text>
              <TextField.Root 
                size="2" 
                type="number" 
                min="1" 
                max="50" 
                value={limit.toString()} 
                onChange={(e) => {
                  const newLimit = parseInt(e.target.value) || 3;
                  setLimit(newLimit);
                  setPage(1);
                }}
                style={{ width: '80px' }}
              />
            </Flex>
          </Box>
        </Flex>


        {/* Loading state */}
        {loading && (
          <Flex direction="column" align="center" justify="center" style={{ padding: '4rem 0' }}>
            <Spinner size="3" />
            <Text mt="4">Loading drugs...</Text>
          </Flex>
        )}

        {/* Error state */}
        {error && (
          <Callout.Root color="red" mb="4">
            <Callout.Icon>
              <MagnifyingGlassIcon />
            </Callout.Icon>
            <Callout.Text>
              <Text weight="bold">Error loading drugs</Text>
              <Text>{error}</Text>
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Drug list */}
        {!loading && !error && drugs.length > 0 && (
          <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
            {drugs.map((drug) => (
              <Link key={drug.slug} href={`/drugs/${drug.slug}`} title={`View details for ${drug.drugName}`}>
                <Card className="drug-card" style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '10rem', display: 'flex', alignItems: 'flex-end' }}>
                  <Flex direction="column" gap="2" style={{ width: '100%' }}>
                    <Heading size="4" mb="2" style={{ lineHeight: '1.3' }}>
                      {drug.drugName}
                    </Heading>
                    <Text size="2" color="gray">
                      <strong>Labeler:</strong> {drug.labelerName}
                    </Text>
                    {drug.brandName && (
                      <Badge color="blue" variant="soft">
                        Brand: {drug.brandName}
                      </Badge>
                    )}
                  </Flex>
                </Card>
              </Link>
            ))}
          </Grid>
        )}

        {/* Empty state */}
        {!loading && !error && drugs.length === 0 && (
          <Flex direction="column" align="center" justify="center" style={{ padding: '4rem 0' }}>
            <MagnifyingGlassIcon width="48" height="48" color="gray" />
            <Heading size="6" color="gray" mt="4">No drugs found</Heading>
            <Text color="gray" style={{ textAlign: 'center' }} mt="2">
              {search ? 'Try a different search term' : 'No drugs available in the database'}
            </Text>
          </Flex>
        )}

        {/* Pagination */}
        {!loading && !error && drugs.length > 0 && (
          <Box mt="6">
            <Separator size="4" mb="4" />
            <Flex direction="column" align="center" gap="4">
              <Flex gap="2" align="center">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Text size="2" color="gray" style={{ padding: '0 1rem' }}>
                  Page {page} of {totalPages}
                </Text>
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </Flex>
              <Text size="1" color="gray">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} results
              </Text>
            </Flex>
          </Box>
        )}
      </Container>
    </Box>
  );
}
