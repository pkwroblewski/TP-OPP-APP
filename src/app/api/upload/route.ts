import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadMetadataSchema, MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from '@/schemas/upload';
import type {
  UploadBatchInsert,
  CompanyInsert,
  UploadedFileInsert,
  FilingInsert
} from '@/types/database';

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
    const metadataJson = formData.get('metadata') as string | null;

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

    // Validate metadata
    if (!metadataJson) {
      return NextResponse.json(
        { error: 'No metadata provided' },
        { status: 400 }
      );
    }

    const metadataResult = uploadMetadataSchema.safeParse(JSON.parse(metadataJson));
    if (!metadataResult.success) {
      return NextResponse.json(
        { error: 'Invalid metadata', details: metadataResult.error.flatten() },
        { status: 400 }
      );
    }

    const metadata = metadataResult.data;

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${metadata.rcsNumber}/${timestamp}_${sanitizedName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('financial-accounts')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
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
      console.error('Batch creation error:', batchError);
      return NextResponse.json(
        { error: 'Failed to create upload batch', details: batchError.message },
        { status: 500 }
      );
    }

    // Find or create company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('rcs_number', metadata.rcsNumber.toUpperCase())
      .single();

    let companyId: string;

    if (existingCompany) {
      companyId = existingCompany.id;
      // Update company info if provided
      await supabase
        .from('companies')
        .update({
          name: metadata.companyName,
          legal_form: metadata.legalForm,
          parent_company_name: metadata.parentCompanyName || null,
          parent_country_code: metadata.parentCountry || null,
        })
        .eq('id', companyId);
    } else {
      // Create new company
      const companyData: CompanyInsert = {
        rcs_number: metadata.rcsNumber.toUpperCase(),
        name: metadata.companyName,
        legal_form: metadata.legalForm,
        parent_company_name: metadata.parentCompanyName || null,
        parent_country_code: metadata.parentCountry || null,
      };

      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single();

      if (companyError) {
        console.error('Company creation error:', companyError);
        return NextResponse.json(
          { error: 'Failed to create company record', details: companyError.message },
          { status: 500 }
        );
      }

      companyId = newCompany.id;
    }

    // Create uploaded file record
    const fileData: UploadedFileInsert = {
      batch_id: batch.id,
      original_filename: file.name,
      file_path: filePath,
      file_size_bytes: file.size,
      extraction_status: 'pending',
    };

    const { data: uploadedFile, error: fileError } = await supabase
      .from('uploaded_files')
      .insert(fileData)
      .select()
      .single();

    if (fileError) {
      console.error('File record creation error:', fileError);
      return NextResponse.json(
        { error: 'Failed to create file record', details: fileError.message },
        { status: 500 }
      );
    }

    // Create filing record
    const filingData: FilingInsert = {
      company_id: companyId,
      fiscal_year: parseInt(metadata.fiscalYear),
      pdf_stored_path: filePath,
      extraction_status: 'pending',
    };

    const { data: filing, error: filingError } = await supabase
      .from('filings')
      .insert(filingData)
      .select()
      .single();

    if (filingError) {
      console.error('Filing creation error:', filingError);
      return NextResponse.json(
        { error: 'Failed to create filing record', details: filingError.message },
        { status: 500 }
      );
    }

    // Update uploaded file with filing reference
    await supabase
      .from('uploaded_files')
      .update({ filing_id: filing.id })
      .eq('id', uploadedFile.id);

    // Trigger extraction automatically in the background
    // We use a fire-and-forget approach so the upload response is immediate
    const baseUrl = request.headers.get('origin') || request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const extractUrl = baseUrl?.startsWith('http')
      ? `${baseUrl}/api/extract`
      : `${protocol}://${baseUrl}/api/extract`;

    // Get cookies for authentication
    const cookies = request.headers.get('cookie') || '';

    // Fire and forget - don't await this
    fetch(extractUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify({ filingId: filing.id }),
    }).catch((err) => {
      console.error('Failed to trigger extraction:', err);
    });

    return NextResponse.json({
      success: true,
      data: {
        fileId: uploadedFile.id,
        companyId,
        filingId: filing.id,
        batchId: batch.id,
        storagePath: filePath,
        extractionTriggered: true,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during upload' },
      { status: 500 }
    );
  }
}
