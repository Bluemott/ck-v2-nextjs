'use client';

import { useState } from 'react';
import { env, isDevelopment, isProduction, isAWSGraphQLEnabled } from '../lib/env';
import { 
  validateGraphQLQuery, 
  validateSearchParams, 
  validateBlogPost,
  validateMediaUpload,
  validateWordPressWebhook,
  validateIndexNowSubmission,
  validateSEOMetadata,
  validateDatabaseConfig,
  validateS3Upload,
  graphqlQuerySchema,
  searchParamsSchema,
  blogPostSchema,
  mediaUploadSchema,
  wordpressWebhookSchema,
  indexNowSchema,
  seoMetadataSchema,
  databaseConfigSchema,
  s3UploadSchema
} from '../lib/validation';

export default function TestValidationPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Environment Variables
      results.environment = {
        success: true,
        data: {
          siteUrl: env.NEXT_PUBLIC_SITE_URL,
          isDevelopment,
          isProduction,
          isAWSGraphQLEnabled,
          hasValidUrls: env.NEXT_PUBLIC_SITE_URL.startsWith('http'),
        }
      };

      // Test 2: GraphQL Query Validation
      try {
        const validQuery = validateGraphQLQuery({
          query: '{ posts { id title } }',
          variables: { first: 10 }
        });
        results.graphqlQuery = { success: true, data: validQuery };
      } catch (error) {
        results.graphqlQuery = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 3: Search Parameters Validation
      try {
        const validSearchParams = validateSearchParams({
          search: 'test',
          page: '1',
          perPage: '12'
        });
        results.searchParams = { success: true, data: validSearchParams };
      } catch (error) {
        results.searchParams = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 4: Blog Post Validation
      try {
        const validBlogPost = validateBlogPost({
          slug: 'test-post',
          title: 'Test Post',
          excerpt: 'Test excerpt',
          status: 'publish'
        });
        results.blogPost = { success: true, data: validBlogPost };
      } catch (error) {
        results.blogPost = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 5: WordPress Webhook Validation
      try {
        const validWebhook = validateWordPressWebhook({
          post_id: 123,
          post_title: 'Test Post',
          post_name: 'test-post',
          post_status: 'publish',
          post_type: 'post'
        });
        results.wordpressWebhook = { success: true, data: validWebhook };
      } catch (error) {
        results.wordpressWebhook = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 6: IndexNow Submission Validation
      try {
        const validIndexNow = validateIndexNowSubmission({
          host: 'example.com',
          key: 'test-key',
          keyLocation: 'https://example.com/test-key.txt',
          urlList: ['https://example.com/page1', 'https://example.com/page2']
        });
        results.indexNow = { success: true, data: validIndexNow };
      } catch (error) {
        results.indexNow = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 7: SEO Metadata Validation
      try {
        const validSEO = validateSEOMetadata({
          title: 'Test Title',
          description: 'Test description under 160 characters',
          keywords: ['test', 'validation'],
          canonical: 'https://example.com/test'
        });
        results.seoMetadata = { success: true, data: validSEO };
      } catch (error) {
        results.seoMetadata = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 8: Database Config Validation
      try {
        const validDBConfig = validateDatabaseConfig({
          host: 'localhost',
          port: 5432,
          database: 'testdb',
          user: 'testuser',
          password: 'testpass'
        });
        results.databaseConfig = { success: true, data: validDBConfig };
      } catch (error) {
        results.databaseConfig = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 9: S3 Upload Validation
      try {
        const validS3Upload = validateS3Upload({
          bucket: 'test-bucket',
          key: 'test-key',
          body: Buffer.from('test'),
          contentType: 'text/plain'
        });
        results.s3Upload = { success: true, data: validS3Upload };
      } catch (error) {
        results.s3Upload = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }

      // Test 10: Schema Validation
      results.schemas = {
        graphqlQuery: graphqlQuerySchema.description || 'GraphQL Query Schema',
        searchParams: searchParamsSchema.description || 'Search Parameters Schema',
        blogPost: blogPostSchema.description || 'Blog Post Schema',
        mediaUpload: mediaUploadSchema.description || 'Media Upload Schema',
        wordpressWebhook: wordpressWebhookSchema.description || 'WordPress Webhook Schema',
        indexNow: indexNowSchema.description || 'IndexNow Schema',
        seoMetadata: seoMetadataSchema.description || 'SEO Metadata Schema',
        databaseConfig: databaseConfigSchema.description || 'Database Config Schema',
        s3Upload: s3UploadSchema.description || 'S3 Upload Schema',
      };

    } catch (error) {
      results.general = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Zod Validation Test Suite</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run Validation Tests'}
        </button>
      </div>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-6">
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
            <div key={testName} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2 capitalize">
                {testName.replace(/([A-Z])/g, ' $1').trim()}
              </h2>
              
              {result.success ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  <strong>✅ Success</strong>
                  {result.data && (
                    <pre className="mt-2 text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <strong>❌ Error</strong>
                  <p className="mt-1">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Environment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Node Environment:</strong> {process.env.NODE_ENV}
          </div>
          <div>
            <strong>Site URL:</strong> {env.NEXT_PUBLIC_SITE_URL}
          </div>
          <div>
            <strong>AWS GraphQL Enabled:</strong> {isAWSGraphQLEnabled ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Development Mode:</strong> {isDevelopment ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    </div>
  );
} 