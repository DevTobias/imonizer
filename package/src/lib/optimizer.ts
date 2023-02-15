import { loadImage, applyTransforms, builtins, generateTransforms } from 'imagetools-core';
import path from 'path';
import sharp, { Sharp } from 'sharp';
import crypto from 'crypto';
import fs from 'fs';
import chalk from 'chalk';

export const formats = ['jpg', 'webp', 'avif'] as const;
export type Format = (typeof formats)[number];

/* const lowResolutionPlaceholderJpeg = async (image: Sharp) => {
  const buffer = await image
    .resize(10)
    .jpeg({
      quality: 50,
      progressive: true,
      optimiseScans: true,
      chromaSubsampling: '4:2:0',
      trellisQuantisation: true,
      quantisationTable: 2,
    })
    .toBuffer({ resolveWithObject: false });
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}; */

const lowResolutionPlaceholderWebp = async (image: Sharp) => {
  const buffer = await image.resize(10).webp({ quality: 50 }).toBuffer({ resolveWithObject: false });
  return `data:image/webp;base64,${buffer.toString('base64')}`;
};

const getAspectRatioHeight = (originalWidth: number, originalHeight: number, destinationWidth: number) => {
  return originalHeight / (originalWidth / destinationWidth);
};

const transformImage = async (image: Sharp, target: { width: number; format: Format }) => {
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error('could not retrieve image metadata');
  const targetHeight = getAspectRatioHeight(meta.width, meta.height, target.width);
  const transformConfig = { ...target, height: targetHeight };
  const { transforms } = generateTransforms(transformConfig, builtins);
  const { image: transformedImage } = await applyTransforms(transforms, image);
  return [transformedImage, targetHeight] as const;
};

export const generateAssetBundleFromBuffer = async (outputFormats: Format[], widths: number[], inputBuffer: Buffer) => {
  const image = sharp(inputBuffer);

  const transformedImages = Promise.all(
    outputFormats.map(async (format) => {
      return Promise.all(
        widths.map(async (width) => {
          const [transformed, height] = await transformImage(image, { format, width });
          const hash = crypto.randomBytes(5).toString('hex');
          return {
            name: `${format}-${width}-${Math.floor(height)}-${hash}.${format}`,
            buffer: transformed.toBuffer(),
            width,
            height,
          };
        }),
      );
    }),
  );
  const placeholderImage = lowResolutionPlaceholderWebp(image);

  const [placeholder, images] = await Promise.all([placeholderImage, transformedImages]);
  return { placeholder, images: images.flat() };
};

export const generateAssetBundleFromFile = async (
  outputFormats: Format[],
  widths: number[],
  imagePath: string,
  outputFolder: string,
) => {
  const image = loadImage(imagePath);
  const imageName = path.basename(imagePath, path.extname(imagePath)).replace('-', '_');
  fs.rmSync(outputFolder, { recursive: true, force: true });
  fs.mkdirSync(outputFolder);

  console.log(chalk.bgGreen(`Creating bundle for image...`));

  const transformedImages = Promise.all(
    outputFormats.map(async (format) => {
      return Promise.all(
        widths.map(async (width) => {
          const [transformed, height] = await transformImage(image, { format, width });
          const hash = crypto.randomBytes(5).toString('hex');
          const output = await transformed.toFile(
            `${outputFolder}/${imageName}-${format}-${width}-${Math.floor(height)}-${hash}.${format}`,
          );
          console.log(
            chalk.green(
              `  Created ${imageName}-${format}-${width}-${Math.floor(height)}-${hash}.${format} (${
                Math.round(output.size / 10) / 100
              }KB)`,
            ),
          );
        }),
      );
    }),
  );

  const placeholderImage = lowResolutionPlaceholderWebp(image);

  const [placeholder] = await Promise.all([placeholderImage, transformedImages]);
  console.log(`\n${chalk.bgGreen(`Creating small placeholder encoding`)}`);
  console.log(chalk.green(`  ${placeholder}`));
};
