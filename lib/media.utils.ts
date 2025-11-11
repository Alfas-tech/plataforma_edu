export type MediaType = "video" | "audio";

/**
 * Reads the duration metadata of a media file (video or audio) using a temporary HTMLMediaElement.
 */
export async function getMediaDuration(file: File): Promise<number> {
  const type = file.type || "";
  const mediaType: MediaType | null = type.startsWith("video/")
    ? "video"
    : type.startsWith("audio/")
      ? "audio"
      : null;

  if (!mediaType) {
    throw new Error("unsupported-media-type");
  }

  return new Promise<number>((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const mediaElement = document.createElement(mediaType);

    const cleanUp = () => {
      mediaElement.removeAttribute("src");
      mediaElement.load();
      URL.revokeObjectURL(blobUrl);
    };

    mediaElement.preload = "metadata";
    mediaElement.onloadedmetadata = () => {
      const duration = mediaElement.duration;
      cleanUp();
      resolve(duration);
    };

    mediaElement.onerror = () => {
      cleanUp();
      reject(new Error("metadata-load-failed"));
    };

    mediaElement.src = blobUrl;
  });
}
