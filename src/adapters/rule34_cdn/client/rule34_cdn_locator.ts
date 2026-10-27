import { Rule34CdnFileExtension, isRule34CdnFileExtension } from "@/adapters/rule34_cdn/client/rule34_cdn_file_extension";

export interface Rule34CdnLocator {
  readonly directory: string;
  readonly name: string;
  readonly extension: Rule34CdnFileExtension | null;
}

export function readRule34CdnLocator(locator: string): Rule34CdnLocator {
  const [directory = "", file = ""] = locator.split("/");
  const [name = "", extension = ""] = file.split(".");
  return { directory, name, extension: isRule34CdnFileExtension(extension) ? extension : null };
}
