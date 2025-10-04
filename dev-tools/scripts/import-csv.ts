import fs from "fs";
import csv from "csv-parser";
import { prisma } from "../../lib/prisma";

async function main() {
  console.time("🔥 Import Time");

  const BATCH_SIZE = 1000;
  const SLEEP_MS = 300; // pausa entre lotes para no saturar Mongo Atlas
  let batch: any[] = [];
  let totalInserted = 0;

  // Stream CSV — sin cargar todo en memoria
  const stream = fs.createReadStream("dev-tools/scripts/fires.csv").pipe(csv());

  for await (const row of stream as any) {
    const record = {
      latitude: row.latitude ? Number(row.latitude) : null,
      longitude: row.longitude ? Number(row.longitude) : null,
      brightness: row.brightness ? Number(row.brightness) : null,
      scan: row.scan ? Number(row.scan) : null,
      track: row.track ? Number(row.track) : null,
      acq_date: row.acq_date ? new Date(row.acq_date) : null,
      acq_time: row.acq_time || null,
      satellite: row.satellite || null,
      instrument: row.instrument || null,
      confidence: row.confidence ? Number(row.confidence) : null,
      version: row.version ? Number(row.version) : null,
      bright_t31: row.bright_t31 ? Number(row.bright_t31) : null,
      frp: row.frp ? Number(row.frp) : null,
      daynight: row.daynight || null,
      type: row.type ? Number(row.type) : null,
      elevation: row.elevation ? Number(row.elevation) : null,
      land_cover: row.land_cover ? Number(row.land_cover) : null,
      slope: row.slope ? Number(row.slope) : null,
      temperature: row.temperature ? Number(row.temperature) : null,
      wind_speed: row.wind_speed ? Number(row.wind_speed) : null,
      precipitation: row.precipitation ? Number(row.precipitation) : null,
    };

    batch.push(record);

    // Si el lote está completo, insertamos y limpiamos
    if (batch.length >= BATCH_SIZE) {
      try {
        await prisma.fireRecord.createMany({
          data: batch,
        });
        totalInserted += batch.length;
        console.log(`✅ Inserted ${totalInserted.toLocaleString()} records...`);
        batch = [];
        await new Promise((r) => setTimeout(r, SLEEP_MS)); // pequeña pausa
      } catch (err) {
        console.error("⚠️ Error inserting batch:", err);
        // intenta reconectar si la conexión se cae
        await prisma.$disconnect();
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  // Inserta el último lote restante
  if (batch.length > 0) {
    await prisma.fireRecord.createMany({
      data: batch,
    });
    totalInserted += batch.length;
  }

  console.log(`🎯 Import completed: ${totalInserted.toLocaleString()} records`);
  console.timeEnd("🔥 Import Time");

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
