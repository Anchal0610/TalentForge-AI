export class ImageKitService {
  private publicKey: string;
  private privateKey: string;
  private urlEndpoint: string;
  private enabled = false;

  constructor() {
    this.publicKey = (process.env.IMAGEKIT_PUBLIC_KEY || '').trim();
    this.privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
    this.urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT || '').trim();

    if (this.privateKey && this.privateKey !== 'your_private_key_here') {
      this.enabled = true;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async uploadPdf(fileBuffer: Buffer, filename: string): Promise<string | null> {
    if (!this.enabled) {
      console.warn('ImageKit upload bypassed because the service is disabled (missing credentials).');
      return null;
    }

    try {
      const uploadUrl = 'https://upload.imagekit.io/api/v1/files/upload';
      const formData = new FormData();
      
      const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
      formData.append('file', blob, filename);
      formData.append('fileName', filename);
      formData.append('useUniqueFileName', 'true');

      // Basic Auth: private key as username, empty password
      const authHeader = 'Basic ' + Buffer.from(this.privateKey + ':').toString('base64');

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`ImageKit upload failed with status ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log(`Successfully uploaded file ${filename} to ImageKit: ${result.url}`);
      return result.url || null;
    } catch (err) {
      console.error('Error occurred during ImageKit file upload:', err);
      return null;
    }
  }
}

export const imagekitService = new ImageKitService();
