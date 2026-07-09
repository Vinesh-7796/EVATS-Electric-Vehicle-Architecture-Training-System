import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Activity } from "lucide-react";
import { useFlowchart } from "../contexts/FlowchartContext";
import { getComponentsByFlowchart } from "../data/components";
import type { Domain } from "../types";

// Accent colours aligned to the design spec (kept in sync with Header/Sidebar).
const domainAccentColors: Record<string, string> = {
  HV: "#F97316",
  LV: "#2563EB",
  CAN: "#16A34A",
  Thermal: "#0891B2",
  Safety: "#DC2626",
  Control: "#8B5CF6",
  Ground: "#64748B",
  "Hydraulic / Mechanical": "#8B5CF6",
  "Powertrain / Drivetrain": "#F97316",
};

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

export const DetailPanel: React.FC = () => {
  const {
    selectedComponent,
    selectedFlowchart,
    setEnlargedImageComponent,
  } = useFlowchart();
  const displayComponent = selectedComponent;
  const flowchartComponents = getComponentsByFlowchart(selectedFlowchart.id);

  const accent =
    (displayComponent && domainAccentColors[displayComponent.domain as Domain]) ||
    domainAccentColors[selectedFlowchart.colorTheme] ||
    "#F97316";
  const accentRgb = hexToRgb(accent);

  return (
    <motion.aside
      initial={{ width: 320 }}
      animate={{ width: 320 }}
      className="industrial-side-panel flex flex-col h-full border-l border-[#E2E8F0] dark:border-white/10 overflow-y-auto transition-colors"
    >
      <AnimatePresence mode="wait">
        {displayComponent ? (
          <motion.div
            key={displayComponent.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 space-y-7"
          >
            {/* Header section */}
            <div>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{
                  backgroundColor: `rgba(${accentRgb}, 0.12)`,
                  color: accent,
                }}
              >
                {displayComponent.domain}
              </span>
              <h2 className="mt-2 text-[20px] font-semibold text-[#0F172A] dark:text-white tracking-[-0.01em] transition-colors">
                {displayComponent.name}
              </h2>
              {displayComponent.aliases && (
                <p className="mt-1 text-[13px] text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                  Also known as: {displayComponent.aliases.join(", ")}
                </p>
              )}
            </div>

            {/* Photo section */}
            {displayComponent.image && (
              <div className="pt-1 border-t border-[#F1F5F9] dark:border-white/5 transition-colors">
                <button
                  type="button"
                  onClick={() => setEnlargedImageComponent(displayComponent)}
                  className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#252525] text-left transition hover:border-[#CBD5E1] dark:hover:border-white/20 focus:outline-none focus:ring-2"
                  style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  aria-label={`Show enlarged image for ${displayComponent.name}`}
                >
                  <img
                    src={displayComponent.image}
                    alt={displayComponent.name}
                    className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                  />
                  <span
                    className="absolute right-2 top-2 rounded-md p-1.5 text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.85)" }}
                  >
                    <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                </button>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                Description
              </h3>
              <p className="text-[13px] leading-relaxed text-[#475569] dark:text-[#d4d4d4] transition-colors">
                {displayComponent.description}
              </p>
            </div>

            {/* Engineering Details */}
            {(displayComponent.detailedNotes ||
              displayComponent.cableType ||
              displayComponent.communicationType) && (
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                  Engineering Details
                </h3>
                <div className="flex flex-col pt-1">
                  {displayComponent.detailedNotes && (
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-[#F1F5F9] dark:border-white/5 transition-colors">
                      <span className="text-xs text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                        Notes
                      </span>
                      <span className="text-xs font-medium text-[#475569] dark:text-white col-span-2 text-left transition-colors">
                        {displayComponent.detailedNotes}
                      </span>
                    </div>
                  )}
                  {displayComponent.cableType && (
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-[#F1F5F9] dark:border-white/5 transition-colors">
                      <span className="text-xs text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                        Cable type
                      </span>
                      <span className="text-xs font-medium text-[#475569] dark:text-white col-span-2 text-right transition-colors">
                        {displayComponent.cableType}
                      </span>
                    </div>
                  )}
                  {displayComponent.communicationType && (
                    <div className="grid grid-cols-3 gap-2 py-2 border-b border-[#F1F5F9] dark:border-white/5 transition-colors">
                      <span className="text-xs text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                        Control input
                      </span>
                      <span className="text-xs font-medium text-[#475569] dark:text-white col-span-2 text-right transition-colors">
                        {displayComponent.communicationType}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnostics */}
            {displayComponent.diagnostics && (
              <div className="space-y-2.5">
                <h3 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#DC2626] dark:text-[#ff6b35] transition-colors">
                  <Activity className="h-3 w-3" strokeWidth={1.75} />
                  Diagnostics
                </h3>
                <p className="text-[13px] leading-relaxed text-[#475569] dark:text-[#d4d4d4] transition-colors">
                  {displayComponent.diagnostics}
                </p>
              </div>
            )}

            {/* Related Systems */}
            {displayComponent.relatedSystems &&
              displayComponent.relatedSystems.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                    Related Systems
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {displayComponent.relatedSystems.map((sys) => (
                      <span
                        key={sys}
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          backgroundColor: `rgba(${accentRgb}, 0.12)`,
                          color: accent,
                        }}
                      >
                        {sys}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </motion.div>
        ) : (
          <motion.div
            key={`overview-${selectedFlowchart.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 space-y-7"
          >
            {/* Overview Header */}
            <div>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{
                  backgroundColor: `rgba(${accentRgb}, 0.12)`,
                  color: accent,
                }}
              >
                Overview
              </span>
              <h2 className="mt-2 text-[20px] font-semibold text-[#0F172A] dark:text-white tracking-[-0.01em] transition-colors">
                {selectedFlowchart.title}
              </h2>
              <p className="mt-1 text-[13px] text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                {selectedFlowchart.shortDescription}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                Description
              </h3>
              <p className="text-[13px] leading-relaxed text-[#475569] dark:text-[#d4d4d4] transition-colors">
                {selectedFlowchart.shortDescription}. This flowchart illustrates
                the architecture and interconnections of the{" "}
                {selectedFlowchart.title.toLowerCase()} within the eULE electric
                bus platform. Select a component from the sidebar to explore
                individual subsystems in detail.
              </p>
            </div>

            {/* Component List */}
            <div className="space-y-2.5">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#64748B] dark:text-[#8a8a8a] transition-colors">
                Components in this system
              </h3>
              <ul className="space-y-1.5">
                {flowchartComponents.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 text-xs text-[#475569] dark:text-[#d4d4d4] transition-colors"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
