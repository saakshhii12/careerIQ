export interface StudentProfile {
  fullName: string;
  email: string;
  phone: string;
  collegeName?: string;
  degree?: string;
  specialization?: string;
  graduationYear?: number;
  city?: string;
  skills?: string[];
  photoUrl?: string;
  hasVerificationPhoto?: boolean;
}
