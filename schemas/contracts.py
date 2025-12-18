"""Schema definitions for contracts."""

from dataclasses import dataclass


@dataclass
class Contract:
    """Contract data schema."""
    
    name: str
    content: str
