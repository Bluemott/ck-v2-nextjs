import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({ 
  region: process.env.AWS_REGION || 'us-east-1' 
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'wordpress-static-content';
const MEDIA_FOLDER = 'media';

// Supported file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo'
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;



export async function POST(request: NextRequest) {
  try {
    // Check if it's a multipart form data request
    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size ${file.size} bytes exceeds maximum of ${MAX_FILE_SIZE} bytes` },
        { status: 400 }
      );
    }

    // Extract metadata from form data
    const title = formData.get('title') as string || file.name;
    const altText = formData.get('altText') as string || '';
    const caption = formData.get('caption') as string || '';
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || '';
    const tags = formData.get('tags') as string || '';

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}.${fileExtension}`;
    
    // Create year/month folder structure
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const s3Key = `${MEDIA_FOLDER}/${year}/${month}/${fileName}`;

    // Save file temporarily
    const tempPath = join(tmpdir(), fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(tempPath, buffer);

    try {
      // Upload to S3
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          'original-filename': file.name,
          title,
          'alt-text': altText,
          caption,
          description,
          category,
          tags,
          'upload-date': now.toISOString(),
          'file-size': file.size.toString(),
          'content-type': file.type
        },
        CacheControl: 'public, max-age=31536000', // 1 year cache
      });

      await s3Client.send(uploadCommand);

      // Generate URLs
      const s3Url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
      const cloudFrontUrl = process.env.CLOUDFRONT_DOMAIN 
        ? `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`
        : s3Url;

      // Clean up temp file
      await unlink(tempPath);

      return NextResponse.json({
        success: true,
        data: {
          id: uniqueId,
          filename: fileName,
          originalName: file.name,
          title,
          altText,
          caption,
          description,
          category,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          size: file.size,
          type: file.type,
          urls: {
            s3: s3Url,
            cloudfront: cloudFrontUrl,
            relative: `/${s3Key}`
          },
          metadata: {
            uploadedAt: now.toISOString(),
            s3Key,
            bucket: S3_BUCKET
          }
        }
      });

    } catch (uploadError) {
      // Clean up temp file on error
      try {
        await unlink(tempPath);
      } catch (cleanupError) {
        console.error('Failed to cleanup temp file:', cleanupError);
      }
      
      console.error('S3 upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to S3' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  // Return upload configuration and limits
  return NextResponse.json({
    allowedTypes: ALLOWED_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    mediaFolder: MEDIA_FOLDER,
    s3Bucket: S3_BUCKET
  });
} 