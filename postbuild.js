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
  const jsFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));
  const cssFile = files.find((f) => f.startsWith("styles-") && f.endsWith(".css")) || files.find((f) => f.endsWith(".css"));

  console.log(`[Postbuild] Found JS bundle: ${jsFile}, CSS bundle: ${cssFile}`);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GSFCU Transit — Smart Campus Mobility Console</title>
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ""}
  </head>
  <body class="bg-background text-foreground min-h-screen">
    <div id="root"></div>
    ${jsFile ? `<script type="module" src="/assets/${jsFile}"></script>` : ""}
  </body>
</html>`;

  // Write index.html and 404.html to dist/client
  fs.writeFileSync(path.join(clientDir, "index.html"), htmlContent);
  fs.writeFileSync(path.join(clientDir, "404.html"), htmlContent);

  // Write to dist root as well
  const distDir = path.resolve("dist");
  fs.writeFileSync(path.join(distDir, "index.html"), htmlContent);

  console.log("✓ [Postbuild] Successfully created dist/client/index.html & 404.html for Vercel!");
}

prepareVercelDist();
