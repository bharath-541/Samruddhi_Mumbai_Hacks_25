# TASK 5: File Upload Support

## 🎯 Objective
Enable secure file uploads for medical documents (prescriptions, test reports) using Supabase Storage. The backend will generate presigned URLs to allow the frontend to upload files directly to storage, ensuring scalability and security.

## 🛠️ Specifications

### 1. Storage Setup (Manual)
- **Bucket Name:** `medical-documents`
- **Privacy:** Private
- **RLS Policy:**
    - `INSERT`: Allow authenticated users to upload to `private/{user_id}/*`
    - `SELECT`: Allow authenticated users to read from `private/{user_id}/*` (or use signed URLs for reading too)

### 2. API Endpoints

#### Generate Presigned Upload URL
- **POST** `/upload/presigned-url`
- **Auth:** Authenticated User (Patient or Staff)
- **Body:**
    ```json
    {
      "fileName": "prescription_dec_2024.pdf",
      "fileType": "application/pdf"
    }
    ```
- **Action:**
    1.  Constructs a secure path: `private/{user_id}/{timestamp}_{sanitized_filename}`
    2.  Calls Supabase `storage.createSignedUploadUrl`
- **Returns:**
    ```json
    {
      "uploadUrl": "https://.../upload/...",
      "path": "private/user_id/..."
    }
    ```

### 3. Security
- Restrict file types (PDF, JPG, PNG).
- Restrict file size (e.g., 5MB) - enforced by Supabase or frontend, backend checks type.
- User isolation: Users can only generate URLs for their own folder.

## ✅ Acceptance Criteria
- [ ] `POST /upload/presigned-url` implemented.
- [ ] Returns a valid signed URL.
- [ ] Client can upload a file using the URL.
- [ ] File appears in Supabase Storage (verified via dashboard or download).

## 📅 Implementation Plan
1.  Implement `POST /upload/presigned-url` in `server.ts`.
2.  Create verification script `scripts/test_file_upload.js`.
3.  Verify upload flow.
