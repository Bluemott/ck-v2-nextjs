import { NextRequest, NextResponse } from 'next/server';
import { allowedFileTypes, maxFileSize } from '../../../lib/validation';

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    error: 'Media upload temporarily disabled for debugging',
    message: 'This endpoint is being debugged due to build issues'
  }, { status: 503 });
  
  /*
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

    // Validate file type using Zod
    try {
      fileTypeSchema.parse(file.type);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: `File type ${file.type} is not supported. Allowed types: ${allowedFileTypes.join(', ')}` 
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Validate file size using Zod
    try {
      fileSizeSchema.parse(file.size);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: `File size ${file.size} bytes exceeds maximum of ${maxFileSize} bytes` 
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Extract and validate metadata from form data
    const uploadData = {
      file,
      title: formData.get('title') as string || file.name,
      altText: formData.get('altText') as string || '',
      caption: formData.get('caption') as string || '',
      description: formData.get('description') as string || '',
      category: formData.get('category') as string || '',
      tags: formData.get('tags') as string || '',
    };

    // Validate the upload data structure
    try {
      validateMediaUpload(uploadData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Invalid upload data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }
      throw error;
    }

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
      // Upload to S3 with validated configuration
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          title: uploadData.title,
          altText: uploadData.altText,
          caption: uploadData.caption,
          description: uploadData.description,
          category: uploadData.category,
          tags: uploadData.tags,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(uploadCommand);

      // Clean up temp file
      await unlink(tempPath);

      // Return success response
      return NextResponse.json({
        success: true,
        file: {
          name: fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url: `https://${S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${s3Key}`,
          s3Key,
          metadata: {
            title: uploadData.title,
            altText: uploadData.altText,
            caption: uploadData.caption,
            description: uploadData.description,
            category: uploadData.category,
            tags: uploadData.tags,
          }
        }
      });

    } catch (uploadError) {
      // Clean up temp file on error
      try {
        await unlink(tempPath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
      
      console.error('S3 upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to S3' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Media upload error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  */
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Media upload endpoint',
    allowedTypes: allowedFileTypes,
    maxFileSize: `${maxFileSize / (1024 * 1024)}MB`,
    supportedFields: ['file', 'title', 'altText', 'caption', 'description', 'category', 'tags']
  });
} 