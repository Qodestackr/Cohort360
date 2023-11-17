import React, { ReactNode } from 'react'

import {
  Grid,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography
} from '@mui/material'

import useStyles from './styles'
import { Column } from 'types'
import { Direction, OrderBy, Order } from 'types/searchCriterias'

type DataTableProps = {
  columns: Column[]
  order?: OrderBy
  setOrder?: (order: OrderBy) => void
  page?: number
  setPage?: (page: number) => void
  rowsPerPage?: number
  total?: number
  children: ReactNode
  noPagination?: boolean
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  order,
  setOrder,
  page,
  setPage,
  rowsPerPage,
  total,
  ...props
}) => {
  const { classes, cx } = useStyles()

  const createSortHandler = (property: Order) => () => {
    if (setOrder) {
      setOrder({
        orderBy: property,
        orderDirection: order?.orderDirection === Direction.ASC ? Direction.DESC : Direction.ASC
      })
    }
  }
  return (
    <Grid container justifyContent="flex-end">
      <TableContainer component={Paper}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow className={classes.tableHead}>
              {columns.map((column, index) =>
                column.multiple === undefined ? (
                  <TableCell
                    key={index}
                    sortDirection={order?.orderBy === column.code ? order?.orderDirection : false}
                    align={column.align}
                    className={classes.tableHeadCell}
                  >
                    {column.sortableColumn ? (
                      <TableSortLabel
                        active={order?.orderBy === column.code}
                        direction={order?.orderBy === column.code ? order?.orderDirection : 'asc'}
                        onClick={createSortHandler(column.code as Order)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ) : (
                  <TableCell key={index} className={classes.tableHeadCell}>
                    {column.multiple.map(
                      (subColumn, index) =>
                        subColumn.multiple === undefined && (
                          <React.Fragment key={index}>
                            {subColumn.sortableColumn ? (
                              <TableSortLabel
                                className={classes.multiple}
                                active={order?.orderBy === subColumn.code}
                                direction={order?.orderBy === subColumn.code ? order?.orderDirection : 'asc'}
                                onClick={createSortHandler(subColumn.code as Order)}
                              >
                                {subColumn.label}
                              </TableSortLabel>
                            ) : (
                              <Typography
                                className={cx([classes.multiple, classes.tableHeadCell, classes.tableHeadLabel])}
                              >
                                {subColumn.label}
                              </Typography>
                            )}
                          </React.Fragment>
                        )
                    )}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>{props.children}</TableBody>
        </Table>
      </TableContainer>

      {props.noPagination !== true && (
        <Pagination
          className={classes.pagination}
          count={Math.ceil((total ?? 0) / (rowsPerPage ?? 100))}
          shape="circular"
          onChange={(event, page: number) => setPage && setPage(page)}
          page={page}
        />
      )}
    </Grid>
  )
}

export default DataTable
