// Package realtime — WebRTC SFU-lite signaling helpers.
//
// For v1 we use mesh topology: clients exchange SDP offers/answers via the
// Socket.IO "webrtc:signal" event. This file holds a Pion-based selective
// forwarding fallback for rooms >8 peers (future work).
package realtime

import (
	"github.com/pion/webrtc/v4"
)

// DefaultRTCConfig returns the ICE config clients should mirror.
// Override TURN creds via env in production.
func DefaultRTCConfig() webrtc.Configuration {
	return webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
		BundlePolicy: webrtc.BundlePolicyMaxBundle,
	}
}
