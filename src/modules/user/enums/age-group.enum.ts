export enum AgeGroup {
  CHILDREN = '4-6',
  YOUTH = '7-12',
  TEEN = '13-17',
  ADULT = '18+',
}

export const AgeGroupLabels: Record<AgeGroup, string> = {
  [AgeGroup.CHILDREN]: '٤ - ٦ سنوات',
  [AgeGroup.YOUTH]: '٧ - ١٢ سنة',
  [AgeGroup.TEEN]: '١٣ - ١٧ سنة',
  [AgeGroup.ADULT]: '١٨ سنة فما فوق',
};
