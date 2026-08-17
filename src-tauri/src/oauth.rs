//! Loopback redirect catcher for desktop OAuth 2.0 PKCE flows (Google
//! Calendar, Spotify — see src/integrations/oauth/pkce.ts). The frontend
//! opens the system browser at the provider's consent screen with
//! `redirect_uri=http://127.0.0.1:<port>/callback`; this command binds that
//! exact port, waits for the one incoming request, and hands the raw query
//! string (containing `code` and `state`) back to the frontend, which does
//! the actual PKCE token exchange over `fetch`.
//!
//! Std-only (no extra HTTP crate) — this only ever needs to read one
//! request line and write one canned response.

use std::io::{Read, Write};
use std::net::TcpListener;
use std::time::{Duration, Instant};

const TIMEOUT: Duration = Duration::from_secs(300);
const POLL_INTERVAL: Duration = Duration::from_millis(200);

#[tauri::command]
pub async fn oauth_await_redirect(port: u16) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let listener = TcpListener::bind(("127.0.0.1", port))
            .map_err(|e| format!("failed to bind loopback port {port}: {e}"))?;
        listener.set_nonblocking(true).map_err(|e| e.to_string())?;

        let deadline = Instant::now() + TIMEOUT;
        let (mut stream, _) = loop {
            match listener.accept() {
                Ok(conn) => break conn,
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    if Instant::now() > deadline {
                        return Err("timed out waiting for sign-in".to_string());
                    }
                    std::thread::sleep(POLL_INTERVAL);
                }
                Err(e) => return Err(e.to_string()),
            }
        };
        stream.set_nonblocking(false).ok();

        let mut buf = [0u8; 8192];
        let n = stream.read(&mut buf).map_err(|e| e.to_string())?;
        let request = String::from_utf8_lossy(&buf[..n]);
        let request_line = request.lines().next().unwrap_or("");
        let path_and_query = request_line.split_whitespace().nth(1).unwrap_or("/");
        let query = path_and_query.splitn(2, '?').nth(1).unwrap_or("").to_string();

        let body = "<html><body style=\"font-family:sans-serif;text-align:center;padding-top:4rem\">\
            <h2>Nanobox</h2><p>Signed in — you can close this window and return to the app.</p>\
            </body></html>";
        let response = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
            body.len(),
            body
        );
        let _ = stream.write_all(response.as_bytes());

        Ok(query)
    })
    .await
    .map_err(|e| format!("oauth listener task panicked: {e}"))?
}
