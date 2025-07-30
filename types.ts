export interface IdCardData {
  issuingAuthority: string;
  location: string;
  expiryDate: string;
  accessAreas: string[];
  name: string;
  position: string;
  company: string;
  idNumber: string;
  scanArea: string;
  scanTimestamp: number;
}