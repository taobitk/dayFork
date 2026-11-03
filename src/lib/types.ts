export interface Opportunity {
	id: string;
	date: string; // 'YYYY-MM-DD'
	title: string;
	time_minutes: number;
	money_amount: number;
	created_at: number;
}

export interface Branch {
	id: string;
	opportunity_id: string;
	name: string;
	cost_time: number;
	cost_money: number;
	outcome: string;
	is_chosen: number; // 0 | 1
	created_at: number;
}

export interface OpportunityWithBranches extends Opportunity {
	branches: Branch[];
}

export type Perspective = 'best' | 'comfort';

export interface AiBranchSelection {
	opportunity_id: string;
	branch_id: string;
	reflection: string;
}

export interface AiPath {
	id: string;
	date: string; // 'YYYY-MM-DD'
	perspective: Perspective;
	branch_selections: AiBranchSelection[];
	summary: string;
	created_at: number;
}

export interface DayData {
	date: string;
	opportunities: OpportunityWithBranches[];
	aiPaths: {
		best?: AiPath;
		comfort?: AiPath;
	};
}

export interface OpportunityComparison {
	opportunity: Opportunity;
	actualBranch?: Branch;
	bestBranch?: Branch;
	bestReflection?: string;
	comfortBranch?: Branch;
	comfortReflection?: string;
	remainingTime: number; // opportunity.time_minutes - actualBranch.cost_time
	remainingMoney: number; // opportunity.money_amount - actualBranch.cost_money
}

export interface DailySummaryItem {
	date: string;
	opportunityCount: number;
	chosenCount: number;
	bestMatchCount: number;
	comfortMatchCount: number;
}

export interface DivergentOpportunity {
	date: string;
	opportunityTitle: string;
	actualBranchName: string;
	bestBranchName: string;
	comfortBranchName: string;
}

export interface PeriodStats {
	startDate: string;
	endDate: string;
	totalDays: number;
	totalOpportunities: number;
	totalBranches: number;
	totalChosenCount: number;
	totalTimeAvailable: number;
	totalTimeSpent: number;
	totalMoneyAvailable: number;
	totalMoneySpent: number;
	bestMatchCount: number;
	bestMatchRate: number; // percentage 0..100
	comfortMatchCount: number;
	comfortMatchRate: number; // percentage 0..100
	divergentOpportunities: DivergentOpportunity[];
	dailyBreakdown: DailySummaryItem[];
}

