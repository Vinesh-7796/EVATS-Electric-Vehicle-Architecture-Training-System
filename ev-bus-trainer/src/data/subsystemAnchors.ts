export type SubsystemId =
  | 'hv_power'
  | 'lv_power'
  | 'can_bus'
  | 'hv_aux'
  | 'regen_braking'
  | 'propulsion_system'
  | 'overall_power'
  | 'pneumatics'

export interface SubsystemAnchor {
  id: SubsystemId
  name: string
  order: number
  position: { x: number; y: number; z: number }
  labelOffset: { x: number; y: number }
  accentColor: string
  flowchartId: string
  componentId?: string
}

export const subsystemAnchors: SubsystemAnchor[] = [
  {
    id: 'hv_power',
    name: 'HV Power System',
    order: 1,
    position: { x: 0.86, y: -0.62, z: -2.66 },
    labelOffset: { x: 92, y: -40 },
    accentColor: '#FF3B30',
    flowchartId: 'hv-power',
    componentId: 'hv-battery-system',
  },
  {
    id: 'lv_power',
    name: 'LV Power System',
    order: 2,
    position: { x: 0.86, y: 0.06, z: 2.64 },
    labelOffset: { x: 82, y: -112 },
    accentColor: '#32D583',
    flowchartId: 'lv-power',
    componentId: 'lv-24v-battery',
  },
  {
    id: 'can_bus',
    name: 'CAN Bus Network',
    order: 3,
    position: { x: 0, y: -0.5, z: 3.2 },
    labelOffset: { x: 20, y: 110 },
    accentColor: '#38BDF8',
    flowchartId: 'can-bus',
    componentId: 'evcu',
  },
  {
    id: 'hv_aux',
    name: 'HV Auxiliary Network',
    order: 4,
    position: { x: -0.98, y: -0.18, z: -2.2 },
    labelOffset: { x: -290, y: -110 },
    accentColor: '#FF5C8A',
    flowchartId: 'hv-aux',
    componentId: 'compressor',
  },
  {
    id: 'regen_braking',
    name: 'Regenerative Braking',
    order: 5,
    position: { x: 0.92, y: -0.68, z: -1.72 },
    labelOffset: { x: 82, y: 100 },
    accentColor: '#FB923C',
    flowchartId: 'regen-braking',
    componentId: 'traction-motor-regen',
  },
  {
    id: 'propulsion_system',
    name: 'Propulsion System',
    order: 6,
    position: { x: -0.82, y: -0.72, z: -1.18 },
    labelOffset: { x: -292, y: -10 },
    accentColor: '#FACC15',
    flowchartId: 'propulsion-system',
    componentId: 'hv-traction-motor',
  },
  {
    id: 'overall_power',
    name: 'Overall Power System',
    order: 7,
    position: { x: -0.18, y: 0.18, z: 0.02 },
    labelOffset: { x: -20, y: -165 },
    accentColor: '#A78BFA',
    flowchartId: 'overall',
    componentId: 'overall-hv',
  },
  {
    id: 'pneumatics',
    name: 'Pneumatic Systems',
    order: 8,
    position: { x: -0.80, y: -0.66, z: 2.2 },
    labelOffset: { x: -292, y: 100 },
    accentColor: '#64748B',
    flowchartId: 'pneumatics',
    componentId: 'pneumatics-main-supply',
  },
]
