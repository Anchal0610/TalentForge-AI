from typing import List
from utils.logger import logger

class DocumentChunker:
    def __init__(self, chunk_size: int = 800, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        """Splits raw text into overlapping semantic passages."""
        if not text:
            return []
            
        logger.info(f"Splits text of length {len(text)} into chunks (Size={self.chunk_size}, Overlap={self.chunk_overlap})")
        
        # Simple recursive splitting approach
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_len = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            para_len = len(para)
            
            # If paragraph fits in current chunk, append it
            if current_len + para_len <= self.chunk_size:
                current_chunk.append(para)
                current_len += para_len + 2 # accounts for newline join
            else:
                # If current chunk is not empty, save it
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    
                # Handle large paragraphs by slicing them
                if para_len > self.chunk_size:
                    start = 0
                    while start < para_len:
                        end = start + self.chunk_size
                        chunks.append(para[start:end])
                        start += self.chunk_size - self.chunk_overlap
                    current_chunk = []
                    current_len = 0
                else:
                    current_chunk = [para]
                    current_len = para_len
                    
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))
            
        logger.info(f"Created {len(chunks)} text chunks.")
        return chunks

# Export instance
document_chunker = DocumentChunker()
