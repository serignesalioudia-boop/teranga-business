import { v2 as cloudinary } from "cloudinary";

const configured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
}

export function isCloudinaryConfigured(): boolean {
  return configured;
}

export function getCloudinary() {
  if (!configured) {
    throw new Error(
      "Cloudinary n'est pas configuré : CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET sont requis.",
    );
  }
  return cloudinary;
}

export type UploadMediaInput = {
  buffer: Buffer;
  folder?: string;
  publicId?: string;
};

export type UploadMediaResult = {
  publicId: string;
  secureUrl: string;
};

export async function uploadMedia({
  buffer,
  folder = "teranga-business",
  publicId,
}: UploadMediaInput): Promise<UploadMediaResult> {
  const cld = getCloudinary();

  return new Promise<UploadMediaResult>((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload Cloudinary échoué."));
          return;
        }
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteMedia(publicId: string): Promise<void> {
  const cld = getCloudinary();
  await cld.uploader.destroy(publicId);
}

export type MediaTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
};

export function mediaUrl(
  publicId: string,
  options?: MediaTransformOptions,
): string | null {
  const { cloudName } = getCloudinaryConfig();
  if (!cloudName) return null;

  const parts = [
    options?.width ? `w_${options.width}` : null,
    options?.height ? `h_${options.height}` : null,
    options?.quality ? `q_${options.quality}` : "q_auto",
    "f_auto",
  ].filter((part): part is string => Boolean(part));

  const transformation = parts.length ? `${parts.join(",")}/` : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}${publicId}`;
}

function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
