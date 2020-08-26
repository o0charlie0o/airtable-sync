import lodash from 'lodash'
import moment from 'moment'
import AirtableCRUD from 'airtable-crud'

type GetUpdatedRecordsProps = {
  airtable: AirtableCRUD
  table: string
  modifiedColumn: string
  modifiedOn: string
}

export const getUpdatedRecords = async ({ airtable, table, modifiedColumn, modifiedOn }: GetUpdatedRecordsProps): Promise<Array<any>> => {
  return new Promise(async (resolve, reject) => {
    try {
      const records = await airtable.read({ table, filter: `IS_AFTER({${modifiedColumn}}, DATETIME_PARSE("${modifiedOn}", 'YYYY-MM-DDTHH:mm:ss.SSS'))` })
      resolve(records)
    } catch(e) {
      reject(e)
    }
  })
}
