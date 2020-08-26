import moment from 'moment'
import { get, first } from 'lodash'
import AirtableCRUD from 'airtable-crud'

export const getLastUpdatedTimestamp = async ({
  airtable,
  table,
  modifiedColumn,
}: {
  airtable: AirtableCRUD
  table: string
  modifiedColumn: string
}): Promise<string | Error> => {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await airtable.read({
        table,
        maxRecords: 1,
        sort: [{ field: modifiedColumn, direction: 'desc' }],
      })

      const timestamp = get(first(results), `fields.${modifiedColumn}`)

      if (!timestamp) {
        reject(new Error(`No records returned in ${table}!`))
        return
      }

      resolve(moment.utc(timestamp).format('YYYY-MM-DD HH:mm:ss'))
    } catch (e) {
      reject(e)
    }
  })
}
