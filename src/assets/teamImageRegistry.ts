import guideImg from './team/guide.jpg';
import bhumikaImg from './team/founder-1.jpg';
import lipiImg from './team/founder-2.jpg';
import shrutiImg from './team/founder-3.jpg';
import gaureshImg from './team/founder-4.jpg';
import contributorImg from './team/contributor.jpg';

export const TEAM_IMAGE_MAP: Record<string, string> = {
  guide: guideImg,
  'founder-1': bhumikaImg,
  'founder-2': lipiImg,
  'founder-3': shrutiImg,
  'founder-4': gaureshImg,
  contributor: contributorImg,
};

export function getTeamMemberPhoto(memberId: string, fallbackUrl?: string): string {
  return TEAM_IMAGE_MAP[memberId] || fallbackUrl || guideImg;
}
