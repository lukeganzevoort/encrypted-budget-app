import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from "@/lib/category-icons";

interface IconColorPickerProps {
	icon: string;
	color: string;
	onIconChange: (icon: string) => void;
	onColorChange: (color: string) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	triggerClassName?: string;
}

export function IconColorPicker({
	icon,
	color,
	onIconChange,
	onColorChange,
	open,
	onOpenChange,
	triggerClassName,
}: IconColorPickerProps) {
	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					className={triggerClassName || "h-12 w-12 p-0 m-0 rounded-full"}
				>
					<CategoryIcon
						icon={icon}
						color={color}
						size={20}
						className="size-5"
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="start">
				<div className="mb-4">
					<h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
						Select Color
					</h4>
					<div className="grid grid-cols-8 gap-1">
						{AVAILABLE_COLORS.map((colorOption) => (
							<button
								key={colorOption.value}
								type="button"
								onClick={() => onColorChange(colorOption.value)}
								className={`h-8 rounded transition-all ${
									color === colorOption.value
										? "ring-2 ring-gray-800 ring-offset-1"
										: "hover:scale-105"
								}`}
								style={{ backgroundColor: colorOption.value }}
								title={colorOption.name}
							/>
						))}
					</div>
				</div>
				<div className="border-t pt-4">
					<h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
						Select Icon
					</h4>
					<div className="grid grid-cols-5 gap-2">
						{Object.entries(AVAILABLE_ICONS).map(([name, Icon]) => (
							<Button
								key={name}
								variant="ghost"
								size="icon"
								onClick={() => onIconChange(name)}
								className={`hover:bg-gray-100 rounded p-2 transition-colors ${
									icon === name ? "bg-gray-200 ring-2 ring-gray-500" : ""
								}`}
								title={name}
							>
								<Icon size={20} />
							</Button>
						))}
					</div>
				</div>
				<div className="mt-4 pt-3 border-t flex justify-end">
					<Button
						size="sm"
						variant="outline"
						onClick={() => onOpenChange?.(false)}
					>
						Done
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
