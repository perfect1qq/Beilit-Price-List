import { ref, computed, watch, type Ref } from 'vue'

const CONTAINER_SIZE = 280
const CROP_BOX_MIN = 60
const CROP_BOX_MAX = 280
const CROP_BOX_DEFAULT = 150
const MIN_SCALE = 0.5
const MAX_SCALE = 5
const ZOOM_STEP = 0.1

type DragTarget = 'image' | 'cropbox' | 'resize' | null

interface UseAvatarCropOptions {
  cropContainerRef: Ref<HTMLDivElement | null>
  previewUrl: Ref<string>
}

export const useAvatarCrop = ({ cropContainerRef, previewUrl }: UseAvatarCropOptions) => {
  const imageState = ref({
    naturalWidth: 0,
    naturalHeight: 0,
    scale: 1,
    x: 0,
    y: 0,
  })

  const cropBoxPos = ref({ x: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2, y: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2 })
  const cropBoxSize = ref(CROP_BOX_DEFAULT)

  const dragTarget = ref<DragTarget>(null)
  let dragStartX = 0
  let dragStartY = 0
  let dragStartValX = 0
  let dragStartValY = 0
  let dragStartW = 0
  let dragStartH = 0
  let resizeDir = ''

  const imageStyle = computed(() => {
    const s = imageState.value
    return {
      position: 'absolute' as const,
      width: `${s.naturalWidth * s.scale}px`,
      height: `${s.naturalHeight * s.scale}px`,
      left: `${s.x}px`,
      top: `${s.y}px`,
      transition: dragTarget.value ? 'none' : '',
      cursor: dragTarget.value === 'image' ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      maxWidth: 'none',
      maxHeight: 'none',
    }
  })

  const cropBoxStyle = computed(() => ({
    width: `${cropBoxSize.value}px`,
    height: `${cropBoxSize.value}px`,
    left: `${cropBoxPos.value.x}px`,
    top: `${cropBoxPos.value.y}px`,
    cursor: dragTarget.value === 'cropbox' ? 'grabbing' : 'move',
  }))

  const previewImgStyle = computed(() => {
    const s = imageState.value
    if (!s.naturalWidth || !s.naturalHeight || !previewUrl.value) return { display: 'none' }

    const cb = cropBoxPos.value
    const boxSize = cropBoxSize.value
    const imgLeftInContainer = s.x
    const imgTopInContainer = s.y
    const imgDisplayW = s.naturalWidth * s.scale
    const imgDisplayH = s.naturalHeight * s.scale

    const previewSize = 100
    const ratio = previewSize / boxSize

    const offsetX = (imgLeftInContainer - cb.x) * ratio
    const offsetY = (imgTopInContainer - cb.y) * ratio
    const scaledW = imgDisplayW * ratio
    const scaledH = imgDisplayH * ratio

    return {
      position: 'absolute' as const,
      top: `${offsetY}px`,
      left: `${offsetX}px`,
      width: `${scaledW}px`,
      height: `${scaledH}px`,
      transformOrigin: '0 0',
    }
  })

  const resetState = () => {
    imageState.value = { naturalWidth: 0, naturalHeight: 0, scale: 1, x: 0, y: 0 }
    cropBoxPos.value = { x: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2, y: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2 }
    cropBoxSize.value = CROP_BOX_DEFAULT
  }

  const clampCropBox = (x: number, y: number, w: number = cropBoxSize.value): [number, number] => {
    return [
      Math.max(0, Math.min(x, CONTAINER_SIZE - w)),
      Math.max(0, Math.min(y, CONTAINER_SIZE - w)),
    ]
  }

  const clampImage = (scale: number, x: number, y: number): [number, number, number] => {
    const imgW = imageState.value.naturalWidth * scale
    const imgH = imageState.value.naturalHeight * scale
    let cx = x
    let cy = y
    if (imgW <= CONTAINER_SIZE) cx = (CONTAINER_SIZE - imgW) / 2
    else cx = Math.max(CONTAINER_SIZE - imgW, Math.min(cx, 0))
    if (imgH <= CONTAINER_SIZE) cy = (CONTAINER_SIZE - imgH) / 2
    else cy = Math.max(CONTAINER_SIZE - imgH, Math.min(cy, 0))
    return [scale, cx, cy]
  }

  const onImageLoad = (e: Event) => {
    const img = e.target as HTMLImageElement
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight

    const fitScale = Math.min(CONTAINER_SIZE / naturalW, CONTAINER_SIZE / naturalH)
    const scale = fitScale > 1 ? 1 : fitScale

    const displayW = naturalW * scale
    const displayH = naturalH * scale
    const x = (CONTAINER_SIZE - displayW) / 2
    const y = (CONTAINER_SIZE - displayH) / 2

    imageState.value = { naturalWidth: naturalW, naturalHeight: naturalH, scale, x, y }
    cropBoxPos.value = { x: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2, y: (CONTAINER_SIZE - CROP_BOX_DEFAULT) / 2 }
    cropBoxSize.value = CROP_BOX_DEFAULT
  }

  const startDrag = (target: DragTarget, clientX: number, clientY: number) => {
    dragTarget.value = target
    dragStartX = clientX
    dragStartY = clientY
    if (target === 'image') {
      dragStartValX = imageState.value.x
      dragStartValY = imageState.value.y
    } else {
      dragStartValX = cropBoxPos.value.x
      dragStartValY = cropBoxPos.value.y
    }
    document.addEventListener('mousemove', onGlobalMove)
    document.addEventListener('mouseup', onGlobalUp)
    document.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', onGlobalTouchEnd)
  }

  const onImgPointerDown = (e: MouseEvent) => startDrag('image', e.clientX, e.clientY)
  const onImgTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) startDrag('image', e.touches[0].clientX, e.touches[0].clientY)
  }
  const onCropBoxPointerDown = (e: MouseEvent) => startDrag('cropbox', e.clientX, e.clientY)
  const onCropBoxTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) startDrag('cropbox', e.touches[0].clientX, e.touches[0].clientY)
  }

  const onGlobalMove = (e: MouseEvent) => {
    if (!dragTarget.value) return
    e.preventDefault()
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    applyDrag(dx, dy)
  }

  const onGlobalTouchMove = (e: TouchEvent) => {
    if (!dragTarget.value || !e.touches.length) return
    e.preventDefault()
    const dx = e.touches[0].clientX - dragStartX
    const dy = e.touches[0].clientY - dragStartY
    applyDrag(dx, dy)
  }

  const applyDrag = (dx: number, dy: number) => {
    if (dragTarget.value === 'image') {
      const [, newX, newY] = clampImage(imageState.value.scale, dragStartValX + dx, dragStartValY + dy)
      imageState.value = { ...imageState.value, x: newX, y: newY }
    } else if (dragTarget.value === 'cropbox') {
      const [newX, newY] = clampCropBox(dragStartValX + dx, dragStartValY + dy)
      cropBoxPos.value = { x: newX, y: newY }
    } else if (dragTarget.value === 'resize') {
      let nx = dragStartValX
      let ny = dragStartValY
      let nw = dragStartW
      let nh = dragStartH

      const d = resizeDir
      if (d.includes('e')) nw = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartW + dx))
      if (d.includes('w')) {
        nw = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartW - dx))
        nx = dragStartValX + dragStartW - nw
      }
      if (d.includes('s')) nh = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartH + dy))
      if (d.includes('n')) {
        nh = Math.max(CROP_BOX_MIN, Math.min(CROP_BOX_MAX, dragStartH - dy))
        ny = dragStartValY + dragStartH - nh
      }

      const size = Math.max(nw, nh)
      if (size !== cropBoxSize.value) {
        cropBoxSize.value = size
        if (nw < size) nx -= (size - nw) / 2
        if (nh < size) ny -= (size - nh) / 2
      }

      const [cx, cy] = clampCropBox(nx, ny, size)
      cropBoxPos.value = { x: cx, y: cy }
    }
  }

  const onGlobalUp = () => endDrag()
  const onGlobalTouchEnd = () => endDrag()

  const endDrag = () => {
    dragTarget.value = null
    document.removeEventListener('mousemove', onGlobalMove)
    document.removeEventListener('mouseup', onGlobalUp)
    document.removeEventListener('touchmove', onGlobalTouchMove)
    document.removeEventListener('touchend', onGlobalTouchEnd)
  }

  const onResizeStart = (e: MouseEvent, dir: string) => {
    startResize(dir, e.clientX, e.clientY)
  }

  const onResizeTouchStart = (e: TouchEvent, dir: string) => {
    if (e.touches.length === 1) startResize(dir, e.touches[0].clientX, e.touches[0].clientY)
  }

  const startResize = (dir: string, clientX: number, clientY: number) => {
    dragTarget.value = 'resize'
    resizeDir = dir
    dragStartX = clientX
    dragStartY = clientY
    dragStartValX = cropBoxPos.value.x
    dragStartValY = cropBoxPos.value.y
    dragStartW = cropBoxSize.value
    dragStartH = cropBoxSize.value
    document.addEventListener('mousemove', onGlobalMove)
    document.addEventListener('mouseup', onGlobalUp)
    document.addEventListener('touchmove', onGlobalTouchMove, { passive: false })
    document.addEventListener('touchend', onGlobalTouchEnd)
  }

  const onWheel = (e: WheelEvent) => {
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, imageState.value.scale + delta))

    if (cropContainerRef.value && newScale !== imageState.value.scale) {
      const rect = cropContainerRef.value.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const ratio = newScale / imageState.value.scale
      const newX = mouseX - (mouseX - imageState.value.x) * ratio
      const newY = mouseY - (mouseY - imageState.value.y) * ratio

      const [, clampedX, clampedY] = clampImage(newScale, newX, newY)
      imageState.value = { ...imageState.value, scale: newScale, x: clampedX, y: clampedY }
    }
  }

  watch(previewUrl, () => resetState())

  const createCroppedBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!previewUrl.value) {
        reject(new Error('No image'))
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const outputSize = cropBoxSize.value
        canvas.width = outputSize
        canvas.height = outputSize
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Canvas not supported'))
          return
        }

        const s = imageState.value
        const cb = cropBoxPos.value
        const boxS = cropBoxSize.value

        const sx = (cb.x - s.x) / s.scale
        const sy = (cb.y - s.y) / s.scale
        const sw = boxS / s.scale
        const sh = boxS / s.scale

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputSize, outputSize)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          },
          'image/png',
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = previewUrl.value
    })
  }

  return {
    imageStyle,
    cropBoxStyle,
    previewImgStyle,
    onImageLoad,
    onImgPointerDown,
    onImgTouchStart,
    onCropBoxPointerDown,
    onCropBoxTouchStart,
    onResizeStart,
    onResizeTouchStart,
    onWheel,
    createCroppedBlob,
    resetState,
  }
}

export type { DragTarget }
