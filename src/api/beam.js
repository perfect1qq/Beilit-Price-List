import request from '../utils/request'
import { unwrap } from '../utils/unwrap'

const list = (params) => request.get('/api/beam-quotations', { params })
const create = (data) => request.post('/api/beam-quotations', data)
const update = (id, data) => request.put(`/api/beam-quotations/${id}`, data)
const remove = (id) => request.delete(`/api/beam-quotations/${id}`)
const checkName = (name) => request.get('/api/beam-quotations/check-name', { params: { name } })

const beamApi = {
  list: unwrap(list),
  checkName: unwrap(checkName),
  create: unwrap(create),
  update: unwrap(update),
  remove: unwrap(remove)
}

export { beamApi }
export default beamApi
