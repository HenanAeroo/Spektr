export type UpdateProfileData = {
  first_name: string;
  last_name: string;
};

export type ProfileUser = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
};
