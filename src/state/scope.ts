import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { RootState } from 'state'

import { logout, login } from './me'

import services from 'services/aphp'

import { ScopeTreeRow } from 'types'

export type ScopeState = {
  loading: boolean
  scopesList: ScopeTreeRow[]
  openPopulation: number[]
  aborted?: boolean
}

const defaultInitialState: ScopeState = {
  loading: false,
  scopesList: [],
  openPopulation: [],
  aborted: false
}

type FetchScopeListReturn = {
  scopesList: ScopeTreeRow[]
  aborted?: boolean
}

const fetchScopesList = createAsyncThunk<FetchScopeListReturn, AbortSignal | undefined, { state: RootState }>(
  'scope/fetchScopesList',
  async (signal: AbortSignal | undefined, { getState, dispatch }) => {
    try {
      const state = getState()
      const { me, scope } = state
      const { scopesList } = scope

      if (scopesList.length) {
        dispatch(fetchScopesListinBackground(signal))
        return { scopesList: scopesList, aborted: signal?.aborted }
      } else {
        if (!me) return { scopesList: [], aborted: signal?.aborted }
        const scopes = (await services.perimeters.getScopePerimeters(me.id, signal)) || []
        if (signal?.aborted) {
          return { scopesList: scopesList, aborted: signal?.aborted }
        } else {
          return { scopesList: scopes, aborted: signal?.aborted }
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
)

const fetchScopesListinBackground = createAsyncThunk<
  FetchScopeListReturn,
  AbortSignal | undefined,
  { state: RootState }
>('scope/fetchScopesListinBackground', async (signal: AbortSignal | undefined, { getState }) => {
  try {
    const state = getState()
    const { me, scope } = state
    const { scopesList } = scope

    if (!me) return { scopesList: [], aborted: signal?.aborted }
    const scopes = (await services.perimeters.getScopePerimeters(me.id, signal)) || []
    return {
      scopesList: scopes.map((scope) => ({
        ...scope,
        subItems: (
          scopesList.find((item) => item.id === scope.id && item.subItems?.length) ?? {
            subItems: [
              {
                id: 'loading',
                name: 'loading',
                quantity: 0,
                subItems: []
              }
            ]
          }
        ).subItems
      })),
      aborted: signal?.aborted
    }
  } catch (error) {
    console.error(error)
    throw error
  }
})

type ExpandScopeElementParams = {
  rowId: number
  scopesList?: ScopeTreeRow[]
  selectedItems?: ScopeTreeRow[]
  openPopulation?: number[]
  signal?: AbortSignal
}
type ExpandScopeElementReturn = {
  scopesList: ScopeTreeRow[]
  selectedItems: ScopeTreeRow[]
  openPopulation: number[]
  aborted?: boolean
}

const expandScopeElement = createAsyncThunk<ExpandScopeElementReturn, ExpandScopeElementParams, { state: RootState }>(
  'scope/expandScopeElement',
  async (params, { getState }) => {
    let scopesList
    let openPopulation
    if (params.scopesList && params.openPopulation) {
      scopesList = params.scopesList
      openPopulation = params.openPopulation
    } else {
      const state = getState().scope
      scopesList = state.scopesList
      openPopulation = state.openPopulation
    }
    let _rootRows = scopesList ? [...scopesList] : []
    let savedSelectedItems = params.selectedItems ? [...params.selectedItems] : []
    let _openPopulation = openPopulation ? [...openPopulation] : []

    const index = _openPopulation.indexOf(params.rowId)
    if (index !== -1) {
      _openPopulation = _openPopulation.filter((id) => id !== params.rowId)
    } else {
      _openPopulation = [..._openPopulation, params.rowId]

      const replaceSubItems = async (items: ScopeTreeRow[]) => {
        let _items: ScopeTreeRow[] = []
        for (let item of items) {
          // Replace sub items element by response of back-end
          if (+item.id === +params.rowId) {
            const foundItem = item.subItems ? item.subItems.find((i: any) => i.id === 'loading') : true
            if (foundItem) {
              const subItems: ScopeTreeRow[] = await services.perimeters.getScopeSubItems(
                item.inferior_levels_ids,
                true,
                params.signal
              )
              item = { ...item, subItems: subItems }
            }
          } else if (item.subItems && item.subItems.length !== 0) {
            item = { ...item, subItems: await replaceSubItems(item.subItems) }
          }
          _items = [..._items, item]

          // Check if element is selected, if true => add sub items to savedSelectedItems
          const isSelected = savedSelectedItems.find(
            (savedSelectedItem: ScopeTreeRow) => savedSelectedItem.id === item.id
          )
          if (isSelected !== undefined && item.subItems && item.subItems.length > 0) {
            savedSelectedItems = [...savedSelectedItems, ...item.subItems]
          }
        }
        return _items
      }

      _rootRows = await replaceSubItems(scopesList)
    }

    return {
      scopesList: _rootRows,
      selectedItems: savedSelectedItems,
      openPopulation: _openPopulation,
      aborted: params.signal?.aborted
    }
  }
)

const scopeSlice = createSlice({
  name: 'scope',
  initialState: defaultInitialState as ScopeState,
  reducers: {
    clearScope: () => {
      return defaultInitialState
    },
    closeAllOpenedPopulation: (state) => {
      return {
        ...state,
        openPopulation: []
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(login, () => defaultInitialState)
    builder.addCase(logout.fulfilled, () => defaultInitialState)
    // fetchScopesList
    builder.addCase(fetchScopesList.pending, (state) => ({ ...state, loading: true }))
    builder.addCase(fetchScopesList.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      scopesList: action.payload.scopesList
    }))
    builder.addCase(fetchScopesList.rejected, (state) => ({ ...state, loading: false }))
    // fetchScopesListinBackground
    builder.addCase(fetchScopesListinBackground.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      scopesList: action.payload.scopesList
    }))
    builder.addCase(fetchScopesListinBackground.rejected, (state) => ({ ...state, loading: false }))
    // expandScopeElement
    builder.addCase(expandScopeElement.pending, (state) => ({ ...state }))
    builder.addCase(expandScopeElement.fulfilled, (state, action) => ({
      ...state,
      scopesList: action.payload.scopesList,
      openPopulation: action.payload.openPopulation,
      aborted: action.payload.aborted ?? false
    }))
    builder.addCase(expandScopeElement.rejected, (state) => ({ ...state }))
  }
})

export default scopeSlice.reducer
export { fetchScopesList, expandScopeElement }
export const { clearScope, closeAllOpenedPopulation } = scopeSlice.actions
