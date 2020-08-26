import { isEmpty, get } from 'lodash'
import AirtableCRUD from 'airtable-crud'
import { AirtableConfig, AirtableSyncOptions } from './types'
import { syncTable, resyncTable } from './airtable'

export default class AirtableSync {
  config: AirtableConfig
  source: AirtableCRUD
  destination: AirtableCRUD

  constructor(config: { config: AirtableConfig } | null = null) {
    const sApiKey = <string>process.env.AIRTABLE_SYNC_API_KEY_SOURCE || get(config, 'sourceApiKey')
    const dApiKey =
      <string>process.env.AIRTABLE_SYNC_API_KEY_DESTINATION || get(config, 'destinationApiKey')
    const sBase = <string>process.env.AIRTABLE_SYNC_BASE_SOURCE || get(config, 'sourceBase')
    const dBase =
      <string>process.env.AIRTABLE_SYNC_BASE_DESTINATION || get(config, 'destinationBase')

    if (isEmpty(sApiKey) || isEmpty(dApiKey) || isEmpty(sBase) || isEmpty(dBase)) {
      throw new Error('API Keys and Base IDs are required!')
    }

    this.config = {
      sourceApiKey: <string>sApiKey,
      sourceBase: <string>sBase,
      destinationApiKey: <string>dApiKey,
      destinationBase: <string>dBase,
    }

    this.source = new AirtableCRUD({
      apiKey: this.config.sourceApiKey,
      base: this.config.sourceBase,
    })
    this.destination = new AirtableCRUD({
      apiKey: this.config.destinationApiKey,
      base: this.config.destinationBase,
    })
  }

  /**
   * Syncs a source table within Airtable to a destination table across bases
   * based on a modified column.
   *
   * Both tables must have a modified column which can be specified in
   * the options object or defaults to `Modified On`
   *
   * The destination table needs a reference column to the source
   * record id. This defaults to `Source ID` and can also be specified
   * in the options object.
   */
  syncTable = async ({ options }: { options: AirtableSyncOptions }) => {
    const { source, destination } = this

    return new Promise(async (resolve, reject) => {
      try {
        const results = await syncTable({ options, source, destination })
        resolve(results)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Resyncs an entire table in the event the tables have fallen out of
   * sync with each other due to changes made directly in the destination.
   *
   * The comparison for syncing defaults to the source record id and destination
   * `Source ID` column. This can be updated using the options object.
   * Multiple columns can be used as a comparison.
   *
   * This will not destroy records in the destination due to the potential
   * for lost relationships but instead just update and create new ones.
   */
  resyncTable = async ({ options }: { options: AirtableSyncOptions }) => {
    const { source, destination } = this

    return new Promise(async (resolve, reject) => {
      try {
        const results = await resyncTable({ options, source, destination })
        resolve(results)
      } catch (e) {
        reject(e)
      }
    })
  }
}
