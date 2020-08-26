import { AirtableRecord } from '../src/types'
import AirtableSync from '../src'

const Sync = new AirtableSync()

Sync.syncTable({
  options: {
    sourceTable: 'People',
    destinationTable: 'Person',
    modifiedColumn: {
      source: 'Modified At',
    },
    columns: [
      'First Name',
      'Last Name',
      'Mobile',
      'Email',
      'Address',
      'Address 2',
      'City',
      'State',
      'Zip Code',
      'Status',
    ],
    recordIteratee: (s: AirtableRecord, d: AirtableRecord) =>
      s.fields['First Name'] === d.fields['First Name'] &&
      s.fields['Last Name'] === d.fields['Last Name'],
  },
}).catch(e => console.error(e))