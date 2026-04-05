import type { SVGProps } from 'react';
import { Star, Activity, Trophy, Wallet } from 'lucide-react';

type IconProps = SVGProps<SVGSVGElement>;

export function StarIcon(props: IconProps) {
  return <Star {...props} />;
}

export function ActivityIcon(props: IconProps) {
  return <Activity {...props} />;
}

export function TrophyIcon(props: IconProps) {
  return <Trophy {...props} />;
}

export function WalletIcon(props: IconProps) {
  return <Wallet {...props} />;
}
