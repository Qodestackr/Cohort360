import axios, { AxiosResponse } from 'axios'

import { PORTAIL_API_URL } from '../../constants'

import { fetchPractitioner } from './callApi'

export interface IServicesPractitioner {
  authenticate: (username: string, password: string) => Promise<any>
  fetchPractitioner: (username: string) => Promise<{
    id: number
    userName: number
    displayName: string
    firstName: string
    lastName: string
  } | null>
}

const servicePractitioner: IServicesPractitioner = {
  authenticate: async (username, password) => {
    getCsrfToken(username, password)
    return axios({
      method: 'POST',
      url: '/api/jwt/',
      data: { username: username, password: password }
    })
  },

  fetchPractitioner: async (username) => {
    const practitioner = await fetchPractitioner({
      identifier: username
    })
    if (
      !practitioner ||
      (practitioner && !practitioner.data) ||
      // @ts-ignore
      (practitioner && practitioner.data && !practitioner.data.entry)
    ) {
      return null
    }

    // @ts-ignore
    const { resource } = practitioner.data.entry[0]
    const id = resource.id
    const userName = resource.identifier[0].value
    const firstName = resource.name[0].given.join(' ')
    const lastName = resource.name[0].family
    const displayName = `${lastName} ${firstName}`

    return {
      id,
      userName,
      displayName,
      firstName,
      lastName
    }
  }
}

export default servicePractitioner

export const getCsrfToken = (username: string, password: string): Promise<AxiosResponse<any>> => {
  const formData = new FormData()
  formData.append('username', username.toString())
  formData.append('password', password)

  return axios({
    method: 'POST',
    url: `${PORTAIL_API_URL}/accounts/login/`,
    data: formData
  })
}