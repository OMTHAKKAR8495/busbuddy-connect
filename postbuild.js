import fs from "fs";
import path from "path";

function prepareVercelDist() {
  const clientDir = path.resolve("dist/client");
  const assetsDir = path.join(clientDir, "assets");

  if (!fs.existsSync(assetsDir)) {
    console.error("Assets directory not found at:", assetsDir);
    return;
  }

  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter((f) => f.endsWith(".js"));
  const cssFiles = files.filter((f) => f.endsWith(".css"));

  console.log(`[Postbuild] Found ${jsFiles.length} JS files, ${cssFiles.length} CSS files`);

  // Build link and script tags for static HTML shell
  const cssTags = cssFiles.map((c) => `<link rel="stylesheet" href="/assets/${c}" />`).join("\n    ");
  const jsTags = jsFiles.map((j) => `<script type="module" src="/assets/${j}"></script>`).join("\n    ");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GSFCU Transit — Smart Campus Mobility Console</title>
    ${cssTags}
  </head>
  <body class="bg-background text-foreground min-h-screen">
    <div id="root"></div>
    ${jsTags}
  </body>
</html>`;

  // Write index.html and 404.html to dist/client
  fs.writeFileSync(path.join(clientDir, "index.html"), htmlContent);
  fs.writeFileSync(path.join(clientDir, "404.html"), htmlContent);

  // Write to dist root as well
  const distDir = path.resolve("dist");
  fs.writeFileSync(path.join(distDir, "index.html"), htmlContent);

  console.log("✓ [Postbuild] Successfully created dist/client/index.html & 404.html with all JS/CSS module tags for Vercel!");
}

prepareVercelDist();
