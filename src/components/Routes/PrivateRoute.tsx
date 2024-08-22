import React, { useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useQuery } from '@apollo/react-hooks'
import { gql } from 'apollo-boost'

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'

import { ACCESS_TOKEN, USER_TRACKING_BLACKLIST } from '../../constants'

import { useAppSelector, useAppDispatch } from '../../state'
import { login } from '../../state/me'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any

const USER_TRACKING_BLACKLIST_LIST: string[] = (USER_TRACKING_BLACKLIST || '').split(',')

const ME = gql`
  query me {
    me {
      id
      name
      email
    }
  }
`

const PrivateRoute: React.FC = () => {
  const me = useAppSelector((state) => state.me)
  const dispatch = useAppDispatch()
  const location = useLocation()
  const authToken = localStorage.getItem(ACCESS_TOKEN)

  const [allowRedirect, setRedirection] = useState(false)

  const { data, loading, error } = useQuery(ME, {
    context: {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    },
    skip: !authToken || null !== me
  })

  useEffect(() => {
    if (window.clarity && me?.id) {
      window.clarity('identify', me?.id, undefined, undefined, me?.id)
      if (USER_TRACKING_BLACKLIST_LIST.includes(me?.id)) {
        window.clarity('set', 'exclude', 'true')
      }
    }
    if (!me && data && data.me) {
      dispatch(login(me))
    }
  }, [me, data, dispatch])

  if (!me || (!me && !authToken) || error || (authToken && !loading && data && !data.me)) {
    if (allowRedirect === true) return <Navigate to="/" replace />

    return (
      <Dialog open aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{''}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Il semblerait que vous n'êtes plus connecté. Vous allez être redirigé vers la page de connexion
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              localStorage.setItem('old-path', location.pathname + location.search)
              setRedirection(true)
            }}
            autoFocus
          >
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    )
  } else {
    return <Outlet />
  }
}

export default PrivateRoute
