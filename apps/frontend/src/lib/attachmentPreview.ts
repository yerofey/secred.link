/** MIME types safe to show in an `<img>` preview after decrypt (browser limits apply). */
export function isPreviewableImageMime(mime: string): boolean {
	if (!mime.startsWith('image/')) {
		return false;
	}
	const lower = mime.toLowerCase();
	if (lower === 'image/heic' || lower === 'image/heif') {
		return false;
	}
	return true;
}
