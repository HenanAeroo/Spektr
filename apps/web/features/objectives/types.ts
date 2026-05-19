export type Objective = {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  promoId: number;
  done?: boolean;
};

export type ObjectiveWithCompletions = {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  promoId: number;
  promo?: { id: number; name: string };
  completions: Array<{
    done: boolean;
    user: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string;
      promoId: number | null;
    };
  }>;
};
