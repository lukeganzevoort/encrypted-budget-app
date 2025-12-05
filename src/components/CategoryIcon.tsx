import type { LucideIcon } from "lucide-react";
import {
	AVAILABLE_ICONS,
	DEFAULT_COLOR,
	DEFAULT_ICON,
} from "@/lib/category-icons";

interface CategoryIconProps {
	icon?: string;
	color?: string;
	size?: number;
	className?: string;
}

export function CategoryIcon({
	icon,
	color,
	size = 20,
	className,
}: CategoryIconProps) {
	const IconComponent: LucideIcon =
		AVAILABLE_ICONS[icon || DEFAULT_ICON] || AVAILABLE_ICONS[DEFAULT_ICON];
	const iconColor = color || DEFAULT_COLOR;

	return (
		<IconComponent
			style={{ color: iconColor }}
			size={size}
			className={className}
		/>
	);
}
