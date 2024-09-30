import React, { useContext, useState } from 'react'

import { CircularProgress, Grid, IconButton, Typography, TableRow, Tooltip } from '@mui/material'
import { TableCellWrapper } from 'components/ui/TableCell/styles'

import CommentIcon from '@mui/icons-material/Comment'

import DataTable from 'components/DataTable/DataTable'
import ModalAdministrationComment from 'components/Patient/PatientMedication/ModalAdministrationComment/ModalAdministrationComment'
import SearchIcon from 'assets/icones/search.svg?react'

import displayDigit from 'utils/displayDigit'

import { Column, CohortMedication } from 'types'

import useStyles from './styles'
import { MedicationAdministration, MedicationRequest } from 'fhir/r4'
import { Order, OrderBy } from 'types/searchCriterias'
import { ResourceType } from 'types/requestCriterias'
import { AppConfig } from 'config'

type DataTableMedicationProps = {
  loading: boolean
  deidentified: boolean
  selectedTab: ResourceType.MEDICATION_ADMINISTRATION | ResourceType.MEDICATION_REQUEST
  medicationsList: CohortMedication<MedicationRequest | MedicationAdministration>[]
  orderBy?: OrderBy
  setOrderBy?: (order: OrderBy) => void
  page?: number
  setPage?: (page: number) => void
  total?: number
  showIpp?: boolean
  groupId?: string
}
const DataTableMedication: React.FC<DataTableMedicationProps> = ({
  loading,
  deidentified,
  selectedTab,
  medicationsList,
  orderBy,
  setOrderBy,
  page,
  setPage,
  total,
  showIpp,
  groupId
}) => {
  const { classes } = useStyles()

  const columns = [
    ...(showIpp ? [{ label: `IPP${deidentified ? ' chiffré' : ''}`, align: 'left' }] : []),
    { label: `NDA${deidentified ? ' chiffré' : ''}`, align: showIpp ? 'center' : 'left', code: Order.ENCOUNTER },
    {
      label: selectedTab === ResourceType.MEDICATION_REQUEST ? 'Date de prescription' : "Date d'administration",
      code: Order.PERIOD_START
    },
    { label: 'Code ATC', code: Order.MEDICATION_ATC },
    { label: 'Code UCD', code: Order.MEDICATION_UCD },
    selectedTab === ResourceType.MEDICATION_REQUEST
      ? { label: 'Type de prescription', code: Order.PRESCRIPTION_TYPES }
      : null,
    { label: "Voie d'administration", code: Order.ADMINISTRATION_MODE },
    selectedTab === ResourceType.MEDICATION_ADMINISTRATION ? { label: 'Quantité' } : null,
    { label: 'Unité exécutrice' },
    selectedTab === ResourceType.MEDICATION_ADMINISTRATION && !deidentified ? { label: 'Commentaire' } : null
  ].filter((elem) => elem !== null) as Column[]

  return (
    <DataTable columns={columns} order={orderBy} setOrder={setOrderBy} page={page} setPage={setPage} total={total}>
      {!loading && medicationsList && medicationsList.length > 0 ? (
        <>
          {medicationsList.map((medication) => {
            return (
              <DataTableMedicationLine
                key={medication.id}
                deidentified={deidentified}
                medication={medication}
                showIpp={showIpp}
                groupId={groupId}
              />
            )
          })}
        </>
      ) : (
        <TableRow className={classes.emptyTableRow}>
          <TableCellWrapper colSpan={columns.length} align="left">
            <Grid container justifyContent="center">
              {loading ? (
                <CircularProgress />
              ) : (
                <Typography variant="button">{`Aucune ${
                  selectedTab === ResourceType.MEDICATION_REQUEST ? 'prescription' : 'administration'
                } à afficher`}</Typography>
              )}
            </Grid>
          </TableCellWrapper>
        </TableRow>
      )}
    </DataTable>
  )
}

const getCodes = (
  medication: CohortMedication<MedicationRequest | MedicationAdministration>,
  codeSystem: string,
  altCodeSystemRegex?: string
): [string, string, boolean, string | undefined] => {
  const standardCoding = medication.medicationCodeableConcept?.coding?.find(
    (code) => code.userSelected && code.system === codeSystem
  )
  const coding =
    standardCoding ||
    medication.medicationCodeableConcept?.coding?.find(
      (code) => altCodeSystemRegex && code.system?.match(altCodeSystemRegex)
    )

  return [
    coding?.code ? coding.code : 'Non Renseigné',
    coding?.display ? coding.display : 'Non Renseigné',
    !!standardCoding,
    coding?.system
  ]
}

const DataTableMedicationLine: React.FC<{
  medication: CohortMedication<MedicationRequest | MedicationAdministration>
  deidentified: boolean
  showIpp?: boolean
  groupId?: string
}> = ({ medication, deidentified, showIpp, groupId }) => {
  const { classes } = useStyles()
  const appConfig = useContext(AppConfig)

  const [open, setOpen] = useState<string | null>(null)

  const ipp = medication.IPP
  const nda = medication.NDA
  const date =
    medication.resourceType === 'MedicationRequest'
      ? medication.dispenseRequest?.validityPeriod?.start
      : medication.effectivePeriod?.start

  const [codeATC, displayATC, isATCStandard, codeATCSystem] = getCodes(
    medication,
    appConfig.features.medication.valueSets.medicationAtc.url,
    appConfig.features.medication.valueSets.medicationAtcOrbis.url
  )
  const [codeUCD, displayUCD, isUCDStandard, codeUCDSystem] = getCodes(
    medication,
    appConfig.features.medication.valueSets.medicationUcd.url,
    '.*-ucd'
  )

  const prescriptionType =
    medication.resourceType === 'MedicationRequest' && medication.category?.[0].coding?.[0].display
  const administrationRoute =
    medication.resourceType === 'MedicationRequest'
      ? medication.dosageInstruction?.[0]?.route?.coding?.[0]?.display
      : medication.dosage?.route?.coding?.[0]?.display
  const dose = medication.resourceType === 'MedicationAdministration' && displayDigit(medication?.dosage?.dose?.value)
  const unit = medication.resourceType === 'MedicationAdministration' && medication.dosage?.dose?.unit
  const serviceProvider = medication.serviceProvider

  const comment = medication.resourceType === 'MedicationAdministration' ? medication.dosage?.text : null

  const groupIdSearch = groupId ? `?groupId=${groupId}` : ''

  return (
    <TableRow className={classes.tableBodyRows} key={medication.id}>
      {showIpp && (
        <TableCellWrapper style={{ minWidth: 150 }}>
          {ipp}
          <IconButton
            onClick={() => window.open(`/patients/${medication.idPatient}${groupIdSearch}`, '_blank')}
            className={classes.searchIcon}
          >
            <SearchIcon height="15px" fill="#ED6D91" className={classes.iconMargin} />
          </IconButton>
        </TableCellWrapper>
      )}
      <TableCellWrapper align="left">{nda ?? 'Inconnu'}</TableCellWrapper>
      <TableCellWrapper>{date ? new Date(date).toLocaleDateString('fr-FR') : 'Date inconnue'}</TableCellWrapper>
      <TableCellWrapper>
        <Tooltip title={codeATCSystem}>
          <Typography style={{ fontStyle: isATCStandard ? 'normal' : 'italic' }}>
            {codeATC === 'No matching concept' || codeATC === 'Non Renseigné' ? '' : codeATC ?? ''}
          </Typography>
        </Tooltip>
        <Typography className={classes.libelle}>
          {displayATC === 'No matching concept' ? '-' : displayATC ?? '-'}
        </Typography>
      </TableCellWrapper>
      <TableCellWrapper>
        <Tooltip title={codeUCDSystem}>
          <Typography style={{ fontStyle: isUCDStandard ? 'normal' : 'italic' }}>
            {codeUCD === 'No matching concept' || codeUCD === 'Non Renseigné' ? '' : codeUCD ?? ''}
          </Typography>
        </Tooltip>
        <Typography className={classes.libelle}>
          {displayUCD === 'No matching concept' ? '-' : displayUCD ?? '-'}
        </Typography>
      </TableCellWrapper>
      {medication.resourceType === 'MedicationRequest' && (
        <TableCellWrapper>{prescriptionType ?? '-'}</TableCellWrapper>
      )}
      <TableCellWrapper>
        {administrationRoute === 'No matching concept' ? '-' : administrationRoute ?? '-'}
      </TableCellWrapper>
      {medication.resourceType === 'MedicationAdministration' && (
        <TableCellWrapper>
          {unit !== 'Non Renseigné' ? (
            <>
              {dose} {unit}
            </>
          ) : (
            '-'
          )}
        </TableCellWrapper>
      )}
      <TableCellWrapper>{serviceProvider ?? '-'}</TableCellWrapper>
      {medication.resourceType === 'MedicationAdministration' && deidentified === false && (
        <>
          <TableCellWrapper>
            <IconButton onClick={() => setOpen(comment ?? '')}>
              <CommentIcon />
            </IconButton>
          </TableCellWrapper>
          <ModalAdministrationComment open={open !== null} comment={open ?? ''} handleClose={() => setOpen(null)} />
        </>
      )}
    </TableRow>
  )
}

export default DataTableMedication
