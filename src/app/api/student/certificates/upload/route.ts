import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export async function POST(request: Request) {
  try {
    // 1. Student auth only
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden: Student access required" }, { status: 403 });
    }
    if (session.mustChangePassword) {
      return NextResponse.json({ error: "Forbidden: Password change required" }, { status: 403 });
    }

    // 2. Load StudentProfile using session.userId
    const profile = await db.studentProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // 3. Accept multipart/form-data fields
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    const skillId = formData.get("skillId")?.toString().trim();
    const courseId = formData.get("courseId")?.toString().trim();
    const certificateTitle = formData.get("certificateTitle")?.toString().trim();
    const credentialId = formData.get("credentialId")?.toString().trim() || undefined;
    const credentialUrl = formData.get("credentialUrl")?.toString().trim() || undefined;
    const issueDateStr = formData.get("issueDate")?.toString().trim();
    const expiryDateStr = formData.get("expiryDate")?.toString().trim() || undefined;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!skillId) {
      return NextResponse.json({ error: "skillId is required" }, { status: 400 });
    }
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }
    if (!certificateTitle) {
      return NextResponse.json({ error: "certificateTitle is required" }, { status: 400 });
    }
    if (!issueDateStr) {
      return NextResponse.json({ error: "issueDate is required" }, { status: 400 });
    }

    const issueDate = new Date(issueDateStr);
    if (isNaN(issueDate.getTime())) {
      return NextResponse.json({ error: "Invalid issueDate format" }, { status: 400 });
    }

    let expiryDate: Date | undefined = undefined;
    if (expiryDateStr) {
      expiryDate = new Date(expiryDateStr);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json({ error: "Invalid expiryDate format" }, { status: 400 });
      }
    }

    // 4. Supported files & file size
    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed limit of 10 MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let mimeType = (file.type || "").toLowerCase();
    if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      mimeType = "application/pdf";
    } else if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      mimeType = "image/png";
    } else if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      mimeType = "image/jpeg";
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported file format. Only PDF, JPG, JPEG, and PNG files are allowed." },
        { status: 400 }
      );
    }

    // 5. Validate selected course
    const course = await db.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (!course.active) {
      return NextResponse.json({ error: "Selected course is not active" }, { status: 400 });
    }
    if (course.skillId !== skillId) {
      return NextResponse.json(
        { error: "Selected course does not belong to the selected skill" },
        { status: 400 }
      );
    }

    // 6. Generate SHA-256 file hash
    const fileHash = createHash("sha256").update(buffer).digest("hex");

    // 7. Duplicate protection
    // Reject if same student already uploaded same fileHash
    const existingFileHashCert = await db.certificate.findFirst({
      where: {
        studentId: profile.id,
        fileHash: fileHash,
      },
    });
    if (existingFileHashCert) {
      return NextResponse.json(
        { error: "Duplicate file: You have already uploaded this certificate file" },
        { status: 409 }
      );
    }

    // If credentialId exists, reject if same student + same provider + same credentialId already exists
    if (credentialId) {
      const existingCredentialCert = await db.certificate.findFirst({
        where: {
          studentId: profile.id,
          providerId: course.providerId,
          credentialId: credentialId,
        },
      });
      if (existingCredentialCert) {
        return NextResponse.json(
          {
            error:
              "Duplicate credential: A certificate with this Credential ID from the same provider already exists",
          },
          { status: 409 }
        );
      }
    }

    // 8. Upload actual file to existing Vercel Blob private store: skillcert360-certificates
    const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "bin" : "bin";
    const blobPath = `skillcert360-certificates/${profile.id}/${Date.now()}-${randomUUID()}.${ext}`;

    const blob = await put(blobPath, buffer, {
      access: "private",
      contentType: mimeType,
    });

    // 9. Create Certificate record using existing Certificate model
    const now = new Date();
    const certificate = await db.certificate.create({
      data: {
        studentId: profile.id,
        skillId: skillId,
        courseId: course.id,
        providerId: course.providerId,
        status: "PENDING_VERIFICATION",
        certificateTitle: certificateTitle,
        credentialName: certificateTitle,
        credentialId: credentialId || null,
        credentialUrl: credentialUrl || null,
        issueDate: issueDate,
        expiryDate: expiryDate || null,
        filePath: blob.url,
        originalFileName: file.name,
        mimeType: mimeType,
        fileSize: buffer.length,
        fileHash: fileHash,
        uploadedAt: now,
        storageProvider: "VERCEL_BLOB",
        submittedAt: now,
      },
    });

    // 10. Return 201 success JSON
    return NextResponse.json(
      {
        message: "Certificate uploaded successfully",
        certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading certificate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
