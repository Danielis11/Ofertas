from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseExtractor(ABC):
    """Abstract Base Class for store-specific data extraction."""

    @abstractmethod
    def extract_items(self, response) -> List[Dict[str, Any]]:
        """Extract a list of raw product offer dictionaries from the Scrapy response."""
        pass
