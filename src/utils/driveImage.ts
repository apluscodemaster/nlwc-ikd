export function toGoogleImageURL(url: string): string {
  if (!url) return "";

  const cleanedUrl = url.trim();

  // Match patterns like:
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/uc?id=FILE_ID
  // - https://drive.google.com/open?id=FILE_ID
  const match =
    cleanedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    cleanedUrl.match(/id=([a-zA-Z0-9_-]+)/);

  const id = match ? match[1] : null;
  if (!id) return cleanedUrl;

  // Return the high-quality direct image link
  return `https://lh3.googleusercontent.com/d/${id}`;
}
