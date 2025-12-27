import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '@/schemas/upload';
import type {
  UploadBatchInsert,
  UploadedFileInsert,
} from '@/types/database';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file presence
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are accepted.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Get optional metadata from form fields
    // Support both JSON metadata field and individual form fields
    const metadataJson = formData.get('metadata') as string | null;
    let companyName = formData.get('companyName') as string | null;
    let rcsNumber = formData.get('rcsNumber') as string | null;
    let fiscalYear = formData.get('fiscalYear') as string | null;

    // If metadata JSON is provided, parse it (backwards compatibility)
    if (metadataJson) {
      try {
        const parsed = JSON.parse(metadataJson);
        companyName = companyName || parsed.companyName || null;
        rcsNumber = rcsNumber || parsed.rcsNumber || null;
        fiscalYear = fiscalYear || parsed.fiscalYear || null;
      } catch {
        // Ignore JSON parse errors, use form fields
      }
    }

    // Clean up empty strings
    companyName = companyName?.trim() || null;
    rcsNumber = rcsNumber?.trim()?.toUpperCase() || null;
    fiscalYear = fiscalYear?.trim() || null;

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePrefix = rcsNumber || 'pending';
    const filePath = `${user.id}/${filePrefix}/${timestamp}_${sanitizedName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('financial-accounts')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Storage upload error', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage', details: uploadError.message },
        { status: 500 }
      );
    }

    // Create upload batch record
    const batchData: UploadBatchInsert = {
      uploaded_by: user.id,
      upload_type: 'single',
      total_files: 1,
      processed_files: 0,
      failed_files: 0,
      status: 'pending',
    };

    const { data: batch, error: batchError } = await supabase
      .from('upload_batches')
      .insert(batchData)
      .select()
      .single();

    if (batchError) {
      logger.error('Batch creation error', batchError);
      return NextResponse.json(
        { error: 'Failed to create upload batch', details: batchError.message },
        { status: 500 }
      );
    }

    // Create uploaded file record with optional detected info
    const fileData: UploadedFileInsert = {
      batch_id: batch.id,
      original_filename: file.name,
      file_path: filePath,
      file_size_bytes: file.size,
      extraction_status: 'pending',
      detected_company_name: companyName,
      detected_rcs_number: rcsNumber,
      detected_fiscal_year: fiscalYear ? parseInt(fiscalYear) : null,
    };

    const { data: uploadedFile, error: fileError } = await supabase
      .from('uploaded_files')
      .insert(fileData)
      .select()
      .single();

    if (fileError) {
      logger.error('File record creation error', fileError);
      return NextResponse.json(
        { error: 'Failed to create file record', details: fileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileId: uploadedFile.id,
        batchId: batch.id,
        storagePath: filePath,
        // Extraction will be triggered separately by the client
      },
    });
  } catch (error) {
    logger.error('Upload error', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload' },
      { status: 500 }
    );
  }
}
