import { Metafile } from "esbuild";

const EXCLUDED_FROM_METAFILE = /node_modules/;

function omitExcluded<T>(entries: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(entries).filter(([path]) => !EXCLUDED_FROM_METAFILE.test(path)));
}

export function filterMetafile(metafile: Metafile): Metafile {
  const outputs = Object.entries(metafile.outputs).map(([path, output]) => [path, { ...output, inputs: omitExcluded(output.inputs) }]);
  return { inputs: omitExcluded(metafile.inputs), outputs: Object.fromEntries(outputs) };
}
