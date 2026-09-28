export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export function selectFile(accept: string, onSelected: (contents: string) => void): void {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = accept;
  input.addEventListener("change", () => {
    const file = input.files?.[0];

    if (file !== undefined) {
      file.text().then(onSelected);
    }
  });
  input.click();
}
