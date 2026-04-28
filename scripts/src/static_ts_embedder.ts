import * as path from "path";
import { readFileSync, readdirSync as readFilenames, writeFileSync } from "fs";

interface EmbedConfig {
  source: string;
  variableSuffix: string;
  destination: string;
}

const EMBED_CONFIGS: EmbedConfig[] = [
  { source: "html", variableSuffix: "HTML", destination: "src/assets/html.ts" },
  { source: "css", variableSuffix: "CSS", destination: "src/assets/css.ts" }
];

function embedAll(): void {
  EMBED_CONFIGS.forEach(config => writeFileSync(config.destination, generateTsModule(config)));
}

function generateTsModule(config: EmbedConfig): string {
  return `${generateDeclarations(config).join("\n")}\n`;
}

function generateDeclarations(config: EmbedConfig): string[] {
  return readFilenames(config.source).map(filename => generateDeclaration(filename, config));
}

function generateDeclaration(filename: string, config: EmbedConfig): string {
  return `export const ${deriveVariableName(filename, config)} = \`\n${readFileSync(resolveFilePath(filename, config.source), "utf8")}\n\`;`;
}

function deriveVariableName(filename: string, config: EmbedConfig): string {
  return `${path.basename(filename, path.extname(filename)).toUpperCase()}_${config.variableSuffix}`;
}

function resolveFilePath(filename: string, directory: string): string {
  return path.resolve(path.join(directory, filename));
}

embedAll();
