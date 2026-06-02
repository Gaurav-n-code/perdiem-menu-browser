export type DayOfWeek =
  | "MON"
  | "TUE"
  | "WED"
  | "THU"
  | "FRI"
  | "SAT"
  | "SUN";

export type AvailabilityRule = {
  days: DayOfWeek[];
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
};

export const categoryAvailability: Record<
  string,
  AvailabilityRule
> = {
  Breakfast: {
    days: ["MON", "TUE", "WED", "THU", "FRI"],
    startTime: "00:00",
    endTime: "11:00",
  },

  Drinks: {
    days: [
      "MON","TUE","WED","THU","FRI","SAT","SUN"
    ],
    startTime: "00:00",
    endTime: "23:59",
  },

  Desserts: {
    days: ["SAT", "SUN"],
    startTime: "12:00",
    endTime: "23:59",
  },
};