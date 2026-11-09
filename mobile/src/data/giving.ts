/** Giving accounts, copied from the website's src/app/give/page.tsx. Keep in sync. */
export interface GivingOption {
  id: string;
  title: string;
  description: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  logo: string;
  note?: string;
}

export const GIVING_OPTIONS: GivingOption[] = [
  {
    id: "general",
    title: "Tithes & Offerings",
    description: "General support for church operations",
    accountName: "Life in the Spirit Ministry Ikorodu.",
    bankName: "ZENITH BANK",
    accountNumber: "1014942555",
    logo: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247836/nlwc-ikd-assets/y87kx4xhn3ul7g8ftyac.png",
    note: "Please include the purpose (e.g. Tithe, Offering, SOTS) in the description.",
  },
  {
    id: "project",
    title: "Church Project 🌱",
    description: "Sow a seed towards the building project",
    accountName: "Life in the Spirit Ministry IKD-PRJT",
    bankName: "ZENITH BANK",
    accountNumber: "1227683067",
    logo: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774247836/nlwc-ikd-assets/y87kx4xhn3ul7g8ftyac.png",
  },
  {
    id: "welfare",
    title: "Welfare Offering",
    description: "Supporting those in need in our community",
    accountName: "Olayinka Esther Olanrewaju",
    bankName: "Sterling",
    accountNumber: "0062575473",
    logo: "https://res.cloudinary.com/dj7rh8h6r/image/upload/v1774721547/Sterling-Bank-logo_gph1d2.webp",
    note: "Please kindly indicate 'Welfare' when making the transfer.",
  },
];
