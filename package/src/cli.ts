#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import { type Format, formats, generateAssetBundleFromFile } from './lib/optimizer';

const program = new Command();
const { log } = console;

program
  .name('image-optimizer')
  .description('CLI to create an optimized image bundle of the source file')
  .version('0.1.0');

interface OptimizeOptions {
  formats: string[];
  out?: string;
  widths?: number[];
}

program
  .command('optimize')
  .description('Create for web optimized images of the provided source image')
  .argument('<string>', 'the source image')
  .option('--formats [formats...]', 'the formats to create images for', ['jpg', 'webp', 'avif'])
  .option('--widths [widths...]', 'the widths to create images in')
  .option('--out [out]', 'the output folder')
  .action(async (url: string, options: OptimizeOptions) => {
    if (options.formats.filter((format) => !(formats as ReadonlyArray<string>).includes(format)).length > 0) {
      log(chalk.red(`Invalid formatters provided. Please provide any combination of: ${formats.join(',')}`));
      process.exit(1);
    }

    if (!options.widths || options?.widths?.length === 0) {
      log(chalk.red('You must provide a minimum of one output width'));
      process.exit(1);
    }

    if (!fs.statSync(url).isFile()) {
      log(chalk.red('The image at provided url does not exist'));
      process.exit(1);
    }

    if (!options.out) {
      log(chalk.red('The output location must be provided'));
      process.exit(1);
    }

    await generateAssetBundleFromFile(options.formats as Format[], options.widths, url, options.out);
  });

program.parse();
