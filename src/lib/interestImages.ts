import gaming from '@/assets/interest-gaming.jpg.asset.json';
import creative from '@/assets/interest-creative.jpg.asset.json';
import music from '@/assets/interest-music.jpg.asset.json';
import education from '@/assets/interest-education.jpg.asset.json';
import irl from '@/assets/interest-irl.jpg.asset.json';
import chatting from '@/assets/interest-just-chatting.jpg.asset.json';
import podcast from '@/assets/interest-podcast.jpg.asset.json';
import sports from '@/assets/interest-sports.jpg.asset.json';

export const interestImages: Record<string, string> = {
  gaming: gaming.url,
  creative: creative.url,
  music: music.url,
  education: education.url,
  irl: irl.url,
  'just-chatting': chatting.url,
  podcast: podcast.url,
  sports: sports.url,
};