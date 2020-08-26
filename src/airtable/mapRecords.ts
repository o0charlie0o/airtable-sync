import { isNil, first, get, omitBy } from 'lodash'
import { AirtableRecord, RecordIteratee } from '../types'

type MapRecords = {
  records: AirtableRecord[]
  destinationRecords?: AirtableRecord[]
  destinationIdRef: string
  sourceColumns: string[]
  destinationColumns: string[]
  recordIteratee?: RecordIteratee
}

// @ts-ignore
export const mapRecords = ({
  records,
  destinationRecords = undefined,
  destinationIdRef,
  sourceColumns,
  destinationColumns,
  recordIteratee
}: MapRecords) => {
  return records.map((r) => {
    return omitBy({
      id:
        !isNil(destinationRecords) && !isNil(destinationIdRef) && isNil(recordIteratee)
          ? get(first(destinationRecords.filter((d) => d.fields[destinationIdRef] === r.id)), 'id')
          : !isNil(destinationRecords) && !isNil(recordIteratee) ? first(destinationRecords.filter(i => recordIteratee(r, i)))?.id
          : null,
      fields: Object.assign(
        { [destinationIdRef]: r.id },
        ...destinationColumns.map((c, i) => ({ [c]: r.fields[sourceColumns[i]] })),
      ),
    }, (o) => isNil(o))
  })
}
