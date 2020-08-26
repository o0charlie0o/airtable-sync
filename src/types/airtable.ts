type AirtableRecord = {
  id: string
  fields: any
}

type AirtableConfig = {
  sourceApiKey: string
  sourceBase: string
  destinationApiKey: string
  destinationBase: string
}

type RecordIteratee = (s: AirtableRecord, d: AirtableRecord) => boolean

type AirtableSyncOptions = {
  sourceTable: string
  destinationTable?: string
  columns: ({
    source: string,
    destination: string,
  } | string)[]
  modifiedColumn?: { source: string, destination?: string} | string
  sourceIdRef?: string
  destinationIdRef?: string
  recordIteratee?: RecordIteratee
}

export type { AirtableRecord, AirtableConfig, AirtableSyncOptions, RecordIteratee }