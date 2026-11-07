"""
Inference adapter boundary.

Connect a properly licensed, consent-based GPU inference service here.
Do not return fabricated "processed" media. Until an engine is configured,
the API reports that live processing is unavailable.
"""

class EngineNotConfigured(RuntimeError):
    pass

class AvatarEngine:
    def status(self) -> dict:
        return {
            "configured": False,
            "capabilities": ["voice-conversion", "face-animation", "lip-sync"],
            "message": "No GPU inference engine is configured yet."
        }

    async def process_audio_chunk(self, session_id: str, audio_chunk: bytes) -> bytes:
        raise EngineNotConfigured("Configure a consent-based real-time voice engine first.")

engine = AvatarEngine()
