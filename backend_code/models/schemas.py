from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["ok"])
    timestamp: datetime


class AppInfoResponse(BaseModel):
    name: str
    version: str
    description: str
    features: list[str]


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    profile: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    reply: str
