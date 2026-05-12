import request from '../utils/request'
import { unwrap } from '../utils/unwrap'
import type { MediumShelfWeightData } from '@/types'

const getConfig = () => request.get('/api/medium-shelf-weight')
const saveConfig = (data: MediumShelfWeightData) => request.put('/api/medium-shelf-weight', data)

const mediumShelfWeightApi = {
  getConfig: unwrap(getConfig),
  saveConfig: unwrap(saveConfig)
}

export { mediumShelfWeightApi }
export default mediumShelfWeightApi