import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTenant } from "@/lib/database/tenant-context";
import { hashPassword } from "@/lib/auth";
import { UserRole, Prisma } from "@prisma/client";
import { ApiResponse } from "@/types";
import { decryptData } from "@/lib/crypto";
import { prismaWithTenant } from "@/lib/database/prisma-extension";

// Helper function to generate unique employee ID
async function generateEmployeeId(companyId: string): Promise<string> {
  const count = await prisma.user.count({ where: { companyId } });
  const nextNumber = count + 1;
  return `EMP-${String(nextNumber).padStart(3, "0")}`;
}

// GET - Fetch all employees with pagination and filters
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const adminCheck = await requireTenant(request, "admin");
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }
    const tenantDb = prismaWithTenant(adminCheck.companyId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: Prisma.UserWhereInput = { companyId: adminCheck.companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (department) {
      where.departmentId = department;
    }

    if (status) {
      where.isActive = status === "active";
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      tenantDb.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          employeeId: true,
          salary: true,
          sursalaire: true,
          joiningDate: true,
          isActive: true,
          civility: true,
          gender: true,
          birthDate: true,
          birthPlace: true,
          idCardType: true,
          idCardNumber: true,
          nationality: true,
          maritalStatus: true,
          childrenCount: true,
          address: true,
          phone: true,
          contractType: true,
          contractSignDate: true,
          cddDurationMonths: true,
          exitDate: true,
          direction: true,
          service: true,
          jobTitle: true,
          jobCode: true,
          regime: true,
          paymentType: true,
          category: true,
          cnpsExempt: true,
          cnpsNumber: true,
          paymentMethod: true,
          bankAccount: true,
          bankName: true,
          createdAt: true,
          updatedAt: true,
          department: {
            select: { id: true, name: true },
          },
          shift: {
            select: { id: true, name: true, startTime: true, endTime: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      tenantDb.user.count({ where }),
    ]);

    const formattedUsers = users.map((u) => ({
      ...u,
      _id: u.id,
      bankAccount: u.bankAccount ? decryptData(u.bankAccount) : null,
      idCardNumber: u.idCardNumber ? decryptData(u.idCardNumber) : null,
      cnpsNumber: u.cnpsNumber ? decryptData(u.cnpsNumber) : null,
    }));

    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: true,
        data: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Get employees error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST - Create new employee with full LOGIPAIE fields
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const adminCheck = await requireTenant(request, "admin");
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { 
      name, email, password, department, salary, sursalaire, joiningDate,
      civility, gender, birthDate, birthPlace, idCardType, idCardNumber, nationality,
      maritalStatus, childrenCount, address, phone, contractType, contractSignDate,
      cddDurationMonths, exitDate, direction, service, jobTitle, jobCode, regime,
      paymentType, category, cnpsExempt, cnpsNumber, paymentMethod, bankAccount, bankName
    } = body;

    if (!name || !email) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Le nom et l'email sont obligatoires",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Un employé existe déjà avec cet email",
          code: "DUPLICATE_ERROR",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password || "123456");
    const employeeId = body.employeeId || (await generateEmployeeId(adminCheck.companyId));

    let finalDepartmentId: string | null = null;
    if (department) {
      const trimmedDept = String(department).trim();
      const deptDoc = await prisma.department.findFirst({
        where: { companyId: adminCheck.companyId, OR: [{ id: trimmedDept }, { name: trimmedDept }] },
      });
      if (deptDoc) {
        finalDepartmentId = deptDoc.id;
      } else {
        const newDept = await prisma.department.create({
          data: { name: trimmedDept, companyId: adminCheck.companyId },
        });
        finalDepartmentId = newDept.id;
      }
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: UserRole.employee,
        companyId: adminCheck.companyId,
        employeeId,
        departmentId: finalDepartmentId,
        salary: Number(salary) || 0,
        sursalaire: Number(sursalaire) || 0,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        isActive: true,
        civility: civility || "M.",
        gender: gender || "M",
        birthDate: birthDate ? new Date(birthDate) : null,
        birthPlace,
        idCardType: idCardType || "CNI",
        idCardNumber,
        nationality: nationality || "IVOIRIENNE",
        maritalStatus: maritalStatus || "Célibataire",
        childrenCount: Number(childrenCount) || 0,
        address,
        phone,
        contractType: contractType || "CDI",
        contractSignDate: contractSignDate ? new Date(contractSignDate) : null,
        cddDurationMonths: cddDurationMonths ? Number(cddDurationMonths) : null,
        exitDate: exitDate ? new Date(exitDate) : null,
        direction: direction || "ADMINISTRATION",
        service,
        jobTitle: jobTitle || "Collaborateur",
        jobCode,
        regime: regime || "Général",
        paymentType: paymentType || "Mensuel",
        category: category || "1A",
        cnpsExempt: Boolean(cnpsExempt),
        cnpsNumber,
        paymentMethod: paymentMethod || "Virement",
        bankAccount,
        bankName: bankName || "SOCIETE GENERALE CI",
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: true,
        message: "Employé créé avec succès",
        data: { ...user, _id: user.id },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Create employee error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// PUT - Update employee with full LOGIPAIE fields
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const adminCheck = await requireTenant(request, "admin");
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const { id, _id } = body;
    const userId = id || _id;

    if (!userId) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "ID de l'employé est requis",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({ where: { id: userId, companyId: adminCheck.companyId } });
    if (!existingUser) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Employé non trouvé",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (body.name) updateData.name = body.name.trim();
    if (body.email) updateData.email = body.email.toLowerCase().trim();
    if (body.employeeId) updateData.employeeId = body.employeeId;
    if (body.salary !== undefined) updateData.salary = Number(body.salary);
    if (body.sursalaire !== undefined) updateData.sursalaire = Number(body.sursalaire);
    if (body.joiningDate) updateData.joiningDate = new Date(body.joiningDate);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    if (body.civility !== undefined) updateData.civility = body.civility;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.birthDate !== undefined) updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    if (body.birthPlace !== undefined) updateData.birthPlace = body.birthPlace;
    if (body.idCardType !== undefined) updateData.idCardType = body.idCardType;
    if (body.idCardNumber !== undefined) updateData.idCardNumber = body.idCardNumber;
    if (body.nationality !== undefined) updateData.nationality = body.nationality;
    if (body.maritalStatus !== undefined) updateData.maritalStatus = body.maritalStatus;
    if (body.childrenCount !== undefined) updateData.childrenCount = Number(body.childrenCount);
    if (body.address !== undefined) updateData.address = body.address;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.contractType !== undefined) updateData.contractType = body.contractType;
    if (body.contractSignDate !== undefined) updateData.contractSignDate = body.contractSignDate ? new Date(body.contractSignDate) : null;
    if (body.cddDurationMonths !== undefined) updateData.cddDurationMonths = body.cddDurationMonths ? Number(body.cddDurationMonths) : null;
    if (body.exitDate !== undefined) updateData.exitDate = body.exitDate ? new Date(body.exitDate) : null;
    if (body.direction !== undefined) updateData.direction = body.direction;
    if (body.service !== undefined) updateData.service = body.service;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.jobCode !== undefined) updateData.jobCode = body.jobCode;
    if (body.regime !== undefined) updateData.regime = body.regime;
    if (body.paymentType !== undefined) updateData.paymentType = body.paymentType;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.cnpsExempt !== undefined) updateData.cnpsExempt = Boolean(body.cnpsExempt);
    if (body.cnpsNumber !== undefined) updateData.cnpsNumber = body.cnpsNumber;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.bankAccount !== undefined) updateData.bankAccount = body.bankAccount;
    if (body.bankName !== undefined) updateData.bankName = body.bankName;

    if (body.password) {
      updateData.password = await hashPassword(body.password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json<ApiResponse<unknown>>(
      {
        success: true,
        message: "Employé mis à jour avec succès",
        data: { ...updatedUser, _id: updatedUser.id },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Update employee error:", error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
