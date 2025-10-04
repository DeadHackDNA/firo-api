import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type QueryParams = {
  start?: string;
  end?: string;
  minLat?: string;
  maxLat?: string;
  minLon?: string;
  maxLon?: string;
  limit?: string;
};

function parseDateStrict(s?: string): Date | null {
  if (!s) return null;
  const iso = s.length === 10 ? s : s;
  const d = new Date(iso + "T00:00:00Z");
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries()) as QueryParams;

    // ✅ Validar fechas
    const startDate = parseDateStrict(params.start);
    const endDate = parseDateStrict(params.end);
    if (!startDate || !endDate) {
      return Response.json({ error: "Invalid or missing start/end date" }, { status: 400 });
    }

    // ✅ Límite y bounding box
    const limit = Math.min(Number(params.limit ?? 2500), 10000);
    const minLat = params.minLat ? Number(params.minLat) : undefined;
    const maxLat = params.maxLat ? Number(params.maxLat) : undefined;
    const minLon = params.minLon ? Number(params.minLon) : undefined;
    const maxLon = params.maxLon ? Number(params.maxLon) : undefined;

    // ✅ Condiciones de búsqueda
    const where: any = {
      acq_date: {
        gte: startDate,
        lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
    };

    if (
      minLat !== undefined &&
      maxLat !== undefined &&
      minLon !== undefined &&
      maxLon !== undefined
    ) {
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLon, lte: maxLon };
    }

    // ✅ Consultar todos los campos del modelo FireRecord
    const rows = await prisma.fireRecord.findMany({
      where,
      orderBy: { acq_date: "asc" },
      take: limit,
    });

    // ✅ Respuesta directa con la data
    return Response.json({
      count: rows.length,
      requestedLimit: limit,
      bboxProvided:
        minLat !== undefined &&
        maxLat !== undefined &&
        minLon !== undefined &&
        maxLon !== undefined,
      data: rows, // 👈 Aquí devuelves la data directamente
    });
  } catch (err) {
    console.error("GET /api/fires error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
