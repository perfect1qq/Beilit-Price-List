import request from '@/utils/request'
import { unwrap } from '@/utils/unwrap'

export interface MaterialSpecPreset {
  expandedSurface: number
  thickness: number
  density: number
  materialName: string
}

export interface MaterialRow {
  id: number
  materialName: string
  name: string
  expandedSurface: number | undefined
  thickness: number | undefined
  density: number
  length: number | undefined
  quantity: number | undefined
}

export interface ShelfSpecState {
  length: number
  depth: number
  height: number
  levels: number
  type: 'starter' | 'addon'
}

export interface ShelfMaterialWeightPayload {
  shelfSpec: ShelfSpecState
  rows: MaterialRow[]
  specs: Record<string, MaterialSpecPreset>
}

export interface ShelfMaterialWeightConfig {
  id: number
  key: string
  title: string
  payload: ShelfMaterialWeightPayload
  createdAt: string
  updatedAt: string
}

const getConfig = () =>
  request.get<{ config: ShelfMaterialWeightConfig }>('/api/shelf-material-weight')

const saveConfig = (payload: ShelfMaterialWeightPayload) =>
  request.put<{ config: ShelfMaterialWeightConfig }>('/api/shelf-material-weight', { payload })

const shelfMaterialWeightApi = {
  getConfig: unwrap(getConfig),
  saveConfig: unwrap(saveConfig),
}

export default shelfMaterialWeightApi
