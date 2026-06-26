import os
import requests
from typing import Optional
from dotenv import load_dotenv
from utils.logger import logger

load_dotenv()

class ImageKitService:
    def __init__(self):
        self.public_key = os.getenv("IMAGEKIT_PUBLIC_KEY", "")
        self.private_key = os.getenv("IMAGEKIT_PRIVATE_KEY", "")
        self.url_endpoint = os.getenv("IMAGEKIT_URL_ENDPOINT", "")
        
        # Strip quotes if any
        if self.public_key:
            self.public_key = self.public_key.strip("'\"")
        if self.private_key:
            self.private_key = self.private_key.strip("'\"")
        if self.url_endpoint:
            self.url_endpoint = self.url_endpoint.strip("'\"")

        if not self.private_key or self.private_key == "your_private_key_here":
            logger.warning("IMAGEKIT_PRIVATE_KEY not configured. ImageKit service will not operate.")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("ImageKit service successfully initialized.")

    def is_enabled(self) -> bool:
        return self.enabled

    def upload_pdf(self, file_bytes: bytes, filename: str) -> Optional[str]:
        """
        Uploads a PDF file to ImageKit using direct requests.
        Returns the public URL of the uploaded file on success, or None on failure.
        """
        if not self.enabled:
            logger.warning("ImageKit upload bypassed because the service is disabled (missing credentials).")
            return None

        upload_url = "https://upload.imagekit.io/api/v1/files/upload"
        
        payload = {
            'fileName': filename,
            'useUniqueFileName': 'true'
        }
        
        files = {
            'file': (filename, file_bytes, 'application/pdf')
        }

        try:
            logger.info(f"Uploading file '{filename}' ({len(file_bytes)} bytes) to ImageKit...")
            # HTTP Basic Authentication: Username is private key, password is empty
            response = requests.post(
                upload_url,
                data=payload,
                files=files,
                auth=(self.private_key, '')
            )
            
            if response.status_code == 200:
                result = response.json()
                file_url = result.get("url")
                logger.info(f"Successfully uploaded '{filename}' to ImageKit. URL: {file_url}")
                return file_url
            else:
                logger.error(f"ImageKit upload failed with status code {response.status_code}: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error occurred during ImageKit file upload: {str(e)}")
            return None

# Global service instance
imagekit_service = ImageKitService()
