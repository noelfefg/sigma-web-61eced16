/**
 * useWebRTC — handles both broadcaster (GoLive) and viewer (Watch) WebRTC flows.
 * Uses Supabase Realtime as the signalling channel.
 *
 * BROADCASTER: call startBroadcast(streamId) → returns local MediaStream
 * VIEWER:      call joinStream(streamId)      → remoteStream state becomes non-null
 */
import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useWebRTC(role: 'broadcaster' | 'viewer') {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connected, setConnected] = useState(false);

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    localStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setConnected(false);
  }, [localStream]);

  /** BROADCASTER: acquire camera, create offer, send via Supabase Realtime */
  const startBroadcast = useCallback(async (streamId: string, quality: '360p'|'480p'|'720p'|'1080p' = '720p') => {
    cleanup();
    const qMap = { '360p': [640,360], '480p':[854,480], '720p':[1280,720], '1080p':[1920,1080] };
    const [w, h] = qMap[quality];

    const media = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: 30 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    setLocalStream(media);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    media.getTracks().forEach(t => pc.addTrack(t, media));

    const channel = supabase.channel(`webrtc:${streamId}`);
    channelRef.current = channel;

    // Send ICE candidates to viewers
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) channel.send({ type: 'broadcast', event: 'ice', payload: { from: 'broadcaster', candidate } });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setConnected(true);
      if (['failed','disconnected','closed'].includes(pc.connectionState)) setConnected(false);
    };

    // Answer viewer offers
    channel.on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
      if (payload.from !== 'viewer') return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channel.send({ type: 'broadcast', event: 'answer', payload: { from: 'broadcaster', sdp: pc.localDescription } });
    });

    channel.on('broadcast', { event: 'ice' }, async ({ payload }: any) => {
      if (payload.from === 'viewer' && payload.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
      }
    });

    await channel.subscribe();
    return media;
  }, [cleanup]);

  /** VIEWER: subscribe, send offer, get answer + remote stream */
  const joinStream = useCallback(async (streamId: string) => {
    cleanup();
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    const remote = new MediaStream();
    pc.ontrack = ({ track }) => { remote.addTrack(track); setRemoteStream(remote); };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) channelRef.current?.send({ type: 'broadcast', event: 'ice', payload: { from: 'viewer', candidate } });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setConnected(true);
    };

    const channel = supabase.channel(`webrtc:${streamId}`);
    channelRef.current = channel;

    channel.on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
      if (payload.from !== 'broadcaster') return;
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    channel.on('broadcast', { event: 'ice' }, async ({ payload }: any) => {
      if (payload.from === 'broadcaster' && payload.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)); } catch {}
      }
    });

    await channel.subscribe();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    channel.send({ type: 'broadcast', event: 'offer', payload: { from: 'viewer', sdp: pc.localDescription } });
  }, [cleanup]);

  return { localStream, remoteStream, connected, startBroadcast, joinStream, cleanup };
}
