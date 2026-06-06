/**
 * Icon — unified icon wrapper backed by Iconify.
 *
 * Iconify gives us free access to Flaticon-style icon packs (Solar, Mage,
 * Fluent, Material Symbols, Tabler, Phosphor, etc.) via a single component.
 *
 * Usage:
 *   <Icon icon="solar:home-bold" />
 *   <Icon icon="mage:chat-fill" size={20} />
 *   <Icon icon="ph:trophy-duotone" className="text-primary" />
 *
 * Browse packs at https://icon-sets.iconify.design/
 *
 * Prefer Iconify for all NEW components. Existing lucide-react icons can
 * stay until they get refactored.
 */
import { Icon as IconifyIcon, type IconProps as IconifyProps } from "@iconify/react";
import { cn } from "@/lib/utils";

export interface IconProps extends Omit<IconifyProps, "icon"> {
  icon: string;
  size?: number | string;
  className?: string;
}

export function Icon({ icon, size = 20, className, ...rest }: IconProps) {
  return (
    <IconifyIcon
      icon={icon}
      width={size}
      height={size}
      className={cn("inline-block shrink-0", className)}
      {...rest}
    />
  );
}

// Curated brand-set: stick to these for visual consistency across SIGMA.
export const SIGMA_ICONS = {
  home: "solar:home-2-bold-duotone",
  search: "solar:magnifer-bold-duotone",
  bell: "solar:bell-bing-bold-duotone",
  message: "solar:chat-round-dots-bold-duotone",
  gift: "solar:gift-bold-duotone",
  coin: "solar:dollar-minimalistic-bold-duotone",
  clan: "solar:users-group-rounded-bold-duotone",
  war: "mage:sword-fill",
  trophy: "solar:cup-star-bold-duotone",
  liveDot: "solar:videocamera-record-bold-duotone",
  shorts: "solar:play-circle-bold-duotone",
  upload: "solar:upload-square-bold-duotone",
  settings: "solar:settings-bold-duotone",
  logout: "solar:logout-2-bold-duotone",
  fire: "solar:fire-bold-duotone",
  star: "solar:star-bold-duotone",
  shield: "solar:shield-bold-duotone",
  crown: "solar:crown-star-bold-duotone",
} as const;

export type SigmaIconName = keyof typeof SIGMA_ICONS;
