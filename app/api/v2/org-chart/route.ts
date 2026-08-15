import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/database/tenant-context";
import { EmployeeRepository } from "@/lib/infrastructure/repositories/employee-repository";
import { ApiResponse } from "@/types";

const employeeRepo = new EmployeeRepository();

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

    const employees = await employeeRepo.findAllActive(authResult.companyId);

    const empMap = new Map<string, OrgNodeDTO>();

    // 1. Initialisation des nœuds
    employees.forEach((emp) => {
      empMap.set(emp.id, {
        id: emp.id,
        name: emp.name,
        email: "",
        employeeId: emp.employeeId,
        jobTitle: emp.jobTitle || "Collaborateur",
        departmentId: null,
        departmentName: emp.departmentName || "Non assigné",
        managerId: null,
        managerName: null,
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
  } catch (error: unknown) {
    console.error("GET /api/v2/org-chart error:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json(
      { success: false, error: message, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
