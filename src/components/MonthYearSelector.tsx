import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface MonthYearSelectorProps {
	selectedYear: string;
	selectedMonth: string;
	onYearChange: (year: string) => void;
	onMonthChange: (month: string) => void;
	yearOptionsCount?: number; // Number of years to show (default: 11, current + 10 back)
}

export function MonthYearSelector({
	selectedYear,
	selectedMonth,
	onYearChange,
	onMonthChange,
	yearOptionsCount = 11,
}: MonthYearSelectorProps) {
	// Generate month options (1-12)
	const getMonthOptions = () => {
		const monthNames = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		return monthNames.map((name, index) => ({
			value: String(index + 1).padStart(2, "0"),
			label: name,
		}));
	};

	// Generate year options (current year and N years back)
	const getYearOptions = () => {
		const options: Array<{ value: string; label: string }> = [];
		const now = new Date();
		const currentYear = now.getFullYear();

		// Add current year and N years back
		for (let i = 0; i < yearOptionsCount; i++) {
			const year = currentYear - i;
			options.push({ value: year.toString(), label: year.toString() });
		}

		return options;
	};

	const monthOptions = getMonthOptions();
	const yearOptions = getYearOptions();

	return (
		<div className="flex items-center gap-2">
			<Select value={selectedMonth} onValueChange={onMonthChange}>
				<SelectTrigger className="w-[140px]">
					<SelectValue placeholder="Select month" />
				</SelectTrigger>
				<SelectContent>
					{monthOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={selectedYear} onValueChange={onYearChange}>
				<SelectTrigger className="w-[100px]">
					<SelectValue placeholder="Select year" />
				</SelectTrigger>
				<SelectContent>
					{yearOptions.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
