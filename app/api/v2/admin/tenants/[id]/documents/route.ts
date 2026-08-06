import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/security/requireSuperAdmin";
import { ManageCompanyKybUseCase } from "@/lib/application/admin/use-cases/ManageCompanyKybUseCase";

const kybUC = new ManageCompanyKybUseCase();

/** GET /api/v2/admin/tenants/[id]/documents — List documents & KYB status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const details = await kybUC.getKybDetails(id);

    return NextResponse.json({ success: true, data: details });
  } catch (error: any) {
    console.error("GET /api/v2/admin/tenants/[id]/documents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

/** POST /api/v2/admin/tenants/[id]/documents — Add a verification document */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();

    if (!body.documentType || !body.fileName) {
      return NextResponse.json(
        { success: false, error: "documentType et fileName sont requis" },
        { status: 400 }
      );
    }

    const doc = await kybUC.addDocument({
      companyId: id,
      documentType: body.documentType,
      fileUrl: body.fileUrl || `/uploads/kyb/${id}/${body.fileName}`,
      fileName: body.fileName,
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/v2/admin/tenants/[id]/documents error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de l'ajout du document" },
      { status: 500 }
    );
  }
}
