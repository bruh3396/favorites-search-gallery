import { AppFont } from "@/core/ui/fonts/app_font";

export const PLEX_FONT: AppFont = {
  name: "Plex",
  text: "\"IBM Plex Sans\", system-ui, sans-serif",
  numeric: "\"IBM Plex Mono\", ui-monospace, Consolas, monospace",
  faces: [
    {
      family: "IBM Plex Sans",
      source: "https://fonts.gstatic.com/s/ibmplexsans/v23/zYXzKVElMYYaJe8bpLHnCwDKr932-G7dytD-Dmu1syxeKYY.woff2",
      weight: "400 700"
    },
    {
      family: "IBM Plex Mono",
      source: "https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q1w.woff2",
      weight: "400"
    }
  ]
};
