// app/api/fires/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust if your path differs

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
  // Accept YYYY-MM-DD
  const iso = s.length === 10 ? s : s;
  const d = new Date(iso + "T00:00:00Z");
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries()) as QueryParams;

    // Validate dates
    const startDate = parseDateStrict(params.start);
    const endDate = parseDateStrict(params.end);
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Query params `start` and `end` are required in YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    // Limit & bbox
    const limit = Math.min(Number(params.limit ?? 2500), 10000);
    const minLat = params.minLat ? Number(params.minLat) : undefined;
    const maxLat = params.maxLat ? Number(params.maxLat) : undefined;
    const minLon = params.minLon ? Number(params.minLon) : undefined;
    const maxLon = params.maxLon ? Number(params.maxLon) : undefined;

    // Build Prisma where clause
    const where: any = {
      acq_date: {
        gte: startDate,
        lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1), // include full end day (until 23:59:59)
      },
    };

    // Spatial filters (if provided)
    if (
      minLat !== undefined &&
      maxLat !== undefined &&
      minLon !== undefined &&
      maxLon !== undefined
    ) {
      where.latitude = { gte: minLat, lte: maxLat };
      where.longitude = { gte: minLon, lte: maxLon };
    }

    // Select only needed fields (helps performance)
    const rows = await prisma.fireRecord.findMany({
      where,
      orderBy: { acq_date: "asc" },
      take: limit,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        acq_date: true,
        acq_time: true,
        brightness: true,
        frp: true,
        satellite: true,
        instrument: true,
        confidence: true,
        daynight: true,
        // add any other properties you want to expose
      },
    });

    // Build GeoJSON
    const features = rows
      .filter((r) => r.latitude !== null && r.longitude !== null)
      .map((r) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [Number(r.longitude), Number(r.latitude)],
        },
        properties: {
          id: r.id,
          acq_date: r.acq_date ? r.acq_date.toISOString().slice(0, 10) : null,
          acq_time: r.acq_time ?? null,
          brightness: r.brightness ?? null,
          frp: r.frp ?? null,
          satellite: r.satellite ?? null,
          instrument: r.instrument ?? null,
          confidence: r.confidence ?? null,
          daynight: r.daynight ?? null,
        },
      }));

    const featureCollection = {
      type: "FeatureCollection",
      features,
      metadata: {
        count: features.length,
        requestedLimit: limit,
        bboxProvided:
          minLat !== undefined &&
          maxLat !== undefined &&
          minLon !== undefined &&
          maxLon !== undefined,
      },
    };

    return NextResponse.json(featureCollection, { status: 200 });
  } catch (err) {
    console.error("GET /api/fires error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
