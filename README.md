# Windows client — next integration stage

This folder is reserved for the Windows bridge that will expose an approved, visibly labelled avatar stream as a virtual camera and microphone.

Recommended implementation sequence:
1. Receive authenticated video/audio from the GPU inference service over WebRTC.
2. Render a persistent `AI-GENERATED` disclosure overlay into the video frames.
3. Publish frames through a supported virtual-camera interface (for example, OBS Virtual Camera or a Windows Media Foundation virtual camera).
4. Publish processed audio through a supported virtual-audio-device interface.
5. Let the user select those devices in Telegram Desktop, WhatsApp Desktop, Google Meet in a browser, and Zoom.

Do not claim compatibility until tested against each app version. This repository does not yet include a functioning virtual device driver.
