export type StorageProvider = 'google_drive' | 'sharepoint';

export interface ContractDocumentFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  folderPath: string;
  viewUrl: string;
  downloadUrl: string;
  sha256Hash: string;
  version: number;
  uploadedAt: string;
  uploadedBy: string;
  provider: StorageProvider;
}

export interface DocumentUploadRequest {
  contractCode: string;
  supplierName: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  fileData?: Blob | ArrayBuffer | string;
  category: 'minuta' | 'aditivo' | 'certidao' | 'comprovante_icp';
  userEmail?: string;
}

export interface DocumentIntegrityVerification {
  isValid: boolean;
  computedHash: string;
  storedHash: string;
  certifiedAt: string;
  carimboTempoIcpBrasil: boolean;
  status: 'integro' | 'adulterado' | 'pendente';
}
