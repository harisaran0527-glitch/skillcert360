import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCertificateFileContent } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.mustChangePassword) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const certificate = await db.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { userId: true } },
    },
  });

  if (!certificate) {
    return Response.json({ error: "Certificate not found" }, { status: 404 });
  }

  // Authorization Check:
  // - Admin can access any certificate file for verification
  // - Student can only access their OWN uploaded certificate
  // - Other users receive 403 Forbidden
  const isOwner = session.role === "STUDENT" && certificate.student.userId === session.userId;
  const isAdmin = session.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden: Access denied." }, { status: 403 });
  }

  const storageKey = certificate.filePath;
  if (!storageKey) {
    return Response.json({ error: "No file associated with this certificate record." }, { status: 404 });
  }

  const content = await getCertificateFileContent(storageKey);
  if (!content) {
    return Response.json({ error: "File unavailable or removed from storage." }, { status: 404 });
  }

  const mimeType = certificate.mimeType || content.contentType || "application/octet-stream";
  const fileName = certificate.originalFileName || `certificate-${certificate.id}`;

  return new Response(new Uint8Array(content.buffer), {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
