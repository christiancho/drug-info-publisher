import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Theme } from '@radix-ui/themes';
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

// Import renderContent function - we'll need to export it from the main file
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

// Wrapper component for testing
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
      {children}
    </Theme>
  );
}

describe('renderContent function', () => {
  it('should return null for null or undefined content', () => {
    const result1 = renderContent(null, 'Test Title');
    const result2 = renderContent(undefined, 'Test Title');
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it('should render string content correctly', () => {
    const content = "This is a test string";
    const title = "Test String";
    
    render(
      <TestWrapper>
        {renderContent(content, title)}
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it('should render array content with bullet points', () => {
    const content = ["First item", "Second item", "Third item"];
    const title = "Test Array";
    
    render(
      <TestWrapper>
        {renderContent(content, title)}
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("• First item")).toBeInTheDocument();
    expect(screen.getByText("• Second item")).toBeInTheDocument();
    expect(screen.getByText("• Third item")).toBeInTheDocument();
  });

  it('should render nested arrays correctly', () => {
    const content = [
      "First item",
      ["Nested item 1", "Nested item 2"],
      "Third item"
    ];
    const title = "Test Nested Array";
    
    render(
      <TestWrapper>
        {renderContent(content, title)}
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("• First item")).toBeInTheDocument();
    expect(screen.getByText("• Nested item 1")).toBeInTheDocument();
    expect(screen.getByText("• Nested item 2")).toBeInTheDocument();
    expect(screen.getByText("• Third item")).toBeInTheDocument();
  });

  it('should render object content with formatted keys', () => {
    const content = {
      dosageForm: "Tablet",
      activeIngredient: "Acetaminophen",
      strength: "500mg"
    };
    const title = "Test Object";
    
    render(
      <TestWrapper>
        {renderContent(content, title)}
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("Dosage Form:")).toBeInTheDocument();
    expect(screen.getByText("Active Ingredient:")).toBeInTheDocument();
    expect(screen.getByText("Strength:")).toBeInTheDocument();
    expect(screen.getByText("Tablet")).toBeInTheDocument();
    expect(screen.getByText("Acetaminophen")).toBeInTheDocument();
    expect(screen.getByText("500mg")).toBeInTheDocument();
  });

  it('should render nested objects correctly', () => {
    const content = {
      basicInfo: {
        name: "Test Drug",
        type: "Generic"
      },
      dosing: {
        adult: "500mg twice daily",
        pediatric: "250mg twice daily"
      }
    };
    const title = "Test Nested Object";
    
    render(
      <TestWrapper>
        {renderContent(content, title)}
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("Basic Info:")).toBeInTheDocument();
    expect(screen.getByText("Dosing:")).toBeInTheDocument();
    expect(screen.getByText("Name:")).toBeInTheDocument();
    expect(screen.getByText("Type:")).toBeInTheDocument();
    expect(screen.getByText("Adult:")).toBeInTheDocument();
    expect(screen.getByText("Pediatric:")).toBeInTheDocument();
    expect(screen.getByText("Test Drug")).toBeInTheDocument();
    expect(screen.getByText("Generic")).toBeInTheDocument();
    expect(screen.getByText("500mg twice daily")).toBeInTheDocument();
    expect(screen.getByText("250mg twice daily")).toBeInTheDocument();
  });

  it('should handle mixed content types', () => {
    const content = {
      description: "This is a description",
      warnings: ["Warning 1", "Warning 2"],
      details: {
        manufacturer: "Test Pharma",
        approved: true
      }
    };
    const title = "Test Mixed Content";
    
    render(
      <TestWrapper>
        {renderContent(content, title)}
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("Description:")).toBeInTheDocument();
    expect(screen.getByText("Warnings:")).toBeInTheDocument();
    expect(screen.getByText("Details:")).toBeInTheDocument();
    expect(screen.getByText("This is a description")).toBeInTheDocument();
    expect(screen.getByText("• Warning 1")).toBeInTheDocument();
    expect(screen.getByText("• Warning 2")).toBeInTheDocument();
    expect(screen.getByText("Test Pharma")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it('should handle number and boolean values', () => {
    const content = {
      count: 42,
      isActive: true,
      rating: 4.5
    };
    const title = "Test Primitive Values";
    
    render(
      <TestWrapper>
        {renderContent(content, title)}
      </TestWrapper>
    );
    
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText("Count:")).toBeInTheDocument();
    expect(screen.getByText("Is Active:")).toBeInTheDocument();
    expect(screen.getByText("Rating:")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });
});