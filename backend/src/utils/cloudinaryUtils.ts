import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import type { UploadApiResponse } from 'cloudinary';
import type { Express } from 'express';

const bufferToStream = (buffer: Buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export const uploadBufferToCloudinary = (file: Express.Multer.File, folder: string) => {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary upload returned no result'));
        resolve(result);
      }
    );

    bufferToStream(file.buffer).pipe(uploadStream);
  });
};

export const getCloudinaryPublicId = (url: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const uploadIndex = pathname.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let publicIdWithExtension = pathname.slice(uploadIndex + '/upload/'.length);
    // Strip version segment if present: /upload/v1234/folder/name.jpg
    publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, '');
    return publicIdWithExtension.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

export const deleteCloudinaryAsset = async (url: string) => {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};
