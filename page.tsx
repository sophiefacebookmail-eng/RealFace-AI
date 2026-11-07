"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [voice, setVoice] = useState<File | null>(null);
  const [scope, setScope] = useState("self");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setResult(null);
    if (!photo || !voice) return setMessage("Choose both a photo and a voice sample.");
    if (!consent) return setMessage("Confirm that you have the required permission.");

    const form = new FormData();
    form.append("photo", photo);
    form.append("voice", voice);
    form.append("consent_confirmed", "true");
    form.append("consent_scope", scope);

    setBusy(true);
    try {
      const response = await fetch(`${API}/api/assets`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed.");
      setResult(data);
      setMessage("Upload complete. Live generation is not enabled until a GPU engine is connected.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brandIcon">R</span> REALFACE <b>AI</b></a>
        <span className="badge">PRIVATE AVATAR STUDIO</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="dot" /> CONSENT-FIRST AI AVATAR WORKSPACE</div>
        <h1>Your identity.<br /><em>In real time.</em></h1>
        <p className="intro">Prepare an authorised face and voice profile for a lifelike avatar workflow. Your original appearance is the reference; processing engines can be connected after setup.</p>
      </section>

      <section className="grid">
        <form className="panel formPanel" onSubmit={submit}>
          <div className="panelHead"><div><span className="step">01 / PROFILE</span><h2>Create your profile</h2></div><span className="number">01</span></div>

          <label className="fieldLabel">PHOTO REFERENCE</label>
          <label className="uploadBox">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setPhoto(e.target.files?.[0] || null)} />
            <span className="uploadIcon">＋</span>
            <strong>{photo ? photo.name : "Upload a clear face photo"}</strong>
            <small>JPG, PNG or WEBP · Max 25 MB</small>
          </label>

          <label className="fieldLabel">VOICE REFERENCE</label>
          <label className="uploadBox">
            <input type="file" accept="audio/*" onChange={e => setVoice(e.target.files?.[0] || null)} />
            <span className="uploadIcon">♫</span>
            <strong>{voice ? voice.name : "Upload a voice sample"}</strong>
            <small>WAV, MP3, M4A, WEBM or OGG · Max 25 MB</small>
          </label>

          <label className="fieldLabel" htmlFor="scope">WHO DOES THIS MEDIA BELONG TO?</label>
          <select id="scope" value={scope} onChange={e => setScope(e.target.value)}>
            <option value="self">My own face and voice</option>
            <option value="authorized_other">Another person — I have their explicit permission</option>
          </select>

          <label className="consent">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
            <span>I confirm that I own these media files or have the person's informed permission to create an AI avatar and voice model. I will disclose AI-generated audio/video to call participants and will not use it for deception or impersonation.</span>
          </label>

          <button className="primary" disabled={busy}>{busy ? "Uploading…" : "Upload profile assets"} <span>↗</span></button>
          {message && <p className="message" role="status">{message}</p>}
          {result && <pre className="result">{JSON.stringify(result, null, 2)}</pre>}
        </form>

        <aside className="side">
          <div className="panel preview">
            <div className="panelHead"><div><span className="step">02 / LIVE STUDIO</span><h2>Avatar preview</h2></div><span className="liveTag">● OFFLINE</span></div>
            <div className="previewStage">
              <div className="scanRing"><div className="silhouette">◉</div></div>
              <strong>Awaiting inference engine</strong>
              <small>Your live avatar preview will appear here once a GPU animation engine is connected.</small>
            </div>
            <div className="statusRows">
              <div><span>Face animation</span><b>Not connected</b></div>
              <div><span>Voice conversion</span><b>Not connected</b></div>
              <div><span>Lip synchronisation</span><b>Not connected</b></div>
            </div>
          </div>
          <div className="notice"><span>✳</span><div><b>Designed for transparent use</b><p>Keep an AI-generated indicator visible and tell other call participants when synthetic face or voice output is active.</p></div></div>
        </aside>
      </section>
      <footer><span>REALFACE AI · EARLY ACCESS BUILD</span><span>SECURE BY DESIGN · CONSENT REQUIRED</span></footer>
    </main>
  );
}
