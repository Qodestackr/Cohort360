import React, { useEffect, useState } from 'react'
import _ from 'lodash'

import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography
} from '@mui/material'

import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace'

import AdvancedInputs from '../AdvancedInputs'

import useStyles from './styles'

import { CriteriaDrawerComponentProps, SimpleCodeType } from 'types'
import services from 'services/aphp'
import { useDebounce } from 'utils/debounce'
import { SearchByTypes, FilterByDocumentStatus } from 'types/searchCriterias'
import { IndeterminateCheckBoxOutlined } from '@mui/icons-material'
import { SearchInputError } from 'types/error'
import { Comparators, DocumentDataType, CriteriaType, CriteriaDataKey } from 'types/requestCriterias'
import Searchbar from 'components/ui/Searchbar'
import SearchInput from 'components/ui/Searchbar/SearchInput'
import { BlockWrapper } from 'components/ui/Layout'
import OccurenceInput from 'components/ui/Inputs/Occurences'
import { SourceType } from 'types/scope'
import { mappingCriteria } from 'utils/mappers'

const defaultComposition: Omit<DocumentDataType, 'id'> = {
  type: CriteriaType.DOCUMENTS,
  title: 'Critère de document',
  search: '',
  searchBy: SearchByTypes.TEXT,
  docType: [],
  occurrence: 1,
  occurrenceComparator: Comparators.GREATER_OR_EQUAL,
  encounterStartDate: [null, null],
  encounterEndDate: [null, null],
  includeEncounterStartDateNull: false,
  includeEncounterEndDateNull: false,
  startOccurrence: [null, null],
  isInclusive: true,
  docStatuses: [],
  encounterStatus: []
}

enum Error {
  ADVANCED_INPUTS_ERROR,
  NO_ERROR
}

const DocumentsForm: React.FC<CriteriaDrawerComponentProps> = (props) => {
  const { criteriaData, selectedCriteria, onChangeSelectedCriteria, goBack } = props

  const { classes } = useStyles()
  const [defaultValues, setDefaultValues] = useState<DocumentDataType>(
    (selectedCriteria as DocumentDataType) || defaultComposition
  )
  const [multiFields, setMultiFields] = useState<string | null>(localStorage.getItem('multiple_fields'))
  const [searchCheckingLoading, setSearchCheckingLoading] = useState(false)
  const [searchInputError, setSearchInputError] = useState<SearchInputError | undefined>(undefined)
  const [occurrence, setOccurrence] = useState(defaultValues.occurrence ?? 1)
  const [occurrenceComparator, setOccurrenceComparator] = useState(
    defaultValues.occurrenceComparator ?? Comparators.GREATER_OR_EQUAL
  )
  const debouncedSearchItem = useDebounce(500, defaultValues.search)

  const isEdition = selectedCriteria !== null

  const docStatuses: string[] = [FilterByDocumentStatus.VALIDATED, FilterByDocumentStatus.NOT_VALIDATED]

  const [error, setError] = useState(Error.NO_ERROR)

  const _onSubmit = () => {
    onChangeSelectedCriteria({ ...defaultValues, occurrence: occurrence, occurrenceComparator: occurrenceComparator })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _onChangeValue = (key: string, value: any) => {
    setDefaultValues((prevValues) => {
      const _defaultValues = { ...prevValues, [key]: value }
      return _defaultValues
    })
  }

  useEffect(() => {
    const checkDocumentSearch = async () => {
      try {
        setSearchCheckingLoading(true)
        setSearchInputError({ ...searchInputError, isError: true })
        const checkDocumentSearch = await services.cohorts.checkDocumentSearchInput(defaultValues.search)

        setSearchInputError(checkDocumentSearch)
        setSearchCheckingLoading(false)
      } catch (error) {
        console.error('Erreur lors de la vérification du champ de recherche', error)
        setSearchCheckingLoading(false)
      }
    }

    checkDocumentSearch()
  }, [debouncedSearchItem])

  return (
    <Grid className={classes.root}>
      <Grid className={classes.actionContainer}>
        {!isEdition ? (
          <>
            <IconButton className={classes.backButton} onClick={goBack}>
              <KeyboardBackspaceIcon />
            </IconButton>
            <Divider className={classes.divider} orientation="vertical" flexItem />
            <Typography className={classes.titleLabel}>Ajouter un critère de documents médicaux</Typography>
          </>
        ) : (
          <Typography className={classes.titleLabel}>Modifier un critère de documents médicaux</Typography>
        )}
      </Grid>

      <Grid className={classes.formContainer}>
        {!multiFields && (
          <Alert
            severity="info"
            onClose={() => {
              localStorage.setItem('multiple_fields', 'ok')
              setMultiFields('ok')
            }}
          >
            Tous les éléments des champs multiples sont liés par une contrainte OU
          </Alert>
        )}

        <Grid className={classes.inputContainer} container>
          <Typography variant="h6">Documents médicaux</Typography>

          <TextField
            required
            className={classes.inputItem}
            id="criteria-name-required"
            placeholder="Nom du critère"
            value={defaultValues.title}
            onChange={(e) => _onChangeValue('title', e.target.value)}
          />

          <Grid style={{ display: 'flex' }}>
            <FormLabel
              onClick={() => _onChangeValue('isInclusive', !defaultValues.isInclusive)}
              style={{ margin: 'auto 1em' }}
              component="legend"
            >
              Exclure les patients qui suivent les règles suivantes
            </FormLabel>
            <Switch
              id="criteria-inclusive"
              checked={!defaultValues.isInclusive}
              onChange={(event) => _onChangeValue('isInclusive', !event.target.checked)}
              color="secondary"
            />
          </Grid>

          <BlockWrapper className={classes.inputItem}>
            <OccurenceInput
              value={occurrence}
              comparator={occurrenceComparator}
              onchange={(newOccurence, newComparator) => {
                setOccurrence(newOccurence)
                setOccurrenceComparator(newComparator)
              }}
            />
          </BlockWrapper>

          <FormControl variant="outlined" className={classes.inputItem}>
            <InputLabel>Rechercher dans :</InputLabel>
            <Select
              value={defaultValues.searchBy}
              onChange={(event) => _onChangeValue('searchBy', event.target.value)}
              variant="outlined"
              label="Rechercher dans :"
            >
              <MenuItem value={SearchByTypes.TEXT}>Corps du document</MenuItem>
              <MenuItem value={SearchByTypes.DESCRIPTION}>Titre du document</MenuItem>
            </Select>
          </FormControl>

          <Grid className={classes.inputItem}>
            <Searchbar>
              <Grid item xs={12} className={classes.searchInput}>
                <SearchInput
                  value={defaultValues.search}
                  displayHelpIcon
                  placeholder="Rechercher dans les documents"
                  error={searchInputError?.isError ? searchInputError : undefined}
                  onchange={(newValue) => _onChangeValue('search', newValue)}
                />
              </Grid>
            </Searchbar>
            {searchCheckingLoading && (
              <Grid container item alignItems="center" direction="column" justifyContent="center">
                <CircularProgress />
                <Typography>Vérification du champ de recherche en cours...</Typography>
              </Grid>
            )}
          </Grid>

          <Autocomplete
            multiple
            id="criteria-doc-type-autocomplete"
            className={classes.inputItem}
            options={criteriaData.data.docTypes || []}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => _.isEqual(option, value)}
            value={defaultValues.docType || undefined}
            onChange={(e, value) => _onChangeValue('docType', value)}
            renderInput={(params) => <TextField {...params} label="Types de documents" />}
            groupBy={(doctype) => doctype.type}
            disableCloseOnSelect
            renderGroup={(docType) => {
              const currentDocTypeList = criteriaData.data.docTypes
                ? criteriaData.data.docTypes.filter((doc: SimpleCodeType) => doc.type === docType.group)
                : []

              const currentSelectedDocTypeList = defaultValues.docType
                ? defaultValues.docType.filter((doc) => doc.type === docType.group)
                : []

              const onClick = () => {
                if (currentDocTypeList.length === currentSelectedDocTypeList.length) {
                  _onChangeValue(
                    'docType',
                    defaultValues.docType?.filter((doc) => doc.type !== docType.group)
                  )
                } else {
                  _onChangeValue(
                    'docType',
                    _.uniqWith([...(defaultValues.docType || []), ...currentDocTypeList], _.isEqual)
                  )
                }
              }

              return (
                <React.Fragment>
                  <Grid container direction="row" alignItems="center">
                    <Checkbox
                      indeterminate={
                        currentDocTypeList.length !== currentSelectedDocTypeList.length &&
                        currentSelectedDocTypeList.length > 0
                      }
                      checked={currentDocTypeList.length === currentSelectedDocTypeList.length}
                      onClick={onClick}
                      indeterminateIcon={<IndeterminateCheckBoxOutlined />}
                    />
                    <Typography onClick={onClick} noWrap style={{ cursor: 'pointer', width: 'calc(100% - 150px' }}>
                      {docType.group}
                    </Typography>
                  </Grid>
                  {docType.children}
                </React.Fragment>
              )
            }}
          />

          <FormControl variant="outlined" className={classes.inputItem}>
            <Autocomplete
              disableCloseOnSelect
              multiple
              onChange={(e, value) => _onChangeValue('docStatuses', value)}
              options={docStatuses}
              value={defaultValues.docStatuses || undefined}
              renderInput={(params) => <TextField {...params} placeholder="Statut de documents" />}
            />
          </FormControl>

          <FormControl variant="outlined" className={classes.inputItem}>
            <Autocomplete
              multiple
              options={criteriaData.data.encounterStatus || []}
              noOptionsText="Veuillez entrer un statut de visite associée"
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={mappingCriteria(defaultValues?.encounterStatus, CriteriaDataKey.ENCOUNTER_STATUS, criteriaData)}
              onChange={(e, value) => _onChangeValue('encounterStatus', value)}
              renderInput={(params) => <TextField {...params} label="Statut de la visite associée" />}
            />
          </FormControl>

          <AdvancedInputs
            sourceType={SourceType.DOCUMENT}
            selectedCriteria={defaultValues}
            onChangeValue={_onChangeValue}
            onError={(isError) => setError(isError ? Error.ADVANCED_INPUTS_ERROR : Error.NO_ERROR)}
          />
        </Grid>

        <Grid className={classes.criteriaActionContainer}>
          {!isEdition && (
            <Button onClick={goBack} variant="outlined">
              Annuler
            </Button>
          )}
          <Button
            onClick={_onSubmit}
            disabled={searchInputError?.isError || searchCheckingLoading || error === Error.ADVANCED_INPUTS_ERROR}
            type="submit"
            form="documents-form"
            variant="contained"
          >
            Confirmer
          </Button>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default DocumentsForm
