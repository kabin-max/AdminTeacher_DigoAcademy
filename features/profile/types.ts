export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  website?: string;
}

export interface StudentProfileView {
  name: string;
  email: string;
  bio: string;
  skills: string[];
}

export interface InstructorProfileView {
  name: string;
  email: string;
  headline: string;
  experience: string;
  portfolioUrl: string;
  social: SocialLinks;
  ratingAvg: number;
  totalStudents: number;
}
