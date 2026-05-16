import { i18n } from '../i18n'

// OpenCV.js 在全局 window 上注入的 cv 对象（无类型声明，故用 any）
declare var cv: any

// 标记 OpenCV 库是否已完成加载并初始化
let cvReady = false
// 正在进行的加载 Promise，用于防止重复加载（单例模式）
let cvLoading: Promise<void> | null = null

/**
 * 加载 OpenCV.js（单例，只加载一次）
 * - 已就绪：直接返回 resolved Promise
 * - 加载中：返回正在进行的 Promise，避免重复创建 script 标签
 * - 首次加载：动态创建 script 标签加载 OpenCV.js CDN
 */
export function loadOpenCV(): Promise<void> {
  // 已就绪，直接返回
  if (cvReady) return Promise.resolve()
  // 已有加载中的 Promise，复用（防止重复加载）
  if (cvLoading) return cvLoading

  cvLoading = new Promise((resolve, reject) => {
    // 防御：可能通过其他方式已注入但未标记
    if (typeof cv !== 'undefined' && cv.Mat) {
      cvReady = true
      resolve()
      return
    }

    // 动态创建 script 标签加载 OpenCV.js
    const script = document.createElement('script')
    script.src = 'https://docs.opencv.org/4.10.0/opencv.js'
    script.async = true

    script.onload = () => {
      // OpenCV.js 的 WASM 编译是异步的，onload 触发时 cv 可能尚未完全初始化
      // 因此需要轮询等待 cv.Mat 可用
      const checkReady = () => {
        if (typeof cv !== 'undefined' && cv.Mat) {
          cvReady = true
          resolve()
        } else {
          // 每 50ms 检查一次，直到 OpenCV 初始化完成
          setTimeout(checkReady, 50)
        }
      }
      checkReady()
    }

    script.onerror = () => {
      // 加载失败时清空 loading 状态，允许后续重试
      cvLoading = null
      reject(new Error(i18n.global.t('error.opencvLoad')))
    }

    document.head.appendChild(script)
  })

  return cvLoading
}

export interface Region {
  /** 归一化 x 坐标（0~1，相对于图片宽度） */
  x: number
  /** 归一化 y 坐标（0~1，相对于图片高度） */
  y: number
  /** 归一化宽度（0~1，相对于图片宽度） */
  width: number
  /** 归一化高度（0~1，相对于图片高度） */
  height: number
}

/**
 * 使用 OpenCV 的 inpaint 算法对图片中的指定区域进行智能修复
 * 适合去除水印、Logo、文字等小区域覆盖物
 *
 * 流程：
 *   原图 + 水印区域遮罩 → cv.inpaint() → base64 → 保存临时文件
 *
 * @param imagePath - 原始图片的本地路径
 * @param regions   - 水印区域列表（归一化坐标）
 * @returns 修复后的临时文件路径
 */
export async function inpaintImage(
  imagePath: string,
  regions: Region[]
): Promise<string> {
  // === 1. 加载原图到渲染进程 ===
  // 通过 IPC 从主进程读取图片文件为 base64 字符串
  const dataUrl = await window.electronAPI.readImageBase64(imagePath)
  // 将 base64 解码为 HTMLImageElement（获取自然宽高）
  const img = await loadImage(dataUrl)
  const imgWidth = img.naturalWidth
  const imgHeight = img.naturalHeight

  // === 2. 创建源图画布（原图 RGBA） ===
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = imgWidth
  srcCanvas.height = imgHeight
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(img, 0, 0, imgWidth, imgHeight)

  // === 3. 创建遮罩画布 ===
  // 遮罩规则：
  //   - 黑色（#000）= 保留区域（不处理）
  //   - 白色（#fff）= 待修复区域（inpaint 会填充这些像素）
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = imgWidth
  maskCanvas.height = imgHeight
  const maskCtx = maskCanvas.getContext('2d')!

  // 全画布初始化为黑色
  maskCtx.fillStyle = '#000'
  maskCtx.fillRect(0, 0, imgWidth, imgHeight)

  // 将所有水印区域绘制为白色
  for (const region of regions) {
    // 归一化坐标 → 像素坐标
    const x = Math.round(region.x * imgWidth)
    const y = Math.round(region.y * imgHeight)
    const w = Math.round(region.width * imgWidth)
    const h = Math.round(region.height * imgHeight)
    maskCtx.fillStyle = '#fff'
    maskCtx.fillRect(x, y, w, h)
  }

  // === 4. 转换为 OpenCV Mat 并执行修复 ===
  // imread(canvas) 为 RGBA；inpaint 要求 src 为 8UC1/8UC3，mask 为 8UC1
  // 通道数变化时不能 in-place cvtColor（maskMat 上 RGBA→GRAY 会抛异常）
  const srcRgba = cv.imread(srcCanvas)
  const srcMat = new cv.Mat()
  cv.cvtColor(srcRgba, srcMat, cv.COLOR_RGBA2RGB)
  srcRgba.delete()

  const maskRgba = cv.imread(maskCanvas)
  const maskMat = new cv.Mat()
  cv.cvtColor(maskRgba, maskMat, cv.COLOR_RGBA2GRAY)
  maskRgba.delete()
  cv.threshold(maskMat, maskMat, 127, 255, cv.THRESH_BINARY)

  const dstMat = new cv.Mat()
  // INPAINT_TELEA：基于快速行进法；半径 3 控制邻域平滑范围
  cv.inpaint(srcMat, maskMat, dstMat, 3, cv.INPAINT_TELEA)

  // === 5. 将修复结果导出为文件 ===
  // OpenCV Mat → Canvas
  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = imgWidth
  resultCanvas.height = imgHeight
  cv.imshow(resultCanvas, dstMat)

  // Canvas → base64 PNG → 通过 IPC 保存到主进程临时目录
  // 使用 PNG 格式保证无损，避免 JPEG 压缩引入额外失真
  const outputDataUrl = resultCanvas.toDataURL('image/png')
  const base64 = outputDataUrl.split(',')[1]

  const tempPath = await window.electronAPI.saveBuffer(
    base64,
    `inpainted_${Date.now()}.png`
  )

  // === 6. 释放 WASM 内存 ===
  // OpenCV.js 操作的是 WASM 线性堆内存（不归 JS GC 管理）
  // 必须显式 delete，否则每处理一张图片都会泄漏约 (宽 × 高 × 4 × 3) 字节
  srcMat.delete()
  maskMat.delete()
  dstMat.delete()

  return tempPath
}

/**
 * 将图片 URL（base64 或远程地址）加载为 HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(i18n.global.t('error.imageLoad')))
    img.src = url
  })
}
