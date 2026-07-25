export interface Certification {
  id: string;
  name: string;
  logo: string;
  category: "Lab" | "Food" | "Manufacturing" | "Cosmetic";
  description: string;
}

export const certifications: Certification[] = [
  {
    id: "cert-001",
    name: "Informed Choice",
    logo: "/images/certifications/informed-choice.webp",
    category: "Lab",
    description: "Batch-tested for banned substances.",
  },
  {
    id: "cert-002",
    name: "Informed Sport",
    logo: "/images/certifications/informed-sport.webp",
    category: "Lab",
    description: "Sports supplement testing program.",
  },
  {
    id: "cert-003",
    name: "NSF Certified",
    logo: "/images/certifications/nsf.webp",
    category: "Lab",
    description: "Independent product testing.",
  },
  {
    id: "cert-004",
    name: "Creapure",
    logo: "/images/certifications/creapure.webp",
    category: "Lab",
    description: "German premium creatine certification.",
  },
  {
    id: "cert-005",
    name: "Labdoor",
    logo: "/images/certifications/labdoor.webp",
    category: "Lab",
    description: "Independent supplement quality verification.",
  },
  {
    id: "cert-006",
    name: "GMP",
    logo: "/images/certifications/gmp.webp",
    category: "Manufacturing",
    description: "Good Manufacturing Practices.",
  },
  {
    id: "cert-007",
    name: "ISO 9001",
    logo: "/images/certifications/iso9001.webp",
    category: "Manufacturing",
    description: "Quality management certification.",
  },
  {
    id: "cert-008",
    name: "FSSAI",
    logo: "/images/certifications/fssai.webp",
    category: "Food",
    description: "Food Safety and Standards Authority of India.",
  },
  {
    id: "cert-009",
    name: "IFOS",
    logo: "/images/certifications/ifos.webp",
    category: "Lab",
    description: "International Fish Oil Standards.",
  },
  {
    id: "cert-010",
    name: "Dermatologically Tested",
    logo: "/images/certifications/dermatologically-tested.webp",
    category: "Cosmetic",
    description: "Skin compatibility tested.",
  },
  {
    id: "cert-011",
    name: "USP Verified",
    logo: "/images/certifications/usp.webp",
    category: "Lab",
    description: "United States Pharmacopeia quality standard.",
  },
  {
    id: "cert-012",
    name: "ISO 22716",
    logo: "/images/certifications/iso22716.webp",
    category: "Cosmetic",
    description: "Good Manufacturing Practices for cosmetics.",
  },
  {
    id: "cert-013",
    name: "Cruelty Free",
    logo: "/images/certifications/cruelty-free.webp",
    category: "Cosmetic",
    description: "Not tested on animals.",
  },
  {
    id: "cert-014",
    name: "Vegan Certified",
    logo: "/images/certifications/vegan.webp",
    category: "Food",
    description: "Free from animal-derived ingredients.",
  },
  {
    id: "cert-015",
    name: "Organic Certified",
    logo: "/images/certifications/organic.webp",
    category: "Food",
    description: "Certified organic ingredients.",
  },
];