import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("cache du service worker", () => {
  const source = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

  it("n'inscrit pas la racine ou les espaces authentifiés dans les actifs statiques", () => {
    const assetsBlock = source.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/)?.[1] ?? "";
    expect(assetsBlock).not.toContain('"/"');
    expect(assetsBlock).not.toContain("/admin");
    expect(assetsBlock).not.toContain("/employee");
    expect(assetsBlock).not.toContain("/api");
  });

  it("ignore toute requête absente de la liste blanche publique", () => {
    expect(source).toContain("if (!isPublicAsset(event.request.url)) return;");
  });
});
