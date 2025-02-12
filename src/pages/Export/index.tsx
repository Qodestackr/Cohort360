import React, { useState, useEffect, useCallback, useRef } from 'react'

import { Grid, CssBaseline, Typography, Button, TableRow, CircularProgress, Chip } from '@mui/material'
import { TableCellWrapper } from 'components/ui/TableCell/styles'
import SearchInput from 'components/ui/Searchbar/SearchInput'
import Searchbar from 'components/ui/Searchbar'

import HeaderPage from 'components/ui/HeaderPage'
import DataTable from 'components/DataTable/DataTable'

import { useNavigate, useSearchParams } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from 'state'

import sideBarTransition from 'styles/sideBarTransition'
import styles from './styles'
import { fetchExportsList } from 'services/aphp/serviceExportCohort'
import { cleanSearchParams, handlePageError, checkIfPageAvailable } from 'utils/paginationUtils'
import { CohortJobStatus, LoadingStatus } from 'types'
import { cancelPendingRequest } from 'utils/abortController'

const exportColumnsTable = [
  { label: 'N° de cohorte', key: 'cohort_id' },
  { label: 'Nom de la cohorte', key: 'cohort_name' },
  { label: "Nom de l'export", key: 'target_name' },
  { label: 'Nombre de patient', key: 'patients_count' },
  { label: 'Format', key: 'output_format' },
  { label: 'Date de l’export', key: 'created_at' },
  { label: 'Statut', key: 'request_job_status' }
]

const getStatusChip = (status: CohortJobStatus) => {
  switch (status) {
    case CohortJobStatus.FINISHED:
      return <Chip label="Terminé" size="small" style={{ backgroundColor: '#28a745', color: 'white' }} />
    case CohortJobStatus.NEW:
    case CohortJobStatus.STARTED:
    case CohortJobStatus.PENDING:
      return <Chip label="En cours" size="small" style={{ backgroundColor: '#ffc107', color: 'black' }} />
    case CohortJobStatus.FAILED:
      return <Chip label="Erreur" size="small" style={{ backgroundColor: '#dc3545', color: 'black' }} />
    default:
      return <Chip label="Erreur" size="small" style={{ backgroundColor: '#dc3545', color: 'black' }} />
  }
}

type DataTableLineProps = {
  exportList: any
  exportColumnsTable: any
  loading: LoadingStatus
}

const DataTableLine = ({ exportList, exportColumnsTable, loading }: DataTableLineProps) => {
  const exportLines = exportList?.results?.filter((e: any) => e.output_format === 'csv' || e.output_format === 'xlsx')

  return (
    <>
      {loading !== LoadingStatus.SUCCESS && (
        <TableRow
          style={{ minHeight: `calc(100vh - 500px)`, height: `calc(100vh - 500px)`, maxHeight: `calc(100vh - 500px)` }}
        >
          <TableCellWrapper colSpan={exportColumnsTable.length}>
            <Grid container justifyContent="center">
              <CircularProgress />
            </Grid>
          </TableCellWrapper>
        </TableRow>
      )}
      {loading === LoadingStatus.SUCCESS && (exportLines?.length === 0 || exportLines === undefined) && (
        <TableRow
          style={{ minHeight: `calc(100vh - 500px)`, height: `calc(100vh - 500px)`, maxHeight: `calc(100vh - 500px)` }}
        >
          <TableCellWrapper colSpan={exportColumnsTable.length} align="left">
            <Grid container justifyContent="center">
              <Typography variant="button">Aucun résultat d'export à afficher</Typography>
            </Grid>
          </TableCellWrapper>
        </TableRow>
      )}
      {loading === LoadingStatus.SUCCESS &&
        exportLines?.map((exportLine: any, index: number) => (
          <TableRow key={index}>
            {exportColumnsTable.map((column: any, index: number) => {
              return (
                <>
                  {exportLine[column.key] === null && (
                    <TableCellWrapper key={index} style={{ color: '#928d8d' }}>
                      N/A
                    </TableCellWrapper>
                  )}
                  {exportLine[column.key] !== null && column.key === 'request_job_status' && (
                    <TableCellWrapper key={index}>{getStatusChip(exportLine[column.key])}</TableCellWrapper>
                  )}
                  {exportLine[column.key] !== null && column.key !== 'request_job_status' && (
                    <TableCellWrapper key={index}>{exportLine[column.key]}</TableCellWrapper>
                  )}
                </>
              )
            })}
          </TableRow>
        ))}
    </>
  )
}

const Export: React.FC = () => {
  const { classes, cx } = sideBarTransition()
  const navigate = useNavigate()
  const openDrawer = useAppSelector((state) => state.drawer)
  const user = useAppSelector((state) => state.me?.userName) ?? ''
  const [exportList, setExportList] = useState<any>(null)
  const [loadingStatus, setLoadingStatus] = useState(LoadingStatus.FETCHING)
  const [searchParams, setSearchParams] = useSearchParams()
  const getPageParam = searchParams.get('page')
  const [page, setPage] = useState(getPageParam ? parseInt(getPageParam, 10) : 1)
  const dispatch = useAppDispatch()
  const controllerRef = useRef<AbortController>(new AbortController())
  const isFirstRender = useRef(true)

  const [manelleText, setManelleText] = useState<string | null>(null)

  const _fetchExportList = useCallback(async () => {
    const response = await fetchExportsList(user, page, manelleText, controllerRef.current?.signal)
    if (response) checkIfPageAvailable(exportList?.count ?? 0, page, setPage, dispatch)
    setExportList(response)
    setLoadingStatus(LoadingStatus.SUCCESS)
  }, [page, user, manelleText, exportList?.count, dispatch])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    } else {
      setLoadingStatus(LoadingStatus.FETCHING)
      setPage(1)
    }
  }, [manelleText])

  useEffect(() => {
    setSearchParams(cleanSearchParams({ page: page.toString() }))
    handlePageError(page, setPage, dispatch, setLoadingStatus)
  }, [page, dispatch, setSearchParams])

  useEffect(() => {
    if (loadingStatus === LoadingStatus.FETCHING || loadingStatus === LoadingStatus.IDDLE) {
      controllerRef.current = cancelPendingRequest(controllerRef.current)
      _fetchExportList()
    }
  }, [_fetchExportList, loadingStatus])

  return (
    <Grid
      container
      direction="column"
      className={cx(classes.appBar, {
        [classes.appBarShift]: openDrawer
      })}
    >
      <Grid container justifyContent="center" alignItems="center">
        <CssBaseline />
        <Grid container item xs={11}>
          <HeaderPage id="export-page-title" title="Mes exports" />
          <Grid container alignItems={'center'} className={styles().classes.gridContainer}>
            <Grid item xs={6}>
              <Button
                className={styles().classes.newExportButton}
                onClick={() => {
                  navigate('/exports/new')
                }}
              >
                Nouvel export
              </Button>
            </Grid>
            <Grid container item xs={6} justifyContent={'flex-end'}>
              <Searchbar>
                <SearchInput
                  value={manelleText || ''}
                  placeholder="Rechercher un export"
                  onchange={(value) => {
                    setManelleText(value)
                  }}
                />
              </Searchbar>

              <Button
                className={styles().classes.filterButton}
                onClick={() => {
                  // navigate('/exports/new')
                }}
              >
                Filtrer
              </Button>
            </Grid>
          </Grid>

          <DataTable columns={exportColumnsTable} page={page} setPage={setPage} total={exportList?.count}>
            <DataTableLine exportList={exportList} exportColumnsTable={exportColumnsTable} loading={loadingStatus} />
          </DataTable>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Export
