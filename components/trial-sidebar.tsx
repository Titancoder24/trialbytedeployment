"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface TrialSidebarProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
  isSectionVisible: (sectionId: string) => boolean;
  onAssociatedStudiesClick?: () => void;
  onLogsClick?: () => void;
}

const sidebarSections = [
  { id: "overview", labelKey: "sidebar.overview", icon: "/pngs/sidebar1.png" },
  { id: "objectives", labelKey: "sidebar.objectives", icon: "/pngs/sidebar2.png" },
  { id: "treatmentPlan", labelKey: "sidebar.treatmentPlan", icon: "/pngs/sidebar3.png" },
  { id: "patientDescription", labelKey: "sidebar.patientDescription", icon: "/pngs/sidebar4.png" },
  { id: "timing", labelKey: "sidebar.timing", icon: "/pngs/sidebar5.png" },
  { id: "outcome", labelKey: "sidebar.outcome", icon: "/pngs/sidebar6.png" },
  { id: "publishedResults", labelKey: "sidebar.publishedResults", icon: "/pngs/sidebar7.png" },
  { id: "sites", labelKey: "sidebar.sites", icon: "/pngs/sidebar8.png" },
  { id: "otherSources", labelKey: "sidebar.otherSources", icon: "/pngs/sidebar9.png" },
  { id: "associatedStudies", labelKey: "sidebar.associatedStudies", icon: "/pngs/sidebar10.png" },
  { id: "logs", labelKey: "sidebar.logs", icon: "/pngs/sidebar11.png" },
];

const otherSourcesSubItems = [
  { id: "pipelineData", labelKey: "sidebar.pipelineData" },
  { id: "pressRelease", labelKey: "sidebar.pressRelease" },
  { id: "publications", labelKey: "sidebar.publications" },
  { id: "trialRegistries", labelKey: "sidebar.trialRegistries" },
];

export function TrialSidebar({
  activeSection,
  onSectionClick,
  isSectionVisible,
  onAssociatedStudiesClick,
  onLogsClick,
}: TrialSidebarProps) {
  const { t } = useTranslation();
  const [otherSourcesExpanded, setOtherSourcesExpanded] = useState(
    activeSection === "otherSources"
  );

  // Update expanded state when activeSection changes
  useEffect(() => {
    if (activeSection === "otherSources") {
      setOtherSourcesExpanded(true);
    }
  }, [activeSection]);

  return (
    <div
      className="bg-white absolute overflow-hidden h-fit sidebar-scroll"
      style={{
        width: "249px",
        top: "75px",
        left: "39.33px",
        borderRadius: "12px",
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
      }}
    >
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 12px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
          margin: 4px 0;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #204B73;
          border-radius: 4px;
          border: 2px solid #f1f1f1;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #1a3d5c;
        }
      `}</style>
      {/* Section Buttons */}
      <div className="flex flex-col h-full relative">
        <div className="flex-1">
          {sidebarSections.map((section, index) => {
            if (!isSectionVisible(section.id)) return null;

            const isActive = activeSection === section.id;
            const isOtherSources = section.id === "otherSources";

            // Get all visible sections to determine if this is the last one before Pipeline Data
            const visibleSections = sidebarSections.filter(s => isSectionVisible(s.id));
            const currentIndexInVisible = visibleSections.findIndex(s => s.id === section.id);
            const isLastSection = currentIndexInVisible === visibleSections.length - 1;
            const shouldShowBorder = !isLastSection;

            if (isOtherSources) {
              return (
                <div key={section.id} className="relative">
                  <button
                    onClick={() => {
                      onSectionClick(section.id);
                    }}
                    className="w-full text-left px-4 py-3 transition-all flex items-center justify-between bg-[#204B73] text-white"
                    style={{
                      width: "249px",
                      height: "73.86px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="relative w-5 h-5 flex items-center justify-center"
                      >
                        <Image
                          src={section.icon}
                          alt={t(section.labelKey)}
                          width={20}
                          height={20}
                          className="object-contain"
                          style={{
                            filter: "brightness(0) invert(1)",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "Poppins",
                          fontWeight: 400,
                          fontStyle: "normal",
                          fontSize: "14px",
                          lineHeight: "100%",
                          letterSpacing: "0%",
                          textTransform: "capitalize",
                        }}
                      >
                        {t(section.labelKey)}
                      </span>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setOtherSourcesExpanded(!otherSourcesExpanded);
                      }}
                      className="p-2 hover:bg-white/20 rounded-full cursor-pointer"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${otherSourcesExpanded ? "rotate-180" : ""} text-white`}
                      />
                    </div>
                  </button>

                  {/* Sub-items */}
                  {otherSourcesExpanded && (
                    <div className="bg-white relative">
                      {otherSourcesSubItems.map((subItem, subIndex) => (
                        <div key={subItem.id} className="relative">
                          <button
                            className={`w-full text-left pl-14 px-4 py-2 transition-colors ${activeSection === subItem.id
                              ? "text-[#204B73] font-medium bg-gray-50"
                              : "text-gray-600 hover:bg-[#204B73] hover:text-white"
                              }`}
                            onClick={() => onSectionClick(subItem.id)}
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: activeSection === subItem.id ? 500 : 400,
                              fontStyle: "normal",
                              fontSize: "14px",
                              lineHeight: "100%",
                              letterSpacing: "0%",
                              textTransform: "capitalize",
                              minHeight: "32px",
                            }}
                          >
                            {t(subItem.labelKey)}
                          </button>
                          {/* Border between sub-items */}
                          {subIndex < otherSourcesSubItems.length - 1 && (
                            <div
                              className="absolute"
                              style={{
                                width: "249.484375px",
                                height: "0px",
                                top: "32px",
                                left: "0px",
                                borderTop: "1px solid #E0E0E0",
                                borderWidth: "1px",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Border after Other Sources if there are more sections */}
                  {shouldShowBorder && (
                    <div
                      className="absolute"
                      style={{
                        width: "249.484375px",
                        height: "0px",
                        top: otherSourcesExpanded
                          ? `${73.86 + (otherSourcesSubItems.length * 32)}px`
                          : "73.86px",
                        left: "0px",
                        borderTop: "1px solid #E0E0E0",
                        borderWidth: "1px",
                      }}
                    />
                  )}
                </div>
              );
            }

            // Handle special click handlers for Associated Studies and Logs
            const handleClick = () => {
              if (section.id === "associatedStudies" && onAssociatedStudiesClick) {
                onAssociatedStudiesClick();
              } else if (section.id === "logs" && onLogsClick) {
                onLogsClick();
              } else {
                onSectionClick(section.id);
              }
            };

            return (
              <div key={section.id} className="relative">
                <button
                  onClick={handleClick}
                  className="w-full text-left px-4 py-3 transition-all flex items-center gap-3 text-gray-700 hover:bg-[#204B73] hover:text-white group"
                  style={{
                    width: "249px",
                    height: "73.86px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="relative w-5 h-5 flex-shrink-0 group-hover:brightness-0 group-hover:invert transition-all"
                  >
                    <Image
                      src={section.icon}
                      alt={t(section.labelKey)}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "Poppins",
                      fontWeight: 400,
                      fontStyle: "normal",
                      fontSize: "14px",
                      lineHeight: "100%",
                      letterSpacing: "0%",
                      textTransform: "capitalize",
                    }}
                  >
                    {t(section.labelKey)}
                  </span>
                </button>
                {/* Border between items - after each section */}
                {shouldShowBorder && (
                  <div
                    className="absolute"
                    style={{
                      width: "249.484375px",
                      height: "0px",
                      top: "73.86px",
                      left: "0px",
                      borderTop: "1px solid #E0E0E0",
                      borderWidth: "1px",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
