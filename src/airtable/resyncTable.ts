import { difference, isNil, first } from 'lodash'
import AirtableCRUD from 'airtable-crud'
import { AirtableSyncOptions } from '../types'
import { mapRecords } from './'

export const resyncTable = async ({
  options,
  source,
  destination,
}: {
  options: AirtableSyncOptions
  source: AirtableCRUD
  destination: AirtableCRUD
}) => {
  const { sourceTable, destinationTable, columns, recordIteratee } = options

  const dTable = destinationTable || sourceTable
  const sourceIdRef = options.sourceIdRef || 'Record ID'
  const destinationIdRef = options.destinationIdRef || 'Source ID'

  // @ts-ignore
  const sourceColumns = typeof columns[0] === 'string' ? columns : columns.map((c) => c.source)
  const destinationColumns =
    // @ts-ignore
    typeof columns[0] === 'string' ? columns : columns.map((c) => c.destination)

  return new Promise(async (resolve, reject) => {
    try {
      const sourceRecords = await source.read({ table: sourceTable, fields: sourceColumns })
      const destinationRecords = await destination.read({
        table: dTable,
        fields: [...destinationColumns, destinationIdRef],
      })
      const dIds = !isNil(recordIteratee)
        ? destinationRecords
            .map((d) => first(sourceRecords.filter((s) => recordIteratee(s, d))) || d)
            .map((r) => (typeof r !== 'undefined' ? r.id : null))
        : destinationRecords.map((r) => r.fields[destinationIdRef])

      const newRecords = sourceRecords.filter((r) => !dIds.includes(r.id))
      const existingRecords = sourceRecords.filter((r) => dIds.includes(r.id))

      let syncedRecords: any[] = []
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
        recordIteratee,
      })

      const toDeleteRecords = difference(
        dIds.filter((i) => !isNil(i)),
        sourceRecords.map((r) => r.id),
      )

      syncedRecords.push(await destination.create({ table: dTable, records: toCreateRecords }))
      syncedRecords.push(await destination.update({ table: dTable, records: toUpdateRecords }))
      syncedRecords.push(await destination.delete({ table: dTable, ids: toDeleteRecords }))

      resolve(syncedRecords)
    } catch (e) {
      reject(e)
    }
  })
}
