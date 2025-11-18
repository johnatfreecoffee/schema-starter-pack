// Import all MD instruction files for service templates

// Authority Hub
import commercialRoofingMd from '@/templates/page-instructions/service-templates/authority-hub/commercial-roofing.md?raw';
import emergencyRoofRepairMd from '@/templates/page-instructions/service-templates/authority-hub/emergency-roof-repair.md?raw';
import generalContractingMd from '@/templates/page-instructions/service-templates/authority-hub/general-contracting.md?raw';
import insuranceClaimsAssistanceMd from '@/templates/page-instructions/service-templates/authority-hub/insurance-claims-assistance.md?raw';
import residentialRoofingMd from '@/templates/page-instructions/service-templates/authority-hub/residential-roofing.md?raw';
import stormDamageRestorationMd from '@/templates/page-instructions/service-templates/authority-hub/storm-damage-restoration.md?raw';

// Emergency Service
import hailDamageRepairMd from '@/templates/page-instructions/service-templates/emergency-service/hail-damage-repair.md?raw';
import leakDetectionRepairMd from '@/templates/page-instructions/service-templates/emergency-service/leak-detection-repair.md?raw';
import windDamageRestorationMd from '@/templates/page-instructions/service-templates/emergency-service/wind-damage-restoration.md?raw';

// Granule Service
import asphaltShingleRoofingMd from '@/templates/page-instructions/service-templates/granule-service/asphalt-shingle-roofing.md?raw';
import atticVentilationMd from '@/templates/page-instructions/service-templates/granule-service/attic-ventilation.md?raw';
import chimneyRepairMd from '@/templates/page-instructions/service-templates/granule-service/chimney-repair.md?raw';
import flatRoofSystemsMd from '@/templates/page-instructions/service-templates/granule-service/flat-roof-systems.md?raw';
import greenRoofSystemsMd from '@/templates/page-instructions/service-templates/granule-service/green-roof-systems.md?raw';
import gutterInstallationMd from '@/templates/page-instructions/service-templates/granule-service/gutter-installation.md?raw';
import hurricanePreparationMd from '@/templates/page-instructions/service-templates/granule-service/hurricane-preparation.md?raw';
import metalRoofingMd from '@/templates/page-instructions/service-templates/granule-service/metal-roofing.md?raw';
import pressureWashingMd from '@/templates/page-instructions/service-templates/granule-service/pressure-washing.md?raw';
import roofCoatingsMd from '@/templates/page-instructions/service-templates/granule-service/roof-coatings.md?raw';
import roofInspectionMd from '@/templates/page-instructions/service-templates/granule-service/roof-inspection.md?raw';
import routineMaintenanceMd from '@/templates/page-instructions/service-templates/granule-service/routine-maintenance.md?raw';
import sidingInstallationMd from '@/templates/page-instructions/service-templates/granule-service/siding-installation.md?raw';
import skylightInstallationMd from '@/templates/page-instructions/service-templates/granule-service/skylight-installation.md?raw';
import slateRoofingMd from '@/templates/page-instructions/service-templates/granule-service/slate-roofing.md?raw';
import solarRoofingMd from '@/templates/page-instructions/service-templates/granule-service/solar-roofing.md?raw';
import tileRoofingMd from '@/templates/page-instructions/service-templates/granule-service/tile-roofing.md?raw';
import waterproofingServicesMd from '@/templates/page-instructions/service-templates/granule-service/waterproofing-services.md?raw';
import windowInstallationMd from '@/templates/page-instructions/service-templates/granule-service/window-installation.md?raw';

// Mapping of service names (kebab-case) to their MD instruction content
const authorityHubInstructions: Record<string, string> = {
  'commercial-roofing': commercialRoofingMd,
  'emergency-roof-repair': emergencyRoofRepairMd,
  'general-contracting': generalContractingMd,
  'insurance-claims-assistance': insuranceClaimsAssistanceMd,
  'residential-roofing': residentialRoofingMd,
  'storm-damage-restoration': stormDamageRestorationMd,
};

const emergencyServiceInstructions: Record<string, string> = {
  'hail-damage-repair': hailDamageRepairMd,
  'leak-detection-and-repair': leakDetectionRepairMd,
  'wind-damage-restoration': windDamageRestorationMd,
};

const granuleServiceInstructions: Record<string, string> = {
  'asphalt-shingle-roofing': asphaltShingleRoofingMd,
  'attic-ventilation': atticVentilationMd,
  'chimney-repair': chimneyRepairMd,
  'flat-roof-systems': flatRoofSystemsMd,
  'green-roof-systems': greenRoofSystemsMd,
  'gutter-installation': gutterInstallationMd,
  'hurricane-preparation': hurricanePreparationMd,
  'metal-roofing': metalRoofingMd,
  'pressure-washing': pressureWashingMd,
  'roof-coatings': roofCoatingsMd,
  'roof-inspection': roofInspectionMd,
  'routine-maintenance': routineMaintenanceMd,
  'siding-installation': sidingInstallationMd,
  'skylight-installation': skylightInstallationMd,
  'slate-roofing': slateRoofingMd,
  'solar-roofing': solarRoofingMd,
  'tile-roofing': tileRoofingMd,
  'waterproofing-services': waterproofingServicesMd,
  'window-installation': windowInstallationMd,
};

/**
 * Convert service name to kebab-case file name (reuse from templateFiles.ts)
 */
function serviceNameToFileName(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert category name to folder name
 */
function categoryToFolderName(category: string): string {
  const folderMap: Record<string, string> = {
    'Authority Hub': 'authority-hub',
    'Emergency Services': 'emergency-service',
    'Granular Services': 'granule-service',
  };
  return folderMap[category] || category.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get MD instruction content for a specific service
 * @param serviceName - The name of the service (will be converted to kebab-case)
 * @param category - The category of the service (e.g., "Authority Hub", "Emergency Services", "Granular Services")
 * @returns The MD instruction content or null if not found
 */
export function getServiceInstructions(serviceName: string, category: string): string | null {
  const fileName = serviceNameToFileName(serviceName);
  const folderName = categoryToFolderName(category);
  
  let instructionsMap: Record<string, string> | null = null;
  
  switch (folderName) {
    case 'authority-hub':
      instructionsMap = authorityHubInstructions;
      break;
    case 'emergency-service':
      instructionsMap = emergencyServiceInstructions;
      break;
    case 'granule-service':
      instructionsMap = granuleServiceInstructions;
      break;
    default:
      console.warn(`Unknown service category: ${category} (mapped to ${folderName})`);
      return null;
  }
  
  const content = instructionsMap[fileName];
  
  if (!content) {
    console.warn(`No MD instructions found for service: ${serviceName} (${fileName}) in category: ${category} (${folderName})`);
    return null;
  }
  
  return content;
}
