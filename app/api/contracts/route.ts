import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { ContractType, EmployeeCategory, Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";

// GET /api/contracts - Liste tous les contrats
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const status = searchParams.get("status") || "active";

    const where: Prisma.ContractWhereInput = { companyId: authResult.companyId };
    if (userId) where.userId = userId;
    if (type) where.type = type as ContractType;
    if (status) where.status = status;

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
      },
    });

    const formattedContracts = contracts.map((c) => ({
      ...c,
      _id: c.id,
      userId: c.userId,
      user: {
        ...c.user,
        _id: c.user.id,
      },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedContracts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get contracts error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch contracts",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/contracts - Créer un nouveau contrat de travail
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const {
      userId,
      type,
      category,
      jobTitle,
      startDate,
      endDate,
      probationPeriodMonths,
      baseSalary,
      sursalaire,
      transportAllowance,
      housingAllowance,
    } = body;

    if (!userId || !jobTitle || !startDate || baseSalary === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé, Intitulé du poste, Date de début et Salaire de base sont requis",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Désactiver les anciens contrats actifs de cet employé
    await prisma.contract.updateMany({
      where: { userId, companyId: authResult.companyId, status: "active" },
      data: { status: "expired" },
    });

    const contract = await prisma.contract.create({
      data: {
        companyId: authResult.companyId,
        userId,
        type: (type || "CDI") as ContractType,
        category: (category || "employe") as EmployeeCategory,
        jobTitle: jobTitle.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        probationPeriodMonths: probationPeriodMonths || 0,
        baseSalary: parseFloat(baseSalary),
        sursalaire: sursalaire ? parseFloat(sursalaire) : 0,
        transportAllowance: transportAllowance ? parseFloat(transportAllowance) : 0,
        housingAllowance: housingAllowance ? parseFloat(housingAllowance) : 0,
        status: "active",
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
      },
    });

    // Mettre à jour le salaire et les indemnités sur la fiche employé (User)
    await prisma.user.update({
      where: { id: userId, companyId: authResult.companyId },
      data: {
        salary: parseFloat(baseSalary),
        sursalaire: sursalaire ? parseFloat(sursalaire) : 0,
        transportAllowance: transportAllowance ? parseFloat(transportAllowance) : 0,
        housingAllowance: housingAllowance ? parseFloat(housingAllowance) : 0,
      },
    });

    const responseData = {
      ...contract,
      _id: contract.id,
      userId: contract.userId,
      user: {
        ...contract.user,
        _id: contract.user.id,
      },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Contrat de travail créé avec succès",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create contract error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create contract",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
