import axios from 'axios'
import { ACCESS_TOKEN, BACK_API_URL } from '../constants'

const apiBackend = axios.create({
  baseURL: BACK_API_URL,
  headers: {
    Accept: 'application/json'
  }
})

apiBackend.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN)
  config.headers.Authorization = `Bearer ${token}`
  return config
})

apiBackend.interceptors.response.use(
  (response) => {
    if (response) return response
  },
  function (error) {
    if (error.response) {
      if ((401 || 400 || 403) === error.response.status) {
        localStorage.clear()
        window.location = '/'
      }
      return error
    }
  }
)

export default apiBackend
