import React, { useState, useEffect } from 'react'
import moment from 'moment'

import { Button, Chip, CssBaseline, Grid, Typography } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'
import Skeleton from '@material-ui/lab/Skeleton'

import DocumentFilters from 'components/Filters/DocumentFilters/DocumentFilters'
import DataTableComposition from 'components/DataTable/DataTableComposition'

import { InputSearchDocumentSimple, InputSearchDocumentRegex, InputSearchDocumentButton } from 'components/Inputs'

import { ReactComponent as FilterList } from 'assets/icones/filter.svg'

import { CohortComposition, Order } from 'types'

import services from 'services'
import { useAppSelector } from 'state'

import displayDigit from 'utils/displayDigit'
import { getDisplayingSelectedDocTypes } from 'utils/documentsFormatter'
import { docTypes } from 'assets/docTypes.json'

import useStyles from './styles'

type DocumentsProps = {
  groupId?: string
  deidentifiedBoolean: boolean | null
}

const Documents: React.FC<DocumentsProps> = ({ groupId, deidentifiedBoolean }) => {
  const classes = useStyles()
  const { dashboard } = useAppSelector((state) => ({
    dashboard: state.exploredCohort
  }))
  const { encounters } = dashboard

  const [documentsNumber, setDocumentsNumber] = useState<number | undefined>(0)
  const [allDocumentsNumber, setAllDocumentsNumber] = useState<number | undefined>(0)
  const [patientDocumentsNumber, setPatientDocumentsNumber] = useState<number | undefined>(0)
  const [allPatientDocumentsNumber, setAllPatientDocumentsNumber] = useState<number | undefined>(0)

  const [documents, setDocuments] = useState<CohortComposition[]>([])
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [page, setPage] = useState(1)

  const [searchInput, setSearchInput] = useState('')
  const [searchMode, setSearchMode] = useState(false)

  const [openFilter, setOpenFilter] = useState(false)

  const [nda, setNda] = useState('')
  const [ipp, setIpp] = useState('')
  const [selectedDocTypes, setSelectedDocTypes] = useState<any[]>([])
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)

  const [order, setOrder] = useState<Order>({
    orderBy: 'date',
    orderDirection: 'asc'
  })

  const [inputMode, setInputMode] = useState<'simple' | 'regex'>('simple')

  const displayingSelectedDocType: any[] = getDisplayingSelectedDocTypes(selectedDocTypes)

  const onSearchDocument = async (sortBy: string, sortDirection: 'asc' | 'desc', input?: string, page = 1) => {
    if (input) {
      setSearchMode(true)
    } else {
      setSearchMode(false)
    }
    setLoadingStatus(true)

    const selectedDocTypesCodes = selectedDocTypes.map((docType) => docType.code)

    if (inputMode === 'regex') input = `/${input}/`

    const result = await services.cohorts.fetchDocuments(
      !!deidentifiedBoolean,
      sortBy,
      sortDirection,
      page,
      input ?? '',
      selectedDocTypesCodes,
      nda,
      ipp,
      startDate,
      endDate,
      groupId
    )

    if (result) {
      const { totalDocs, totalAllDocs, documentsList, totalPatientDocs, totalAllPatientDocs } = result
      setDocumentsNumber(totalDocs)
      setAllDocumentsNumber(totalAllDocs)
      setPatientDocumentsNumber(totalPatientDocs)
      setAllPatientDocumentsNumber(totalAllPatientDocs)
      setPage(page)
      setDocuments(documentsList)
    } else {
      setDocuments([])
    }
    setLoadingStatus(false)
  }

  useEffect(() => {
    onSearchDocument(order.orderBy, order.orderDirection)
  }, [!!deidentifiedBoolean, selectedDocTypes, nda, ipp, startDate, endDate, order.orderBy, order.orderDirection]) // eslint-disable-line

  const handleOpenDialog = () => {
    setOpenFilter(true)
  }

  const handleCloseDialog = () => () => {
    setOpenFilter(false)
  }

  const handleDeleteChip = (filterName: string, value?: string) => {
    switch (filterName) {
      case 'nda':
        value &&
          setNda(
            nda
              .split(',')
              .filter((item) => item !== value)
              .join(',')
          )
        break
      case 'ipp':
        value &&
          setIpp(
            ipp
              .split(',')
              .filter((item) => item !== value)
              .join(',')
          )
        break
      case 'selectedDocTypes': {
        const typesName = docTypes
          .map((docType: any) => docType.type)
          .filter((item, index, array) => array.indexOf(item) === index)
        const isGroupItem = typesName.find((typeName) => typeName === value)

        if (!isGroupItem) {
          value && setSelectedDocTypes(selectedDocTypes.filter((item) => item.label !== value))
        } else {
          value && setSelectedDocTypes(selectedDocTypes.filter((item) => item.type !== value))
        }
        break
      }
      case 'startDate':
        setStartDate(null)
        break
      case 'endDate':
        setEndDate(null)
        break
    }
  }

  return (
    <>
      <Grid container direction="column" alignItems="center">
        <CssBaseline />
        <Grid container item xs={11} justifyContent="space-between">
          <Grid container item justifyContent="flex-end" className={classes.tableGrid}>
            <Grid container justifyContent="space-between" alignItems="center" style={{ marginBottom: 8 }}>
              <Grid container direction="column" justifyContent="flex-start" style={{ width: 'fit-content' }}>
                {loadingStatus || deidentifiedBoolean === null ? (
                  <>
                    <Skeleton width={200} height={40} />
                    <Skeleton width={150} height={40} />
                  </>
                ) : (
                  <>
                    <Typography variant="button">
                      {displayDigit(documentsNumber ?? 0)} / {displayDigit(allDocumentsNumber ?? 0)} document(s)
                    </Typography>
                    <Typography variant="button">
                      {displayDigit(patientDocumentsNumber ?? 0)} / {displayDigit(allPatientDocumentsNumber ?? 0)}{' '}
                      patient(s)
                    </Typography>
                  </>
                )}
              </Grid>

              <Grid item>
                <Grid container direction="row" alignItems="center" className={classes.filterAndSort}>
                  <div className={classes.documentButtons}>
                    <Button
                      variant="contained"
                      disableElevation
                      onClick={handleOpenDialog}
                      startIcon={<FilterList height="15px" fill="#FFF" />}
                      className={classes.searchButton}
                    >
                      Filtrer
                    </Button>

                    <InputSearchDocumentButton currentMode={inputMode} onChangeMode={setInputMode} />
                  </div>
                </Grid>
              </Grid>
            </Grid>

            {inputMode === 'simple' && (
              <InputSearchDocumentSimple
                defaultSearchInput={searchInput}
                setDefaultSearchInput={(newSearchInput: string) => setSearchInput(newSearchInput)}
                onSearchDocument={(newInputText: string) =>
                  onSearchDocument(order.orderBy, order.orderDirection, newInputText)
                }
              />
            )}

            {inputMode === 'regex' && (
              <InputSearchDocumentRegex
                defaultSearchInput={searchInput}
                setDefaultSearchInput={(newSearchInput: string) => setSearchInput(newSearchInput)}
                onSearchDocument={(newInputText: string) =>
                  onSearchDocument(order.orderBy, order.orderDirection, newInputText)
                }
              />
            )}
            <Grid>
              {nda !== '' &&
                nda
                  .split(',')
                  .map((value) => (
                    <Chip
                      className={classes.chips}
                      key={value}
                      label={value}
                      onDelete={() => handleDeleteChip('nda', value)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
              {ipp !== '' &&
                ipp
                  .split(',')
                  .map((value) => (
                    <Chip
                      className={classes.chips}
                      key={value}
                      label={value}
                      onDelete={() => handleDeleteChip('ipp', value)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
              {displayingSelectedDocType.length > 0 &&
                displayingSelectedDocType.map((docType) => (
                  <Chip
                    className={classes.chips}
                    key={docType.code}
                    label={docType.label}
                    onDelete={() => handleDeleteChip('selectedDocTypes', docType.label)}
                    color="primary"
                    variant="outlined"
                  />
                ))}

              {startDate && (
                <Chip
                  className={classes.chips}
                  label={`Après le : ${moment(startDate).format('DD/MM/YYYY')}`}
                  onDelete={() => handleDeleteChip('startDate')}
                  color="primary"
                  variant="outlined"
                />
              )}

              {endDate && (
                <Chip
                  className={classes.chips}
                  label={`Avant le : ${moment(endDate).format('DD/MM/YYYY')}`}
                  onDelete={() => handleDeleteChip('endDate')}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Grid>

            {deidentifiedBoolean ? (
              <Alert severity="info" style={{ backgroundColor: 'transparent' }}>
                Attention : Les données identifiantes des patients sont remplacées par des informations fictives dans
                les résultats de la recherche et dans les documents prévisualisés.
              </Alert>
            ) : (
              <Alert severity="info" style={{ backgroundColor: 'transparent' }}>
                Attention : La recherche textuelle est pseudonymisée (les données identifiantes des patients sont
                remplacées par des informations fictives). Vous retrouverez les données personnelles de votre patient en
                cliquant sur l'aperçu.
              </Alert>
            )}

            <DataTableComposition
              loading={loadingStatus ?? false}
              deidentified={deidentifiedBoolean ?? true}
              searchMode={searchMode}
              groupId={groupId}
              documentsList={documents ?? []}
              order={order}
              setOrder={setOrder}
              page={page}
              setPage={setPage}
              total={documentsNumber}
            />
          </Grid>
        </Grid>
      </Grid>

      <DocumentFilters
        open={openFilter}
        onClose={handleCloseDialog()}
        onSubmit={handleCloseDialog()}
        nda={nda}
        onChangeNda={setNda}
        ipp={ipp}
        onChangeIpp={setIpp}
        selectedDocTypes={selectedDocTypes}
        onChangeSelectedDocTypes={setSelectedDocTypes}
        startDate={startDate}
        onChangeStartDate={setStartDate}
        endDate={endDate}
        onChangeEndDate={setEndDate}
        deidentified={deidentifiedBoolean}
      />
    </>
  )
}

export default Documents
