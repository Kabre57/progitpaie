import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { prisma } from "@/lib/db";
import { ApiResponse } from "@/types";

export interface OrgNodeDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  subordinates: OrgNodeDTO[];
  subordinatesCount: number;
}

// GET /api/v2/org-chart - Arborescence visuelle de l'organigramme d'entreprise
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireTenant(request, "admin");
    if (authResult instanceof NextResponse) return authResult;

    const employees = await prisma.user.findMany({
      where: {
        companyId: authResult.companyId,
        role: "employee",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        jobTitle: true,
        departmentId: true,
        managerId: true,
        department: { select: { name: true } },
        manager: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const empMap = new Map<string, OrgNodeDTO>();

    // 1. Initialisation des nœuds
    employees.forEach((emp) => {
      empMap.set(emp.id, {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        employeeId: emp.employeeId,
        jobTitle: emp.jobTitle || "Collaborateur",
        departmentId: emp.departmentId,
        departmentName: emp.department?.name || "Non assigné",
        managerId: emp.managerId,
        managerName: emp.manager?.name || null,
        subordinates: [],
        subordinatesCount: 0,
      });
    });

    const rootNodes: OrgNodeDTO[] = [];

    // 2. Construction des relations parent-enfant
    empMap.forEach((node) => {
      if (node.managerId && empMap.has(node.managerId)) {
        const parentNode = empMap.get(node.managerId)!;
        parentNode.subordinates.push(node);
        parentNode.subordinatesCount++;
      } else {
        rootNodes.push(node);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        tree: rootNodes,
        allEmployees: Array.from(empMap.values()),
        totalEmployees: employees.length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/v2/org-chart error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
