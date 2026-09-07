import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const assets = await prisma.asset.findMany({
    where: { imageUrl: { contains: "googleusercontent" } },
    select: { id: true, name: true, sku: true, imageUrl: true, imageGallery: true },
  });
  console.log(JSON.stringify(assets, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
