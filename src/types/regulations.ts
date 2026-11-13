export interface RegulationParcel {
  row: number
  region: string
  district: string
  locality: string
  plannedLot: string
  confirmedLot: string
  areaM2: number
  use: string
  zoning: string
  coverage: number | null
  floorArea: number | null
  floors: number | null
  contactPhone?: string
  noticeIds: string[]
  relatedNoticeIds: string[]
}

export interface RegulationNotice {
  id: string
  title: string
  region: string
  url: string
  status: string
  collectionStatus: string
  note: string
}

export interface RegulationDocument {
  noticeId: string
  fileId: string
  title: string
  kind: string
  url: string
  sha256: string
  inArchive: boolean
}

export interface RegulationSample {
  noticeId: string
  district: string
  blocks: string
  use: string
  coverage: number
  floorArea: number
  floors: number
  height: string
  allowed: string
  prohibited: string
  conditions: string
  pdfPages: string
  printedPages: string
  article: string
  verification: string
  url: string
}

export interface RegulationDataset {
  version: 1
  asOf: string
  workbook: string
  workbookSha256: string
  parcels: RegulationParcel[]
  noticeParcels: {
    noticeId: string
    lot: string
    areaM2: number
    address: string
    region: string
    sourceRow: number | null
  }[]
  notices: RegulationNotice[]
  documents: RegulationDocument[]
  samples: RegulationSample[]
}
