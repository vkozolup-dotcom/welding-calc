/** Allow only compressed camera photos we generate / expect */
export function isSafePhotoDataUrl(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(v) &&
    v.length < 2_500_000
  );
}
