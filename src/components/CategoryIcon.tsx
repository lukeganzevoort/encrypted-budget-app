import { DEFAULT_COLOR, getIcon } from "@/lib/category-icons";

interface CategoryIconProps {
	icon: string;
	color: string;
	size?: number;
	className?: string;
}

export function CategoryIcon({
	icon,
	color,
	size = 20,
	className,
}: CategoryIconProps) {
	const IconComponent = getIcon(icon);
	const iconColor = color || DEFAULT_COLOR;

	return (
		<IconComponent
			style={{ color: iconColor }}
			size={size}
			className={className}
		/>
	);
}
