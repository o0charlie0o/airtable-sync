import { get, difference, isNil, first } from 'lodash'
import { AirtableSyncOptions } from '../types'
import AirtableCRUD from 'airtable-crud'
import { getLastUpdatedTimestamp, getUpdatedRecords, mapRecords } from './'

export const syncTable = async ({
  options,
  source,
  destination,
}: {
  options: AirtableSyncOptions
  source: AirtableCRUD
  destination: AirtableCRUD
}) => {
  const { sourceTable, destinationTable, modifiedColumn, columns, recordIteratee } = options

  const dTable = destinationTable || sourceTable
  const dModifiedColumn =
    typeof modifiedColumn === 'string'
      ? modifiedColumn
      : get(modifiedColumn, 'destination') || 'Modified On'

  const sModifiedColumn =
    typeof modifiedColumn === 'string'
      ? modifiedColumn
      : get(modifiedColumn, 'source') || 'Modified On'

  const sourceIdRef = options.sourceIdRef || 'Record ID'
  const destinationIdRef = options.destinationIdRef || 'Source ID'

  // @ts-ignore
  const sourceColumns = typeof columns[0] === 'string' ? columns : columns.map((c) => c.source)
  const destinationColumns =
    // @ts-ignore
    typeof columns[0] === 'string' ? columns : columns.map((c) => c.destination)

  return new Promise(async (resolve, reject) => {
    try {
      const modifiedOn = await getLastUpdatedTimestamp({
        airtable: destination,
        table: dTable,
        modifiedColumn: <string>dModifiedColumn,
      })

      const updatedRecords = await getUpdatedRecords({
        airtable: source,
        table: options.sourceTable,
        modifiedColumn: <string>sModifiedColumn,
        modifiedOn: <string>modifiedOn,
      })

      const sourceRecords = await source.read({ table: sourceTable })
      const destinationRecords = await destination.read({
        table: dTable,
      })

      const dIds = destinationRecords
        .map((r) => r.fields[destinationIdRef])
        .filter((r) => !isNil(r))

      if (!isNil(recordIteratee)) {
        const nilRefRecords = destinationRecords.filter((r) => isNil(r.fields[destinationIdRef]))
        const sourceIds = nilRefRecords
          .map((d) => first(sourceRecords.filter((s) => recordIteratee(s, d))))
          .map((r) => (!isNil(r) ? r.id : null))
          .filter((r) => !isNil(r))
        dIds.push(...sourceIds)
      }

      const newRecords = updatedRecords.filter((r) => !dIds.includes(r.id))
      const existingRecords = updatedRecords.filter((r) => dIds.includes(r.id))

      let syncedRecords = []
      const toCreateRecords = mapRecords({
        records: newRecords,
        sourceColumns,
        destinationIdRef,
        destinationColumns,
      })

      const toUpdateRecords = mapRecords({
        records: existingRecords,
        destinationRecords,
        destinationIdRef,
        sourceColumns,
        destinationColumns,
      })

      const toDeleteRecords = destinationRecords
        .filter((r) => !isNil(r.fields[destinationIdRef]))
        .filter((r) => sourceRecords.filter((s) => s.id === r.fields[destinationIdRef]).length === 0)

      if (!isNil(recordIteratee)) {
        const more = destinationRecords
          .filter((r) => isNil(r.fields[destinationIdRef]))
          .filter((r) => sourceRecords.filter((s) => recordIteratee(s, r)).length === 0)
        toDeleteRecords.push(...more)
      }

      toCreateRecords.length > 0 && syncedRecords.push(await destination.create({ table: dTable, records: toCreateRecords }))
      toUpdateRecords.length > 0 && syncedRecords.push(await destination.update({ table: dTable, records: toUpdateRecords }))
      toDeleteRecords.length > 0 && syncedRecords.push(await destination.delete({ table: dTable, ids: toDeleteRecords.map(r => r.id) }))

      resolve(updatedRecords)
    } catch (e) {
      reject(e)
    }
  })
}
