import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { hashPassword } from "@/lib/auth";
import { ApiResponse } from "@/types";
import { encryptData, decryptData } from "@/lib/crypto";

// GET /api/employees/[id] - Détails d'un employé
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const user = await requireTenant(request);
    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;

    const employee = await prisma.user.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        department: { select: { id: true, name: true } },
        shift: { select: { id: true, name: true, startTime: true, endTime: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé non trouvé",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Déchiffrement des données sensibles pour la consultation
    const decryptedEmployee = {
      ...employee,
      _id: employee.id,
      bankAccount: employee.bankAccount ? decryptData(employee.bankAccount) : null,
      idCardNumber: employee.idCardNumber ? decryptData(employee.idCardNumber) : null,
      cnpsNumber: employee.cnpsNumber ? decryptData(employee.cnpsNumber) : null,
    };

    return NextResponse.json({
      success: true,
      data: decryptedEmployee,
    });
  } catch (error: any) {
    console.error("Get employee by id error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la récupération de l'employé",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Mise à jour d'un employé
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const adminCheck = await requireTenant(request, "admin");
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé non trouvé",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const updateData: any = { ...body };
    delete updateData.id;
    delete updateData._id;

    // Hachage du mot de passe si fourni
    if (updateData.password && String(updateData.password).trim() !== "") {
      updateData.password = await hashPassword(updateData.password);
    } else {
      delete updateData.password;
    }

    // Nettoyage et conversion des types numériques
    if (updateData.salary !== undefined) updateData.salary = Number(updateData.salary) || 0;
    if (updateData.sursalaire !== undefined) updateData.sursalaire = Number(updateData.sursalaire) || 0;
    if (updateData.childrenCount !== undefined) updateData.childrenCount = Number(updateData.childrenCount) || 0;

    // cddDurationMonths: convertir en entier ou null si chaîne vide
    if (updateData.cddDurationMonths !== undefined) {
      updateData.cddDurationMonths =
        updateData.cddDurationMonths !== "" && updateData.cddDurationMonths !== null
          ? Number(updateData.cddDurationMonths)
          : null;
    }

    // Conversion sécurisée des dates (ou null si vide)
    if (updateData.birthDate !== undefined) {
      updateData.birthDate =
        updateData.birthDate && String(updateData.birthDate).trim() !== ""
          ? new Date(updateData.birthDate)
          : null;
    }
    if (updateData.joiningDate !== undefined) {
      updateData.joiningDate =
        updateData.joiningDate && String(updateData.joiningDate).trim() !== ""
          ? new Date(updateData.joiningDate)
          : null;
    }
    if (updateData.contractSignDate !== undefined) {
      updateData.contractSignDate =
        updateData.contractSignDate && String(updateData.contractSignDate).trim() !== ""
          ? new Date(updateData.contractSignDate)
          : null;
    }
    if (updateData.exitDate !== undefined) {
      updateData.exitDate =
        updateData.exitDate && String(updateData.exitDate).trim() !== ""
          ? new Date(updateData.exitDate)
          : null;
    }

    // Chiffrement RGPD des données sensibles
    if (updateData.bankAccount && String(updateData.bankAccount).trim() !== "") {
      updateData.bankAccount = encryptData(updateData.bankAccount);
    }
    if (updateData.idCardNumber && String(updateData.idCardNumber).trim() !== "") {
      updateData.idCardNumber = encryptData(updateData.idCardNumber);
    }
    if (updateData.cnpsNumber && String(updateData.cnpsNumber).trim() !== "") {
      updateData.cnpsNumber = encryptData(updateData.cnpsNumber);
    }

    // Traitement du département
    if (updateData.department !== undefined) {
      const deptName = String(updateData.department).trim();
      delete updateData.department;
      if (deptName !== "") {
        const deptDoc = await prisma.department.findFirst({
          where: { companyId: adminCheck.companyId, OR: [{ id: deptName }, { name: deptName }] },
        });
        if (deptDoc) {
          updateData.departmentId = deptDoc.id;
        } else {
          const newDept = await prisma.department.create({ data: { name: deptName, companyId: adminCheck.companyId } });
          updateData.departmentId = newDept.id;
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id, companyId: adminCheck.companyId },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Fiche salarié mise à jour avec succès",
      data: {
        ...updatedUser,
        _id: updatedUser.id,
        bankAccount: updatedUser.bankAccount ? decryptData(updatedUser.bankAccount) : null,
        idCardNumber: updatedUser.idCardNumber ? decryptData(updatedUser.idCardNumber) : null,
        cnpsNumber: updatedUser.cnpsNumber ? decryptData(updatedUser.cnpsNumber) : null,
      },
    });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la mise à jour de l'employé",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Suppression (soft-delete) d'un employé
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const adminCheck = await requireTenant(request, "admin");
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé non trouvé",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Employé désactivé avec succès",
    });
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de la suppression de l'employé",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
