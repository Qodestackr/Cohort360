import React, { useEffect, useState } from 'react'
import moment from 'moment'

import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import 'moment/locale/fr'

import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  Grid,
  IconButton,
  TextField,
  Typography
} from '@mui/material'

import ClearIcon from '@mui/icons-material/Clear'

import services from 'services/aphp'
import { capitalizeFirstLetter } from 'utils/capitalize'

import { MedicationsFilters } from 'types'

import useStyles from './styles'

type MedicationFiltersProps = {
  open: boolean
  deidentified: boolean
  showPrescriptionTypes: boolean
  showAdministrationRoutes: boolean
  onClose: () => void
  filters: MedicationsFilters
  setFilters: (filters: MedicationsFilters) => void
}
const MedicationFilters: React.FC<MedicationFiltersProps> = ({
  open,
  onClose,
  deidentified,
  showPrescriptionTypes,
  showAdministrationRoutes,
  filters,
  setFilters
}) => {
  const classes = useStyles()

  const [_nda, setNda] = useState<string>(filters.nda)
  const [_startDate, setStartDate] = useState<any>(filters.startDate)
  const [_endDate, setEndDate] = useState<any>(filters.endDate)
  const [_selectedPrescriptionTypes, setSelectedPrescriptionTypes] = useState<any[]>(filters.selectedPrescriptionTypes)
  const [_selectedAdministrationRoutes, setSelectedAdministrationRoutes] = useState<any[]>(
    filters.selectedAdministrationRoutes
  )
  const [dateError, setDateError] = useState(false)

  const [prescriptionTypesList, setPrescriptionTypesList] = useState<any[]>([])
  const [administrationRoutesList, setAdministrationRoutesList] = useState<any[]>([])

  const _onChangeNda = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNda(event.target.value)
  }

  const _onChangeSelectedPrescriptionTypes = (event: React.ChangeEvent<{}>, value: any[]) => {
    setSelectedPrescriptionTypes(value)
  }

  const _onChangeSelectedAdministrationRoutes = (event: React.ChangeEvent<{}>, value: any[]) => {
    setSelectedAdministrationRoutes(value)
  }

  const _onSubmit = () => {
    const newStartDate = moment(_startDate).isValid() ? moment(_startDate).format('YYYY-MM-DD') : null
    const newEndDate = moment(_endDate).isValid() ? moment(_endDate).format('YYYY-MM-DD') : null

    setFilters({
      nda: _nda,
      startDate: newStartDate,
      endDate: newEndDate,
      selectedPrescriptionTypes: _selectedPrescriptionTypes,
      selectedAdministrationRoutes: _selectedAdministrationRoutes
    })
    onClose()
  }

  useEffect(() => {
    const _fetchPrescriptionTypes = async () => {
      const prescriptionTypes = await services.cohortCreation.fetchPrescriptionTypes()
      if (!prescriptionTypes) return
      setPrescriptionTypesList(prescriptionTypes)
    }
    const _fetchAdministrationRoutes = async () => {
      const administrationRoutesList = await services.cohortCreation.fetchAdministrations()
      if (!administrationRoutesList) return
      setAdministrationRoutesList(administrationRoutesList)
    }
    _fetchPrescriptionTypes()
    _fetchAdministrationRoutes()
  }, [])

  useEffect(() => {
    setNda(filters.nda)
    setStartDate(filters.startDate)
    setEndDate(filters.endDate)
    setSelectedPrescriptionTypes(filters.selectedPrescriptionTypes)
    setSelectedAdministrationRoutes(filters.selectedAdministrationRoutes)
  }, [open]) // eslint-disable-line

  useEffect(() => {
    if (moment(_startDate).isAfter(_endDate)) {
      setDateError(true)
    } else {
      setDateError(false)
    }
  }, [_startDate, _endDate])

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Filtrer par :</DialogTitle>
      <DialogContent className={classes.dialog}>
        {!deidentified && (
          <Grid container direction="column" className={classes.filter}>
            <Typography variant="h3">NDA :</Typography>
            <TextField
              margin="normal"
              fullWidth
              autoFocus
              placeholder="Exemple: 6601289264,141740347"
              value={_nda}
              onChange={_onChangeNda}
            />
          </Grid>
        )}

        {showAdministrationRoutes && (
          <Grid container direction="column" className={classes.filter}>
            <Typography variant="h3">Voie d'administration :</Typography>
            <Autocomplete
              multiple
              onChange={_onChangeSelectedAdministrationRoutes}
              options={administrationRoutesList}
              value={_selectedAdministrationRoutes}
              disableCloseOnSelect
              getOptionLabel={(administrationRoute: any) => capitalizeFirstLetter(administrationRoute.label)}
              renderOption={(props, administrationRoute: any) => (
                <li {...props}>{capitalizeFirstLetter(administrationRoute.label)}</li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Voie d'administration"
                  placeholder="Sélectionner une ou plusieurs voie d'administration"
                />
              )}
              className={classes.autocomplete}
            />
          </Grid>
        )}

        {showPrescriptionTypes && (
          <Grid container direction="column" className={classes.filter}>
            <Typography variant="h3">Type de prescriptions :</Typography>
            <Autocomplete
              multiple
              onChange={_onChangeSelectedPrescriptionTypes}
              options={prescriptionTypesList}
              value={_selectedPrescriptionTypes}
              disableCloseOnSelect
              getOptionLabel={(prescriptionType: any) => capitalizeFirstLetter(prescriptionType.label)}
              renderOption={(props, prescriptionType: any) => (
                <li {...props}>{capitalizeFirstLetter(prescriptionType.label)}</li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Types de prescriptions"
                  placeholder="Sélectionner type(s) de prescriptions"
                />
              )}
              className={classes.autocomplete}
            />
          </Grid>
        )}

        <Grid container direction="column">
          <Typography variant="h3">Date :</Typography>
          <Grid container alignItems="center" className={classes.datePickers}>
            <FormLabel component="legend" className={classes.dateLabel}>
              Après le :
            </FormLabel>
            <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={'fr'}>
              <DatePicker
                onChange={(date) => setStartDate(date ?? null)}
                value={_startDate}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    variant="standard"
                    error={dateError}
                    helperText={dateError && 'La date doit être au format "JJ/MM/AAAA"'}
                    style={{ width: 'calc(100% - 120px)' }}
                  />
                )}
              />
            </LocalizationProvider>
            {_startDate !== null && (
              <IconButton classes={{ root: classes.clearDate }} color="primary" onClick={() => setStartDate(null)}>
                <ClearIcon />
              </IconButton>
            )}
          </Grid>

          <Grid container alignItems="center" className={classes.datePickers}>
            <FormLabel component="legend" className={classes.dateLabel}>
              Avant le :
            </FormLabel>
            <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={'fr'}>
              <DatePicker
                onChange={(date) => setEndDate(date ?? null)}
                value={_endDate}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    variant="standard"
                    error={dateError}
                    helperText={dateError && 'La date doit être au format "JJ/MM/AAAA"'}
                    style={{ width: 'calc(100% - 120px)' }}
                  />
                )}
              />
            </LocalizationProvider>
            {_endDate !== null && (
              <IconButton classes={{ root: classes.clearDate }} color="primary" onClick={() => setEndDate(null)}>
                <ClearIcon />
              </IconButton>
            )}
          </Grid>
          {dateError && (
            <Typography className={classes.dateError}>
              Vous ne pouvez pas sélectionner de date de début supérieure à la date de fin.
            </Typography>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={_onSubmit} disabled={dateError}>
          Valider
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MedicationFilters
