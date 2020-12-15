import React, { useState } from 'react'
import moment from 'moment'

import { Button, Card, CardHeader, CardContent, IconButton, Typography } from '@material-ui/core'

import AddIcon from '@material-ui/icons/Add'
import DeleteIcon from '@material-ui/icons/Delete'
import EditIcon from '@material-ui/icons/Edit'

import CriteriaRightPanel from './components/CriteriaRightPanel'

import { CriteriaItemType, SelectedCriteriaType } from 'types'
import useStyles from './styles'

type CriteriaCardProps = {
  criteria: CriteriaItemType[]
  selectedCriteria: SelectedCriteriaType[]
  onChangeSelectedCriteria: (item: SelectedCriteriaType[]) => void
}

const CriteriaCard: React.FC<CriteriaCardProps> = (props) => {
  const { criteria, selectedCriteria, onChangeSelectedCriteria } = props

  const classes = useStyles()
  const [indexCriteria, onChangeIndexCriteria] = useState<number | null>(null)
  const [openCriteriaDrawer, onChangeOpenCriteriaDrawer] = useState<boolean>(false)

  const _addSelectedCriteria = () => {
    onChangeIndexCriteria(null)
    onChangeOpenCriteriaDrawer(true)
  }

  const _editSelectedCriteria = (index: number) => {
    onChangeIndexCriteria(index)
    onChangeOpenCriteriaDrawer(true)
  }

  const _deleteSelectedCriteria = (index: number) => {
    const savedSelectedCriteria = [...selectedCriteria]
    savedSelectedCriteria.splice(index, 1)
    onChangeSelectedCriteria(savedSelectedCriteria)
  }

  const _onChangeSelectedCriteria = (newSelectedCriteria: SelectedCriteriaType) => {
    let savedSelectedCriteria = [...selectedCriteria]
    if (indexCriteria !== null) {
      savedSelectedCriteria[indexCriteria] = newSelectedCriteria
    } else {
      savedSelectedCriteria = [...savedSelectedCriteria, newSelectedCriteria]
    }
    onChangeSelectedCriteria(savedSelectedCriteria)
  }

  const _displayCardContent = (_selectedCriteria: SelectedCriteriaType) => {
    if (!_selectedCriteria) return <></>
    let content = <></>
    const startDate = _selectedCriteria.startOccurrence
      ? moment(_selectedCriteria.startOccurrence, 'YYYY-MM-DD').format('ddd DD MMMM YYYY')
      : ''
    const endDate = _selectedCriteria.endOccurrence
      ? moment(_selectedCriteria.endOccurrence, 'YYYY-MM-DD').format('ddd DD MMMM YYYY')
      : ''

    switch (_selectedCriteria.type) {
      case 'Claim': {
        content = (
          <>
            <Typography>
              Dans <span className={classes.criteriaType}>GHM</span>,
            </Typography>
            <Typography>
              {startDate
                ? endDate
                  ? `Entre le ${startDate} et le ${endDate},`
                  : `Après le ${startDate},`
                : endDate
                ? `Avant le ${endDate},`
                : ''}
            </Typography>
            <Typography>
              GHM sélectionné :{_selectedCriteria.code ? `"${_selectedCriteria.code.label}"` : '""'}
            </Typography>
          </>
        )
        break
      }

      case 'Procedure':
        content = (
          <>
            <Typography>
              Dans <span className={classes.criteriaType}>Actes CCAM</span>,
            </Typography>
            <Typography>
              {startDate
                ? endDate
                  ? `Entre le ${startDate} et le ${endDate},`
                  : `Après le ${startDate},`
                : endDate
                ? `Avant le ${endDate},`
                : ''}
            </Typography>
            <Typography align="center">
              Acte CCAM sélectionné : {_selectedCriteria.code ? `"${_selectedCriteria.code.label}"` : '""'}.
            </Typography>
          </>
        )
        break

      case 'Condition':
        content = (
          <>
            <Typography>
              Dans <span className={classes.criteriaType}>Diagnostics CIM10</span>,
            </Typography>
            <Typography align="center">
              Diagnostic CIM sélectionné : {_selectedCriteria.code ? `"${_selectedCriteria.code.label}"` : '""'}.
            </Typography>
            {_selectedCriteria.diagnosticType && (
              <Typography align="center">
                Type de diagnostic recherché : {_selectedCriteria.diagnosticType.label}.
              </Typography>
            )}
          </>
        )
        break

      case 'Patient': {
        content = (
          <>
            <Typography>
              Dans <span className={classes.criteriaType}>Démographie Patient</span>,
            </Typography>
            {_selectedCriteria.gender && <Typography>Genre sélectionné : {_selectedCriteria.gender.label}.</Typography>}
            {_selectedCriteria.vitalStatus && (
              <Typography>Statut vital : {_selectedCriteria.vitalStatus.label}.</Typography>
            )}
            {_selectedCriteria.years && _selectedCriteria.years[0] === _selectedCriteria.years[1] && (
              <Typography>
                Âge sélectionné: {_selectedCriteria.years?.[0]} ans
                {_selectedCriteria.years?.[0] === 100 ? ' ou plus.' : '.'}
              </Typography>
            )}
            {_selectedCriteria.years &&
              _selectedCriteria.years[0] !== _selectedCriteria.years[1] &&
              (_selectedCriteria.years[0] !== 0 || _selectedCriteria.years[1] !== 100) && (
                <Typography>
                  Fourchette d'âge comprise entre {_selectedCriteria.years[0]} et {_selectedCriteria.years[1]} ans
                  {_selectedCriteria.years[1] === 100 ? ' ou plus.' : '.'}
                </Typography>
              )}
          </>
        )
        break
      }

      case 'Composition': {
        const docTypes = {
          '55188-7': 'Tout type de documents',
          '11336-5': "Comptes rendus d'hospitalisation",
          '57833-6': 'Ordonnances'
        }
        content = (
          <>
            <Typography>
              Dans <span className={classes.criteriaType}>Document médical</span>,
            </Typography>
            <Typography>
              Recherche textuelle "{_selectedCriteria.search}" {docTypes[_selectedCriteria.docType ?? '55188-7']}.
            </Typography>
          </>
        )
        break
      }

      case 'Encounter': {
        const ageType: any = _selectedCriteria.ageType ? _selectedCriteria.ageType.id : 'year'
        let ageUnit = 'an(s)'
        if (ageType === 'month') ageUnit = 'mois'
        else if (ageType === 'day') ageUnit = 'jour(s)'

        content = (
          <>
            <Typography>
              Dans <span className={classes.criteriaType}>Prise en charge</span>,
            </Typography>
            {_selectedCriteria.years && _selectedCriteria.years[0] === _selectedCriteria.years[1] && (
              <Typography>
                Âge au moment de la prise en charge : {_selectedCriteria.years?.[0]} {ageUnit}
                {_selectedCriteria.years?.[0] === 100 ? ' ou plus.' : '.'}
              </Typography>
            )}
            {_selectedCriteria.years &&
              _selectedCriteria.years[0] !== _selectedCriteria.years[1] &&
              (_selectedCriteria.years[0] !== 0 || _selectedCriteria.years[1] !== 100) && (
                <Typography>
                  Âge au moment de la prise en charge : entre {_selectedCriteria.years[0]} et{' '}
                  {_selectedCriteria.years[1]} {ageUnit}
                  {_selectedCriteria.years[1] === 100 ? ' ou plus.' : '.'}
                </Typography>
              )}
            {_selectedCriteria.duration && _selectedCriteria.duration[0] === _selectedCriteria.duration[1] && (
              <Typography>
                Durée de la prise en charge : {_selectedCriteria.duration?.[0]} jour(s)
                {_selectedCriteria.duration?.[0] === 100 ? ' ou plus.' : '.'}
              </Typography>
            )}
            {_selectedCriteria.duration &&
              _selectedCriteria.duration[0] !== _selectedCriteria.duration[1] &&
              (_selectedCriteria.duration[0] !== 0 || _selectedCriteria.duration[1] !== 100) && (
                <Typography>
                  Durée de la prise en charge : {_selectedCriteria.duration[0]} et {_selectedCriteria.duration[1]}{' '}
                  jour(s)
                  {_selectedCriteria.duration[1] === 100 ? ' ou plus.' : '.'}
                </Typography>
              )}
            {_selectedCriteria.admissionMode && (
              <Typography>Mode d'admission : {_selectedCriteria.admissionMode.label}.</Typography>
            )}
            {_selectedCriteria.entryMode && (
              <Typography align="center">Mode d'entrée : {_selectedCriteria.entryMode.label}.</Typography>
            )}
            {_selectedCriteria.exitMode && (
              <Typography align="center">Mode de sortie : {_selectedCriteria.exitMode.label}.</Typography>
            )}
            {_selectedCriteria.fileStatus && (
              <Typography>Statut dossier : {_selectedCriteria.fileStatus.label}.</Typography>
            )}
          </>
        )
        break
      }
      default:
        break
    }
    return content
  }

  return (
    <>
      {selectedCriteria &&
        selectedCriteria.length > 0 &&
        selectedCriteria.map((_selectedCriteria, index) => (
          <div className={classes.root} key={`C${index}`}>
            <Card className={classes.card}>
              <CardHeader
                className={classes.cardHeader}
                action={
                  <>
                    <IconButton
                      size="small"
                      onClick={() => _deleteSelectedCriteria(index)}
                      style={{ color: 'currentcolor' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => _editSelectedCriteria(index)}
                      style={{ color: 'currentcolor' }}
                    >
                      <EditIcon />
                    </IconButton>
                  </>
                }
                title={`C${index + 1} - ${_selectedCriteria.title}`}
              />
              <CardContent className={classes.cardContent}>{_displayCardContent(_selectedCriteria)}</CardContent>
            </Card>
          </div>
        ))}

      <div className={classes.root}>
        <Button className={classes.addButton} onClick={_addSelectedCriteria} variant="contained" color="primary">
          <AddIcon />
        </Button>
      </div>

      <CriteriaRightPanel
        criteria={criteria}
        selectedCriteria={indexCriteria !== null ? selectedCriteria[indexCriteria] : null}
        onChangeSelectedCriteria={_onChangeSelectedCriteria}
        open={openCriteriaDrawer}
        onClose={() => onChangeOpenCriteriaDrawer(false)}
      />
    </>
  )
}

export default CriteriaCard
