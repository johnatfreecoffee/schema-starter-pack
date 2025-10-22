// Import all template HTML files
import asphaltShingleRoofing from '@/templates/granular-service/asphalt-shingle-roofing.html?raw';
import atticVentilation from '@/templates/granular-service/attic-ventilation.html?raw';
import chimneyRepair from '@/templates/granular-service/chimney-repair.html?raw';
import flatRoofSystems from '@/templates/granular-service/flat-roof-systems.html?raw';
import greenRoofSystems from '@/templates/granular-service/green-roof-systems.html?raw';
import gutterInstallation from '@/templates/granular-service/gutter-installation.html?raw';
import hurricanePreparation from '@/templates/granular-service/hurricane-preparation.html?raw';
import metalRoofing from '@/templates/granular-service/metal-roofing.html?raw';
import pressureWashing from '@/templates/granular-service/pressure-washing.html?raw';
import roofInspection from '@/templates/granular-service/roof-inspection.html?raw';
import routineMaintenance from '@/templates/granular-service/routine-maintenance.html?raw';
import sidingInstallation from '@/templates/granular-service/siding-installation.html?raw';
import skylightInstallation from '@/templates/granular-service/skylight-installation.html?raw';
import slateRoofing from '@/templates/granular-service/slate-roofing.html?raw';
import waterproofingServices from '@/templates/granular-service/waterproofing-services.html?raw';
import windowInstallation from '@/templates/granular-service/window-installation.html?raw';
import solarRoofing from '@/templates/granular-service/solar-roofing.html?raw';
import tileRoofing from '@/templates/granular-service/tile-roofing.html?raw';
import roofCoatings from '@/templates/granular-service/roof-coatings.html?raw';

import hailDamageRepair from '@/templates/emergency-service/hail-damage-repair.html?raw';
import leakDetectionRepair from '@/templates/emergency-service/leak-detection-repair.html?raw';
import windDamageRestoration from '@/templates/emergency-service/wind-damage-restoration.html?raw';

import commercialRoofing from '@/templates/authority-hub/commercial-roofing.html?raw';
import emergencyRoofRepair from '@/templates/authority-hub/emergency-roof-repair.html?raw';
import insuranceClaimsAssistance from '@/templates/authority-hub/insurance-claims-assistance.html?raw';
import residentialRoofing from '@/templates/authority-hub/residential-roofing.html?raw';
import stormDamageRestoration from '@/templates/authority-hub/storm-damage-restoration.html?raw';
import generalContracting from '@/templates/authority-hub/general-contracting.html?raw';

// Mapping of service names to template content
const templateMap: Record<string, string> = {
  // Granular Services
  'asphalt-shingle-roofing': asphaltShingleRoofing,
  'attic-ventilation': atticVentilation,
  'chimney-repair': chimneyRepair,
  'flat-roof-systems': flatRoofSystems,
  'green-roof-systems': greenRoofSystems,
  'gutter-installation': gutterInstallation,
  'hurricane-preparation': hurricanePreparation,
  'metal-roofing': metalRoofing,
  'pressure-washing': pressureWashing,
  'roof-inspection': roofInspection,
  'routine-maintenance': routineMaintenance,
  'siding-installation': sidingInstallation,
  'skylight-installation': skylightInstallation,
  'slate-roofing': slateRoofing,
  'waterproofing-services': waterproofingServices,
  'window-installation': windowInstallation,
  'solar-roofing': solarRoofing,
  'tile-roofing': tileRoofing,
  'roof-coatings': roofCoatings,
  
  // Emergency Services
  'hail-damage-repair': hailDamageRepair,
  'leak-detection-and-repair': leakDetectionRepair,
  'wind-damage-restoration': windDamageRestoration,
  
  // Authority Hub
  'commercial-roofing': commercialRoofing,
  'emergency-roof-repair': emergencyRoofRepair,
  'insurance-claims-assistance': insuranceClaimsAssistance,
  'residential-roofing': residentialRoofing,
  'storm-damage-restoration': stormDamageRestoration,
  'general-contracting': generalContracting,
};

/**
 * Convert service name to kebab-case file name
 */
export function serviceNameToFileName(serviceName: string): string {
  return serviceName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Get template content for a service
 */
export function getTemplateForService(serviceName: string, category?: string): string | null {
  const fileName = serviceNameToFileName(serviceName);
  const template = templateMap[fileName];
  
  if (!template) {
    console.warn(`No template found for service: ${serviceName} (${fileName})`);
    return null;
  }
  
  return template;
}

/**
 * Get the folder path for a category
 */
export function getCategoryFolder(category: string): string {
  const folderMap: Record<string, string> = {
    'Granular Services': 'granular-service',
    'Emergency Services': 'emergency-service',
    'Authority Hub': 'authority-hub',
  };
  
  return folderMap[category] || 'granular-service';
}
