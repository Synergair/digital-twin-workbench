# Digital Twin Workbench Resources

## IFC Building Models (/models)
- **Commercial_Office.ifc** (43MB) - Full commercial office building model
- **Duplex_Residential.ifc** (1.2MB) - Residential duplex building
- **FZK_House.ifc** (297KB) - Standard residential house
- **Institute_Var2.ifc** (297KB) - Educational/institutional building

## Floor Plans (/floorplans)
- Residential floor plan images from houseplans.com

## MEP/HVAC Documentation (/mep)
- **DOE_Building_Energy_Basics.pdf** - Department of Energy building energy guide
- **DOE_Building_Guidebook.pdf** - Building guidelines
- **NIST_HVAC_Fact_Sheet.pdf** - NIST HVAC technical specifications

## Inspection Checklists (/inspections)
- **OSHA_Electrical_Checklist.pdf** - OSHA electrical safety inspection
- **OSHA_Fire_Safety_Checklist.pdf** - Fire safety checklist
- **FEMA_Building_Safety_Evaluation.pdf** - FEMA rapid visual screening guide
- **NIOSH_Building_Assessment.pdf** - NIOSH building assessment protocols
- **Emergency_Preparedness_Checklist.pdf** - Emergency preparedness guide

## Point Cloud Scans (/scans)
- **stanford_bunny_scan.tar.gz** - Stanford bunny PLY files (18MB)
  - Contains multiple PLY point cloud files from different scan angles
  - PLY format compatible with most 3D viewers

## Usage with Codex
Tell Codex to map these resources into your data model:
```
Map the documents in /public/documents/ into the digital twin data model:
- IFC models → Building 3D geometry
- Floor plans → 2D overlays  
- MEP docs → System specifications
- Inspections → Maintenance records
- Scans → Point cloud data
```
