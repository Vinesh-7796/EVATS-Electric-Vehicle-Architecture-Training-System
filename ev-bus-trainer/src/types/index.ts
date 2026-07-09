export type Domain = 'HV' | 'LV' | 'CAN' | 'Thermal' | 'Safety' | 'Control' | 'Ground' | 'Hydraulic / Mechanical' | 'Powertrain / Drivetrain'

export interface ComponentDetail {
  id: string
  flowchartId: string
  name: string
  aliases?: string[]
  svgCellIds?: string[]
  description: string
  detailedNotes?: string
  domain: Domain
  cableType?: string
  communicationType?: string
  upstream?: string[]
  downstream?: string[]
  relatedSystems?: string[]
  diagnostics?: string
  image?: string
  isHeading?: boolean
  sourceReferences?: string[]
}

export interface FlowchartInfo {
  id: string
  title: string
  shortDescription: string
  svgFile: string
  videoFile?: string
  colorTheme: Domain
  componentIds: string[]
}
