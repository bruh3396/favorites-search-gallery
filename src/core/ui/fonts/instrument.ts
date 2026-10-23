import { AppFont } from "@/core/ui/fonts/app_font";

export const INSTRUMENT_FONT: AppFont = {
  name: "Instrument",
  text: "\"Instrument Sans\", system-ui, sans-serif",
  numeric: "\"JetBrains Mono\", ui-monospace, Consolas, monospace",
  faces: [
    {
      family: "Instrument Sans",
      source: "https://fonts.gstatic.com/s/instrumentsans/v4/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0SZe1Q.woff2",
      weight: "400 700"
    },
    {
      family: "JetBrains Mono",
      source: "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2",
      weight: "400 700"
    }
  ]
};
