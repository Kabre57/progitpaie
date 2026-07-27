import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { ApiResponse } from "@/types";

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationErrorResponse {
  success: false;
  response: NextResponse<ApiResponse<never>>;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationErrorResponse;

/**
 * Valide le corps JSON d'une requête HTTP contre un schéma Zod.
 * Si valide, retourne `{ success: true, data }`.
 * Si invalide ou JSON corrompu, retourne une réponse HTTP 400 pré-formatée `{ success: false, response }`.
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const parsedData = schema.parse(body);
    return { success: true, data: parsedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstErrorMessage =
        error.issues[0]?.message || "Données de formulaire invalides";

      return {
        success: false,
        response: NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: firstErrorMessage,
            code: "VALIDATION_ERROR",
            errors: fieldErrors as Record<string, string[]>,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Corps de requête JSON invalide ou manquant",
          code: "INVALID_JSON",
        },
        { status: 400 }
      ),
    };
  }
}

/**
 * Valide les paramètres de requête URL (query params) contre un schéma Zod.
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    const parsedData = schema.parse(queryObject);
    return { success: true, data: parsedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstErrorMessage =
        error.issues[0]?.message || "Paramètres d'URL invalides";

      return {
        success: false,
        response: NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: firstErrorMessage,
            code: "VALIDATION_ERROR",
            errors: fieldErrors as Record<string, string[]>,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Paramètres de requête invalides",
          code: "INVALID_QUERY_PARAMS",
        },
        { status: 400 }
      ),
    };
  }
}
