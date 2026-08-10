export type Profile = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  is_archived: boolean;
  is_house_tasks_admin: boolean;
  has_spend_tracker_access: boolean;
  has_mini_breaks_access: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  created_at: string;
};

export type Meal = {
  id: string;
  name: string;
  servings: number | null;
  recipe_body: string | null;
  notes: string | null;
  image_url: string | null;
  owner_id: string;
  category_id: string | null;
  is_weekly_meal: boolean;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Ingredient = {
  id: string;
  meal_id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  sort_order: number;
};

export type VotingCycleStatus = "draft" | "live" | "closed";

export type VotingCycle = {
  id: string;
  status: VotingCycleStatus;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
  closed_at: string | null;
};

export type ShortlistEntry = {
  id: string;
  voting_cycle_id: string;
  meal_id: string;
};

export type Vote = {
  id: string;
  voting_cycle_id: string;
  voter_id: string;
  meal_id: string;
  created_at: string;
};

export type ShoppingChecklistItem = {
  id: string;
  voting_cycle_id: string;
  ingredient_id: string;
  checked: boolean;
};

export type RecurrenceUnit = "days" | "weeks" | "months";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  points_approved: boolean;
  created_by: string;
  assigned_to: string;
  due_date: string | null;
  due_time: string | null;
  recurrence_unit: RecurrenceUnit | null;
  recurrence_value: number | null;
  is_active: boolean;
  completed_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
};

export type TaskCompletion = {
  id: string;
  task_id: string;
  completed_by: string;
  points: number;
  completed_at: string;
};

export type SpendCategory = {
  id: string;
  name: string;
  created_at: string;
};

export type Vendor = {
  id: string;
  name: string;
  created_at: string;
};

export type SpendTransaction = {
  id: string;
  date: string;
  vendor_id: string;
  category_id: string | null;
  amount: number;
  spent_by: string;
  notes: string | null;
  created_at: string;
};

export type WatchCategory = "film" | "tv_show";

export type WatchListItem = {
  id: string;
  title: string;
  category: WatchCategory;
  platform: string;
  submitted_by: string;
  is_watching: boolean;
  watched: boolean;
  watched_at: string | null;
  created_at: string;
};

export type SpendBudget = {
  id: string;
  category_id: string;
  month: string;
  amount: number;
  created_at: string;
};

export type MiniBreak = {
  id: string;
  title: string;
  date_from: string | null;
  date_to: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type MiniBreakUrlCategory = {
  id: string;
  name: string;
  created_at: string;
};

export type MiniBreakUrl = {
  id: string;
  mini_break_id: string;
  category_id: string | null;
  url: string;
  created_at: string;
};

export type MiniBreakFile = {
  id: string;
  mini_break_id: string;
  file_path: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
};

export type DiyTask = {
  id: string;
  title: string;
  project: string | null;
  notes: string | null;
  hours_estimate: number | null;
  percent_complete: number;
  completed_at: string | null;
  created_by: string;
  created_at: string;
};
