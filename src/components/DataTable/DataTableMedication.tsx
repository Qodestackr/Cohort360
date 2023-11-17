import React, { useState } from 'react'

import { CircularProgress, Grid, IconButton, Typography, TableRow, TableCell, Tooltip } from '@mui/material'

import CommentIcon from '@mui/icons-material/Comment'

import DataTable from 'components/DataTable/DataTable'
import ModalAdministrationComment from 'components/Patient/PatientMedication/ModalAdministrationComment/ModalAdministrationComment'

import displayDigit from 'utils/displayDigit'

import { Column, CohortMedication } from 'types'

import useStyles from './styles'
import { MedicationAdministration, MedicationRequest } from 'fhir/r4'
import { MEDICATION_ATC, MEDICATION_ATC_ORBIS, MEDICATION_UCD } from '../../constants'
import { OrderBy } from 'types/searchCriterias'

type DataTableMedicationProps = {
  loading: boolean
  deidentified: boolean
  selectedTab: 'prescription' | 'administration'
  medicationsList: CohortMedication<MedicationRequest | MedicationAdministration>[]
  orderBy?: OrderBy
  setOrderBy?: (order: OrderBy) => void
  page?: number
  setPage?: (page: number) => void
  total?: number
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
  total
}) => {
  const { classes } = useStyles()

  const columns = [
    {
      label: `NDA${deidentified ? ' chiffré' : ''}`,
      code: 'encounter',
      align: 'center',
      sortableColumn: true
    },
    {
      label: selectedTab === 'prescription' ? 'Date de prescription' : "Date d'administration",
      code: 'Period-start',
      align: 'center',
      sortableColumn: true
    },
    { label: 'Code ATC', code: 'medication-atc', align: 'center', sortableColumn: true },
    { label: 'Code UCD', code: 'medication-ucd', align: 'center', sortableColumn: true },
    selectedTab === 'prescription'
      ? { label: 'Type de prescription', code: 'type', align: 'center', sortableColumn: true }
      : null,
    { label: "Voie d'administration", code: 'route', align: 'center', sortableColumn: true },
    selectedTab === 'administration' ? { label: 'Quantité', align: 'center', sortableColumn: false } : null,
    { label: 'Unité exécutrice', align: 'center', sortableColumn: false },
    selectedTab === 'administration' ? { label: 'Commentaire', align: 'center', sortableColumn: false } : null
  ].filter((elem) => elem !== null) as Column[]

  return (
    <DataTable
      columns={columns}
      order={orderBy}
      setOrder={setOrderBy}
      rowsPerPage={20}
      page={page}
      setPage={setPage}
      total={total}
    >
      {!loading && medicationsList && medicationsList.length > 0 ? (
        <>
          {medicationsList.map((medication) => {
            return <DataTableMedicationLine key={medication.id} deidentified={deidentified} medication={medication} />
          })}
        </>
      ) : (
        <TableRow className={classes.emptyTableRow}>
          <TableCell colSpan={8} align="left">
            <Grid container justifyContent="center">
              {loading ? (
                <CircularProgress />
              ) : (
                <Typography variant="button">{`Aucune ${
                  selectedTab === 'prescription' ? 'prescription' : 'administration'
                } à afficher`}</Typography>
              )}
            </Grid>
          </TableCell>
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
    coding && coding.code ? coding.code : 'Non Renseigné',
    coding && coding.display ? coding.display : 'Non Renseigné',
    !!standardCoding,
    coding?.system
  ]
}

const DataTableMedicationLine: React.FC<{
  medication: CohortMedication<MedicationRequest | MedicationAdministration>
  deidentified: boolean
}> = ({ medication, deidentified }) => {
  const { classes } = useStyles()

  const [open, setOpen] = useState<string | null>(null)

  const nda = medication.NDA
  const date =
    medication.resourceType === 'MedicationRequest'
      ? medication.dispenseRequest?.validityPeriod?.start
      : medication.effectivePeriod?.start

  const [codeATC, displayATC, isATCStandard, codeATCSystem] = getCodes(medication, MEDICATION_ATC, MEDICATION_ATC_ORBIS)
  const [codeUCD, displayUCD, isUCDStandard, codeUCDSystem] = getCodes(medication, MEDICATION_UCD, '.*-ucd')

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

  return (
    <TableRow className={classes.tableBodyRows} key={medication.id}>
      <TableCell align="left">{nda ?? 'Inconnu'}</TableCell>
      <TableCell align="center">{date ? new Date(date).toLocaleDateString('fr-FR') : 'Date inconnue'}</TableCell>
      <TableCell align="center">
        <Tooltip title={codeATCSystem}>
          <Typography style={{ fontStyle: isATCStandard ? 'normal' : 'italic' }}>
            {codeATC === 'No matching concept' || codeATC === 'Non Renseigné' ? '' : codeATC ?? ''}
          </Typography>
        </Tooltip>
        <Typography className={classes.libelle}>
          {displayATC === 'No matching concept' ? '-' : displayATC ?? '-'}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Tooltip title={codeUCDSystem}>
          <Typography style={{ fontStyle: isUCDStandard ? 'normal' : 'italic' }}>
            {codeUCD === 'No matching concept' || codeUCD === 'Non Renseigné' ? '' : codeUCD ?? ''}
          </Typography>
        </Tooltip>
        <Typography className={classes.libelle}>
          {displayUCD === 'No matching concept' ? '-' : displayUCD ?? '-'}
        </Typography>
      </TableCell>
      {medication.resourceType === 'MedicationRequest' && (
        <TableCell align="center">{prescriptionType ?? '-'}</TableCell>
      )}
      <TableCell align="center">
        {administrationRoute === 'No matching concept' ? '-' : administrationRoute ?? '-'}
      </TableCell>
      {medication.resourceType === 'MedicationAdministration' && (
        <TableCell align="center">
          {unit !== 'Non Renseigné' ? (
            <>
              {dose} {unit}
            </>
          ) : (
            '-'
          )}
        </TableCell>
      )}
      <TableCell align="center">{serviceProvider ?? '-'}</TableCell>
      {medication.resourceType === 'MedicationAdministration' && deidentified === false && (
        <>
          <TableCell align="center">
            <IconButton onClick={() => setOpen(comment ?? '')}>
              <CommentIcon />
            </IconButton>
          </TableCell>
          <ModalAdministrationComment open={open !== null} comment={open ?? ''} handleClose={() => setOpen(null)} />
        </>
      )}
    </TableRow>
  )
}

export default DataTableMedication
