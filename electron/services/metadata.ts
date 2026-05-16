import sharp from 'sharp'

export async function stripMetadata(inputPath: string, outputPath: string): Promise<void> {
  const image = sharp(inputPath)

  const metadata = await image.metadata()
  const pipeline = image
    .withMetadata({})
    .png()

  const buffer = await pipeline.toBuffer()

  const cleanImage = sharp(buffer)

  const format = metadata.format || 'png'

  if (format === 'jpeg' || format === 'jpg') {
    await cleanImage.jpeg().toFile(outputPath)
  } else if (format === 'webp') {
    await cleanImage.webp().toFile(outputPath)
  } else {
    await cleanImage.png().toFile(outputPath)
  }
}

export async function reencodeImage(
  inputPath: string,
  outputPath: string,
  format: 'png' | 'jpeg',
  quality: number
): Promise<void> {
  const image = sharp(inputPath)

  if (format === 'jpeg') {
    await image
      .jpeg({ quality })
      .toFile(outputPath)
  } else {
    await image
      .png({ quality: Math.round(quality / 10) })
      .toFile(outputPath)
  }
}
