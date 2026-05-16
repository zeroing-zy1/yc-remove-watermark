import sharp from 'sharp'

export async function removeWatermarkByCrop(
  inputPath: string,
  outputPath: string,
  region: { x: number; y: number; width: number; height: number }
): Promise<void> {
  const image = sharp(inputPath)
  const metadata = await image.metadata()
  const imgWidth = metadata.width!
  const imgHeight = metadata.height!

  let left = Math.round(region.x * imgWidth)
  let top = Math.round(region.y * imgHeight)
  let w = Math.round(region.width * imgWidth)
  let h = Math.round(region.height * imgHeight)

  left = Math.max(0, Math.min(left, imgWidth - 1))
  top = Math.max(0, Math.min(top, imgHeight - 1))
  w = Math.min(w, imgWidth - left)
  h = Math.min(h, imgHeight - top)

  if (w <= 0 || h <= 0) {
    await image.png().toFile(outputPath)
    return
  }

  const blurred = await image
    .clone()
    .blur(25)
    .png()
    .toBuffer()

  const fillPatch = await sharp(blurred)
    .extract({ left, top, width: w, height: h })
    .png()
    .toBuffer()

  await image
    .composite([{ input: fillPatch, top, left }])
    .png()
    .toFile(outputPath)
}

export async function removeWatermarkByInpaint(
  inputPath: string,
  outputPath: string,
  region: { x: number; y: number; width: number; height: number }
): Promise<void> {
  const image = sharp(inputPath)
  const metadata = await image.metadata()
  const imgWidth = metadata.width!
  const imgHeight = metadata.height!

  const left = Math.round(region.x * imgWidth)
  const top = Math.round(region.y * imgHeight)
  const w = Math.round(region.width * imgWidth)
  const h = Math.round(region.height * imgHeight)

  const blurSize = Math.max(w, h) * 2

  const blurred = await image
    .clone()
    .blur(blurSize)
    .png()
    .toBuffer()

  const regionExtract = await sharp(blurred)
    .extract({ left, top, width: w, height: h })
    .png()
    .toBuffer()

  await image
    .composite([{ input: regionExtract, top, left }])
    .png()
    .toFile(outputPath)
}
