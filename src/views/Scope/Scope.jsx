import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import clsx from 'clsx'

import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import ScopeTree from 'components/ScopeTree/ScopeTree'
import ScopeSearchBar from 'components/Inputs/ScopeSearchBar/ScopeSearchBar'

import { useAppDispatch, useAppSelector } from 'state'
import { closeAllOpenedPopulation } from 'state/scope'
import { filterScopeTree } from 'utils/scopeTree'

import useStyles from './styles'

const Scope = () => {
  const classes = useStyles()
  const history = useHistory()
  const dispatch = useAppDispatch()

  const [selectedItems, setSelectedItem] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const open = useAppSelector((state) => state.drawer)

  useEffect(() => {
    dispatch(closeAllOpenedPopulation())
  }, [])

  const onChangeSelectedItem = (newSelectedItems: any) => {
    setSelectedItem(newSelectedItems)
  }
  const trimItems = () => {
    let _selectedItems = selectedItems ? selectedItems : []

    _selectedItems = filterScopeTree(_selectedItems)

    const perimetresIds = _selectedItems.map((_selected) => _selected.cohort_id ?? null)
    history.push(`/perimeters?${perimetresIds}`)
  }

  return (
    <Grid
      container
      direction="column"
      position="fixed"
      className={clsx(classes.appBar, {
        [classes.appBarShift]: open
      })}
    >
      <Grid container justifyContent="center" alignItems="center">
        <Grid container item xs={11} direction="column">
          <Typography variant="h1" color="primary" className={classes.title}>
            Explorer un perimètre
          </Typography>
          <Grid container direction="row">
            <ScopeSearchBar searchInput={searchInput} onChangeInput={setSearchInput} />
          </Grid>
          <Paper className={classes.paper}>
            <ScopeTree
              searchInput={searchInput}
              defaultSelectedItems={selectedItems}
              onChangeSelectedItem={onChangeSelectedItem}
            />
          </Paper>
        </Grid>
        <Grid
          container
          item
          xs={10}
          justifyContent="center"
          className={clsx(classes.bottomBar, {
            [classes.bottomBarShift]: open
          })}
        >
          <Grid container item justifyContent="flex-end" className={classes.buttons}>
            <Button
              variant="contained"
              disableElevation
              onClick={() => onChangeSelectedItem([])}
              disabled={!selectedItems.length}
              className={classes.cancelButton}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              disableElevation
              disabled={!selectedItems.length}
              onClick={trimItems}
              className={classes.validateButton}
            >
              Valider
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Scope
