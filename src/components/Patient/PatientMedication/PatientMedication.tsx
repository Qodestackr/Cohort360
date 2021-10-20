import React, { useEffect, useState } from 'react'
import moment from 'moment'

import {
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  InputBase,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography
} from '@material-ui/core'
import Pagination from '@material-ui/lab/Pagination'

import ClearIcon from '@material-ui/icons/Clear'
import { ReactComponent as SearchIcon } from 'assets/icones/search.svg'
import { ReactComponent as FilterList } from 'assets/icones/filter.svg'

import services from 'services'

import useStyles from './styles'

type PatientPMSITypes = {
  groupId?: string
  patientId: string
  prescription?: any[]
  prescriptionTotal: number
  administration?: any[]
  administrationTotal: number
  deidentifiedBoolean: boolean
}
const PatientPMSI: React.FC<PatientPMSITypes> = ({
  groupId,
  patientId,
  prescription,
  prescriptionTotal,
  administration,
  administrationTotal,
  deidentifiedBoolean
}) => {
  const classes = useStyles()

  const [selectedTab, selectTab] = useState<'prescription' | 'administration'>('prescription')
  const [data, setData] = useState<any[]>([])
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [nda, setNda] = useState('')
  const [filter, setFilter] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null
  })
  const [sort, setSort] = useState<{ by: string; direction: 'asc' | 'desc' }>({ by: '', direction: 'asc' })

  const documentLines = 20 // Number of desired lines in the document array

  const _fetchMedication = async (
    deidentified: boolean,
    page: number,
    patientId: string,
    selectedTab: 'prescription' | 'administration',
    searchInput: string,
    nda: string,
    sortBy: string,
    sortDirection: string,
    startDate?: string | null,
    endDate?: string | null
  ) => {
    setLoadingStatus(true)

    const medicationResp = await services.patients.fetchMedication(
      deidentified,
      page,
      patientId,
      selectedTab,
      searchInput,
      nda,
      sortBy,
      sortDirection,
      groupId,
      startDate,
      endDate
    )

    setData(medicationResp?.medicationData ?? [])
    setTotal(medicationResp?.medicationTotal ?? 0)
    setLoadingStatus(false)
  }

  const handleClearInput = () => {
    setSearchInput('')
    setPage(1)
    _fetchMedication(
      deidentifiedBoolean,
      1,
      patientId,
      selectedTab,
      '',
      nda,
      sort.by,
      sort.direction,
      filter.startDate,
      filter.endDate
    )
  }

  const handleSort = (property: any) => (event: React.MouseEvent<unknown> /*eslint-disable-line*/) => {
    console.log('open :>> ', open)

    const isAsc: boolean = sort.by === property && sort.direction === 'asc'
    const newDirection = isAsc ? 'desc' : 'asc'

    setSort({ by: property, direction: newDirection })
    setPage(1)
    _fetchMedication(
      deidentifiedBoolean,
      1,
      patientId,
      selectedTab,
      searchInput,
      nda,
      property,
      newDirection,
      filter.startDate,
      filter.endDate
    )
  }

  const handleChangePage = (event?: React.ChangeEvent<unknown>, value?: number) => {
    setPage(value ? value : 1)
    setLoadingStatus(true)
    _fetchMedication(
      deidentifiedBoolean,
      value ? value : 1,
      patientId,
      selectedTab,
      searchInput,
      nda,
      sort.by,
      sort.direction,
      filter.startDate,
      filter.endDate
    )
  }

  const handleChangeSearchInput = (event: { target: { value: React.SetStateAction<string> } }) => {
    setSearchInput(event.target.value)
  }

  const handleDeleteChip = (filterName: string, value?: string) => {
    switch (filterName) {
      case 'startDate':
        setFilter((prevState) => ({ ...prevState, startDate: null }))
        break
      case 'endDate':
        setFilter((prevState) => ({ ...prevState, endDate: null }))
        break
      default:
        console.log('value :>> ', value)
        break
    }
  }

  const onSearchPMSI = async () => {
    handleChangePage()
  }

  const onKeyDown = async (e: { keyCode: number; preventDefault: () => void }) => {
    if (e.keyCode === 13) {
      e.preventDefault()
      onSearchPMSI()
    }
  }

  useEffect(() => {
    handleChangePage()
  }, [nda, filter]) // eslint-disable-line

  useEffect(() => {
    setPage(1)
    setSearchInput('')
    setNda('')
    setFilter({ startDate: null, endDate: null })
    switch (selectedTab) {
      case 'prescription':
        setData(prescription ?? [])
        setTotal(prescriptionTotal ?? 0)
        break
      case 'administration':
        setData(administration ?? [])
        setTotal(administrationTotal ?? 0)
        break
      default:
        setData([])
        setTotal(0)
        break
    }
  }, [patientId, selectedTab]) // eslint-disable-line

  return (
    <Grid container item xs={11} justify="flex-end" className={classes.documentTable}>
      <Grid item container justify="space-between" alignItems="center">
        <Tabs
          classes={{
            root: classes.root,
            indicator: classes.indicator
          }}
          value={selectedTab}
          onChange={(event, value) => selectTab(value)}
        >
          <Tab
            classes={{ selected: classes.selected }}
            className={classes.tabTitle}
            label="Prescription"
            value="prescription"
          />
          <Tab
            classes={{ selected: classes.selected }}
            className={classes.tabTitle}
            label="Administration"
            value="administration"
          />
        </Tabs>
        <Typography variant="button">
          {total || 0} /{' '}
          {selectedTab === 'prescription'
            ? `${prescriptionTotal ?? 0} prescription(s)`
            : `${administrationTotal} administration(s)`}
        </Typography>
        <div className={classes.documentButtons}>
          <Grid item container xs={10} alignItems="center" className={classes.searchBar}>
            <InputBase
              placeholder="Rechercher"
              className={classes.input}
              value={searchInput}
              onChange={handleChangeSearchInput}
              onKeyDown={onKeyDown}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={handleClearInput}>{searchInput && <ClearIcon />}</IconButton>
                </InputAdornment>
              }
            />
            <IconButton type="submit" aria-label="search" onClick={onSearchPMSI}>
              <SearchIcon fill="#ED6D91" height="15px" />
            </IconButton>
          </Grid>
          <Button
            variant="contained"
            disableElevation
            startIcon={<FilterList height="15px" fill="#FFF" />}
            className={classes.searchButton}
            onClick={() => setOpen('filter')}
          >
            Filtrer
          </Button>
        </div>
      </Grid>

      <Grid>
        {filter.startDate && (
          <Chip
            className={classes.chips}
            label={`Après le : ${moment(filter.startDate).format('DD/MM/YYYY')}`}
            onDelete={() => handleDeleteChip('startDate')}
            color="primary"
            variant="outlined"
          />
        )}
        {filter.endDate && (
          <Chip
            className={classes.chips}
            label={`Avant le : ${moment(filter.endDate).format('DD/MM/YYYY')}`}
            onDelete={() => handleDeleteChip('endDate')}
            color="primary"
            variant="outlined"
          />
        )}
      </Grid>

      {loadingStatus ? (
        <Grid container justify="center">
          <CircularProgress />
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="simple table">
            <TableHead className={classes.tableHead}>
              <TableRow>
                <TableCell align="left" className={classes.tableHeadCell}>
                  {deidentifiedBoolean ? 'NDA chiffré' : 'NDA'}
                </TableCell>
                <TableCell align="left" className={classes.tableHeadCell}>
                  Date
                </TableCell>
                <TableCell align="center" className={classes.tableHeadCell}>
                  Code ATC
                </TableCell>
                <TableCell align="center" className={classes.tableHeadCell}>
                  Code UCD
                </TableCell>
                <TableCell align="center" className={classes.tableHeadCell}>
                  Libellé
                </TableCell>
                {selectedTab === 'prescription' && (
                  <TableCell align="center" className={classes.tableHeadCell}>
                    Type de prescription
                  </TableCell>
                )}
                <TableCell align="center" className={classes.tableHeadCell}>
                  Voie d'administration
                </TableCell>
                <TableCell align="center" className={classes.tableHeadCell}>
                  Unité exécutrice
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data ? (
                <>
                  {data.map((row) => {
                    return (
                      <TableRow className={classes.tableBodyRows} key={row.id}>
                        <TableCell align="left">{row.NDA ?? 'Inconnu'}</TableCell>
                        <TableCell align="left">
                          {selectedTab === 'prescription' &&
                            row.recordedDate &&
                            (new Date(row.recordedDate).toLocaleDateString('fr-FR') ?? 'Date inconnue')}
                          {selectedTab === 'administration' &&
                            row.created &&
                            (new Date(row.created).toLocaleDateString('fr-FR') ?? 'Date inconnue')}
                        </TableCell>
                        <TableCell align="center">
                          {selectedTab === 'prescription' && row.code_atc}
                          {selectedTab === 'administration' && row.code_atc}
                        </TableCell>
                        <TableCell align="center" className={classes.libelle}>
                          {selectedTab === 'prescription' && row.code_ucd}
                          {selectedTab === 'administration' && row.code_ucd}
                        </TableCell>
                        <TableCell align="center">{row.name ?? 'Non renseigné'}</TableCell>
                        {selectedTab === 'prescription' && (
                          <TableCell align="center">{row.prescriptionType ?? 'Non renseigné'}</TableCell>
                        )}
                        <TableCell align="center">{row.route ?? 'Non renseigné'}</TableCell>
                        <TableCell align="center">{row.serviceProvider ?? 'Non renseigné'}</TableCell>
                      </TableRow>
                    )
                  })}
                </>
              ) : (
                <Grid container justify="center">
                  <Typography variant="button">Aucun document à afficher</Typography>
                </Grid>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Pagination
        className={classes.pagination}
        count={Math.ceil(total / documentLines)}
        shape="rounded"
        onChange={handleChangePage}
        page={page}
      />
    </Grid>
  )
}
export default PatientPMSI
