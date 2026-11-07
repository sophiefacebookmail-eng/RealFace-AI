from pathlib import Path
from uuid import uuid4
import json

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .engine import engine, EngineNotConfigured

app = FastAPI(title=settings.app_name, version="0.1.0")

origins = [x.strip() for x in settings.allowed_origins.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

UPLOAD_ROOT = Path(settings.upload_dir).resolve()
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
AUDIO_TYPES = {"audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg"}

@app.get("/health")
async def health():
    return {"ok": True, "service": settings.app_name}

@app.get("/api/engine/status")
async def engine_status():
    return engine.status()

async def save_upload(file: UploadFile, allowed_types: set[str], folder: Path) -> dict:
    if file.content_type not in allowed_types:
        raise HTTPException(415, f"Unsupported file type: {file.content_type}")
    data = await file.read()
    if not data:
        raise HTTPException(400, "Uploaded file is empty.")
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"File exceeds {settings.max_upload_mb} MB limit.")
    suffix = Path(file.filename or "").suffix.lower()
    if not suffix:
        suffix = ".bin"
    stored_name = f"{uuid4().hex}{suffix}"
    destination = folder / stored_name
    destination.write_bytes(data)
    return {
        "stored_name": stored_name,
        "original_name": Path(file.filename or "upload").name,
        "content_type": file.content_type,
        "size_bytes": len(data),
    }

@app.post("/api/assets")
async def upload_assets(
    photo: UploadFile = File(...),
    voice: UploadFile = File(...),
    consent_confirmed: bool = Form(...),
    consent_scope: str = Form(...),
):
    if not consent_confirmed:
        raise HTTPException(400, "Consent acknowledgement is required.")
    if consent_scope not in {"self", "authorized_other"}:
        raise HTTPException(400, "Choose whether this is your own media or media used with explicit permission.")

    asset_id = uuid4().hex
    folder = UPLOAD_ROOT / asset_id
    folder.mkdir(parents=True, exist_ok=False)

    try:
        photo_info = await save_upload(photo, PHOTO_TYPES, folder)
        voice_info = await save_upload(voice, AUDIO_TYPES, folder)
    except Exception:
        # Remove partial upload if the second file fails.
        for item in folder.glob("*"):
            item.unlink(missing_ok=True)
        folder.rmdir()
        raise

    metadata = {
        "asset_id": asset_id,
        "consent_scope": consent_scope,
        "consent_acknowledged": True,
        "photo": photo_info,
        "voice": voice_info,
        "processing": "not_started",
        "note": "Assets uploaded. A compatible GPU inference engine must be configured before live processing."
    }
    (folder / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata

@app.websocket("/ws/audio/{session_id}")
async def audio_socket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    await websocket.send_json({
        "type": "status",
        "status": "engine_not_configured",
        "message": "Audio streaming endpoint is scaffolded; connect a consent-based GPU voice engine to enable conversion."
    })
    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break
            if message.get("bytes") is not None:
                await websocket.send_json({
                    "type": "error",
                    "code": "ENGINE_NOT_CONFIGURED",
                    "message": "Live voice conversion is not active."
                })
            elif message.get("text"):
                await websocket.send_json({"type": "ack", "session_id": session_id})
    except WebSocketDisconnect:
        pass
