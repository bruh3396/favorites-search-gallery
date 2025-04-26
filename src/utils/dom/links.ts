export function getPostPageURL(id: string): string {
  return `https://rule34.xxx/index.php?page=post&s=view&id=${id}`;
}

export function openPostPage(id: string): void {
  window.open(getPostPageURL(id), "_blank");
}

export function openSearchPage(searchQuery: string): void {
  window.open(`https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(searchQuery)}`);
}

export function createObjectURLFromSvg(svg: string): string {
  const blob = new Blob([svg], {
    type: "image/svg+xml"
  });
  return URL.createObjectURL(blob);
}
