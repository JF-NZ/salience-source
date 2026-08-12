import { exportBundleSchema } from './schemas'
import { saveTextFile } from './fileExport'
import type { AppData, ExportBundle } from '../types'

export const buildExportBundle = (data: AppData, exportedAt = new Date().toISOString()): ExportBundle => ({
  schemaVersion: 6,
  exportedAt,
  ...data,
})

export const parseExportBundle = (value: unknown) => exportBundleSchema.parse(value)

export const serializeExportBundle = (bundle: ExportBundle) => JSON.stringify(bundle, null, 2)

export const downloadJson = (filename: string, payload: string) =>
  saveTextFile(filename, payload, 'application/json', 'Salience JSON export')
