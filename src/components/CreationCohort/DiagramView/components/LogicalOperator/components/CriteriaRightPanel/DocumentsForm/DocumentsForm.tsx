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

import AdvancedInputs from '../AdvancedInputs/AdvancedInputs'

import useStyles from './styles'

import { CriteriaDrawerComponentProps, CriteriaName } from 'types'
import services from 'services/aphp'
import { useDebounce } from 'utils/debounce'
import OccurrencesNumberInputs from '../AdvancedInputs/OccurrencesInputs/OccurrenceNumberInputs'
import { SearchByTypes } from 'types/searchCriterias'
import { IndeterminateCheckBoxOutlined } from '@mui/icons-material'
import { SearchInputError } from 'types/error'
import { Comparators, DocType, DocumentDataType, RessourceType } from 'types/requestCriterias'
import Searchbar from 'components/ui/Searchbar'
import SearchInput from 'components/ui/Searchbar/SearchInput'

const defaultComposition: DocumentDataType = {
  type: RessourceType.DOCUMENTS,
  title: 'Critère de document',
  search: '',
  searchBy: SearchByTypes.TEXT,
  docType: [],
  occurrence: 1,
  occurrenceComparator: Comparators.GREATER_OR_EQUAL,
  encounterEndDate: '',
  encounterStartDate: '',
  startOccurrence: '',
  endOccurrence: '',
  isInclusive: true
}

const CompositionForm: React.FC<CriteriaDrawerComponentProps> = (props) => {
  const { criteria, selectedCriteria, onChangeSelectedCriteria, goBack } = props

  const { classes } = useStyles()
  const [defaultValues, setDefaultValues] = useState(selectedCriteria || defaultComposition)
  const [multiFields, setMultiFields] = useState<string | null>(localStorage.getItem('multiple_fields'))
  const [searchCheckingLoading, setSearchCheckingLoading] = useState(false)
  const [searchInputError, setSearchInputError] = useState<SearchInputError | undefined>(undefined)
  const debouncedSearchItem = useDebounce(500, defaultValues.search)

  const isEdition = selectedCriteria !== null ? true : false

  const _onSubmit = () => {
    onChangeSelectedCriteria(defaultValues)
  }

  const _onChangeValue = (key: string, value: any) => {
    const _defaultValues = defaultValues ? { ...defaultValues } : {}
    _defaultValues[key] = value
    setDefaultValues(_defaultValues)
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

          <OccurrencesNumberInputs
            form={CriteriaName.Document}
            selectedCriteria={defaultValues}
            onChangeValue={_onChangeValue}
          />

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
            options={criteria?.data?.docTypes || []}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => _.isEqual(option, value)}
            value={defaultValues.docType}
            onChange={(e, value) => _onChangeValue('docType', value)}
            renderInput={(params) => <TextField {...params} label="Types de documents" />}
            groupBy={(doctype) => doctype.type}
            disableCloseOnSelect
            renderGroup={(docType: any) => {
              const currentDocTypeList = criteria?.data?.docTypes
                ? criteria?.data?.docTypes.filter((doc: DocType) => doc.type === docType.group)
                : []

              const currentSelectedDocTypeList = defaultValues.docType
                ? defaultValues.docType.filter((doc: DocType) => doc.type === docType.group)
                : []

              const onClick = () => {
                if (currentDocTypeList.length === currentSelectedDocTypeList.length) {
                  _onChangeValue(
                    'docType',
                    defaultValues.docType.filter((doc: DocType) => doc.type !== docType.group)
                  )
                } else {
                  _onChangeValue('docType', _.uniqWith([...defaultValues.docType, ...currentDocTypeList], _.isEqual))
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

          <AdvancedInputs
            form={CriteriaName.Document}
            selectedCriteria={defaultValues}
            onChangeValue={_onChangeValue}
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
            disabled={searchInputError?.isError || searchCheckingLoading}
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

export default CompositionForm
