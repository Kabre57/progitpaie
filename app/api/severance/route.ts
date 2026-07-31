import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware-helpers";
import { TerminationType } from "@prisma/client";
import { ApiResponse } from "@/types";

// GET /api/severance - Liste des soldes de tout compte
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const severances = await prisma.severance.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
        contract: true,
      },
    });

    const formatted = severances.map((s) => ({
      ...s,
      _id: s.id,
      userId: { ...s.user, _id: s.user.id },
    }));

    return NextResponse.json(
      {
        success: true,
        data: formatted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get severance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Échec de la récupération des soldes de tout compte",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

// POST /api/severance - Calculateur & enregistrement du solde de tout compte
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<unknown>>> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { userId, terminationType, exitDate, noticeDays } = body;

    if (!userId || !terminationType || !exitDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé, Type de rupture et Date de sortie sont requis",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        contracts: { where: { status: "active" }, take: 1 },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Employé non trouvé",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Mapper le libellé du motif de rupture vers l'enum Prisma TerminationType
    let mappedType: TerminationType = TerminationType.licenciement;
    const typeStr = String(terminationType).toLowerCase();
    if (typeStr.includes("démission") || typeStr.includes("demission")) {
      mappedType = TerminationType.demission;
    } else if (typeStr.includes("retraite")) {
      mappedType = TerminationType.retraite;
    } else if (typeStr.includes("cdd")) {
      mappedType = TerminationType.fin_cdd;
    } else if (typeStr.includes("rupture")) {
      mappedType = TerminationType.rupture_conventionnelle;
    } else {
      mappedType = TerminationType.licenciement;
    }

    const activeContract = user.contracts?.[0];
    const exit = new Date(exitDate);
    const joining = user.joiningDate ? new Date(user.joiningDate) : new Date();

    // Calcul de l'ancienneté en années
    const diffTime = Math.max(0, exit.getTime() - joining.getTime());
    const seniorityYears = Number((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2));

    const baseSalary = user.salary || 0;
    const perDaySalary = baseSalary / 26;

    // 1. Indemnité de préavis (si non effectué)
    const noticeIndemnity = Math.round((noticeDays || 0) * perDaySalary);

    // 2. Indemnité de licenciement / retraite selon le barème de la convention collective (CI / OHADA /  )
    // - 30% du salaire moyen pour les 5 premières années
    // - 35% de la 6ème à la 10ème année
    // - 40% au-delà de 10 ans
    let severanceIndemnity = 0;
    if (
      mappedType === TerminationType.licenciement ||
      mappedType === TerminationType.retraite ||
      mappedType === TerminationType.rupture_conventionnelle
    ) {
      const years = seniorityYears;
      if (years <= 5) {
        severanceIndemnity = years * baseSalary * 0.30;
      } else if (years <= 10) {
        severanceIndemnity = 5 * baseSalary * 0.30 + (years - 5) * baseSalary * 0.35;
      } else {
        severanceIndemnity =
          5 * baseSalary * 0.30 + 5 * baseSalary * 0.35 + (years - 10) * baseSalary * 0.40;
      }
    }
    severanceIndemnity = Math.round(severanceIndemnity);

    // 3. Indemnité compensatrice de congés payés restants
    const remainingLeaveDays =
      (user.leaveBalanceAnnual || 0) +
      (user.leaveBalanceSick || 0) +
      (user.leaveBalanceCasual || 0);
    const leaveCompensation = Math.round(remainingLeaveDays * perDaySalary);

    // 4. Prorata de Gratification (13ème mois)
    const currentMonth = exit.getMonth() + 1; // 1 - 12
    const gratification13th = Math.round((currentMonth / 12) * baseSalary * 0.75); // 75% du salaire moyen

    // Total Net Solde de tout compte
    const totalNetExit = noticeIndemnity + severanceIndemnity + leaveCompensation + gratification13th;

    const severance = await prisma.severance.create({
      data: {
        userId,
        contractId: activeContract?.id || null,
        terminationType: mappedType,
        exitDate: exit,
        seniorityYears,
        noticeIndemnity,
        severanceIndemnity,
        leaveCompensation,
        gratification13th,
        totalNetExit,
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeId: true } },
      },
    });

    // Désactiver l'employé et son contrat
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    if (activeContract) {
      await prisma.contract.update({
        where: { id: activeContract.id },
        data: { status: "terminated", endDate: exit },
      });
    }

    const responseData = {
      ...severance,
      _id: severance.id,
      userId: { ...severance.user, _id: severance.user.id },
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        message: "Solde de tout compte calculé et enregistré avec succès",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Calculate severance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Échec du calcul du solde de tout compte",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
