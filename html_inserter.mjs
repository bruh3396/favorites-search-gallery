/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { readFileSync, readdirSync, writeFileSync } from "fs";
import path from "path";

const HTML_DIRECTORY = "html";

function insertHTMLIntoTypeScript() {
  writeFileSync("src/assets/html.ts", getTypescriptContent());
}

function getTypescriptContent() {
  return `${getDeclarations().join("\n")}\n`;
}

function getDeclarations() {
  return getFilenames().map(fileName => getDeclaration(fileName));
}

function getFilenames() {
  return readdirSync(HTML_DIRECTORY);
}

function getDeclaration(fileName) {
  return `export const ${getVariableName(fileName)} = \`\n${readFile(fileName)}\n\`;`;
}

function getVariableName(fileName) {
  return `${fileName.replace(/\.html$/, "").toUpperCase()}_HTML`;
}

function readFile(fileName) {
  return readFileSync(getFullFilePath(fileName), "utf8");
}

function getFullFilePath(fileName) {
  return path.resolve(path.join(HTML_DIRECTORY, fileName));
}

insertHTMLIntoTypeScript();
