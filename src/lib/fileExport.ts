import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const value = String(reader.result ?? '')
      resolve(value.includes(',') ? value.split(',')[1] : value)
    }
    reader.readAsDataURL(blob)
  })

export const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const saveBlobFile = async (filename: string, blob: Blob, title = 'Salience export') => {
  if (!Capacitor.isNativePlatform()) {
    downloadBlob(filename, blob)
    return 'downloaded'
  }

  const base64 = await blobToBase64(blob)
  await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  })

  const { uri } = await Filesystem.getUri({
    path: filename,
    directory: Directory.Cache,
  })

  const canShare = await Share.canShare()
  if (canShare.value) {
    await Share.share({
      title,
      text: title,
      files: [uri],
      dialogTitle: title,
    })
    return 'shared'
  }

  return 'saved'
}

export const saveTextFile = (filename: string, text: string, type: string, title?: string) =>
  saveBlobFile(filename, new Blob([text], { type }), title)
