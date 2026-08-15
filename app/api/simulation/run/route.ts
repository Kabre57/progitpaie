/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROGITPAIE — Route API Moteur de Simulation (/api/simulation/run) 🎯
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware-helpers";
import { SimulationService } from "@/lib/infrastructure/simulation/simulation-service";

const simulationService = new SimulationService();

// POST /api/simulation/run — Calcule les variances d'un scénario "What-If"
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const result = await simulationService.runSimulation(body);

    return NextResponse.json({
      success: true,
      simulation: result,
    });
  } catch (error: unknown) {
    console.error("POST /api/simulation/run error:", error);
    return NextResponse.json(
      { success: false, error: "Échec du calcul de la simulation budgétaire" },
      { status: 500 }
    );
  }
}
