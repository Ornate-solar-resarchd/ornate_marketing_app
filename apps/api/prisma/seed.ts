import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed Categories
  const aboutOrnate = await prisma.category.upsert({
    where: { slug: "about-ornate-solar" },
    update: { label: "About Ornate Solar", icon: "🏢", order: 0 },
    create: {
      slug: "about-ornate-solar",
      label: "About Ornate Solar",
      icon: "🏢",
      order: 0,
    },
  });

  const unityCategory = await prisma.category.upsert({
    where: { slug: "unityess" },
    update: { label: "UnityESS", icon: "⚡", order: 1 },
    create: {
      slug: "unityess",
      label: "UnityESS",
      icon: "⚡",
      order: 1,
    },
  });

  const inroofCategory = await prisma.category.upsert({
    where: { slug: "ornate-inroof" },
    update: { label: "Ornate Inroof", icon: "🏠", order: 2 },
    create: {
      slug: "ornate-inroof",
      label: "Ornate Inroof",
      icon: "🏠",
      order: 2,
    },
  });

  const ornateProducts = await prisma.category.upsert({
    where: { slug: "ornate-products" },
    update: { order: 3 },
    create: {
      slug: "ornate-products",
      label: "Ornate Solar Products",
      icon: "☀️",
      order: 3,
    },
  });

  const panels = await prisma.category.upsert({
    where: { slug: "panels" },
    update: { order: 4 },
    create: {
      slug: "panels",
      label: "Panels",
      icon: "🔆",
      order: 4,
    },
  });

  const inverters = await prisma.category.upsert({
    where: { slug: "inverters" },
    update: { order: 5 },
    create: {
      slug: "inverters",
      label: "Inverters",
      icon: "🔋",
      order: 5,
    },
  });

  // About Ornate Solar — company brochures, general marketing
  const aboutCompanies = [
    {
      slug: "ornate-solar-company",
      label: "Ornate Solar",
      icon: "🏢",
      color: "#E8611A",
      logoUrl: "https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: [
        "brochure",
        "datasheet",
        "images",
        "videos",
        "ppt",
        "email",
        "compliance",
        "casestudy",
      ],
    },
  ];

  // UnityESS — standalone category
  const unityCompanies = [
    {
      slug: "bess",
      label: "UnityESS",
      icon: "⚡",
      color: "#006297",
      logoUrl: "https://i.ibb.co/Dsj1LM1/Whats-App-Image-2026-03-16-at-3-56-12-PM.jpg",
      websiteUrl: "https://ornatesolar.com",
      docTypes: [
        "brochure",
        "datasheet",
        "images",
        "videos",
        "ppt",
        "email",
        "compliance",
        "casestudy",
      ],
    },
  ];

  // Ornate Inroof — standalone category
  const inroofCompanies = [
    {
      slug: "inroof",
      label: "Ornate Inroof",
      icon: "🏠",
      color: "#E8611A",
      logoUrl: "https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: [
        "brochure",
        "datasheet",
        "images",
        "installation",
        "ppt",
        "email",
      ],
    },
  ];

  // Ornate Products (without UnityESS and Inroof)
  const ornateCompanies = [
    {
      slug: "kusum",
      label: "Kusum",
      icon: "🌾",
      color: "#16A34A",
      logoUrl: "https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: ["brochure", "datasheet", "images", "scheme", "ppt", "email"],
    },
    {
      slug: "ornateassured",
      label: "Ornate Assured",
      icon: "🛡️",
      color: "#7C3AED",
      logoUrl: "https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: ["brochure", "images", "warranty", "ppt", "email", "casestudy"],
    },
    {
      slug: "ojas",
      label: "Ojas",
      icon: "🏗️",
      color: "#B45309",
      logoUrl: "https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: ["brochure", "datasheet", "images", "structural", "ppt", "email"],
    },
    {
      slug: "agripv",
      label: "AgriPV",
      icon: "🌱",
      color: "#15803D",
      logoUrl: "https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: ["brochure", "datasheet", "images", "videos", "casestudy", "ppt", "email"],
    },
    {
      slug: "solarcarport",
      label: "Solar Carport",
      icon: "🚗",
      color: "#0369A1",
      logoUrl: "https://i.ibb.co/MygcTBxJ/Ornate-Logo-1.png",
      websiteUrl: "https://ornatesolar.com",
      docTypes: ["brochure", "datasheet", "images", "structural", "casestudy", "ppt", "email"],
    },
  ];

  // Panels
  const panelCompanies = [
    {
      slug: "firstsolar",
      label: "First Solar",
      icon: "☀️",
      color: "#F59E0B",
      logoUrl: "https://ornatesolar.com/wp-content/uploads/2025/11/First-Solar-Logo.png",
      websiteUrl: "https://www.firstsolar.com",
      docTypes: ["brochure", "datasheet", "images", "warranty", "ppt", "pricing"],
    },
    {
      slug: "renewsys",
      label: "Renewsys",
      icon: "☀️",
      color: "#DC2626",
      logoUrl: "https://ornatesolar.com/wp-content/uploads/2020/08/Renewsys-Logo.png",
      websiteUrl: "https://www.renewsys.com",
      docTypes: ["brochure", "datasheet", "images", "warranty", "ppt", "pricing", "email"],
    },
    {
      slug: "canadiansolar",
      label: "Canadian Solar",
      icon: "🍁",
      color: "#991B1B",
      logoUrl: "https://ornatesolar.com/wp-content/uploads/2020/09/Canadian-Solar-India.png",
      websiteUrl: "https://www.canadiansolar.com",
      docTypes: ["brochure", "datasheet", "images", "warranty", "ppt", "pricing", "compliance"],
    },
  ];

  // Inverters
  const inverterCompanies = [
    {
      slug: "hopewind",
      label: "Hopewind",
      icon: "🔋",
      color: "#10B981",
      logoUrl: "https://ornatesolar.com/wp-content/uploads/2025/03/Hopewind-logo.png",
      websiteUrl: "https://www.hopewind.com",
      docTypes: ["brochure", "datasheet", "images", "videos", "ppt", "approval", "email"],
    },
    {
      slug: "solaredge",
      label: "SolarEdge",
      icon: "⚙️",
      color: "#1D4ED8",
      logoUrl: "https://i.ibb.co/0yVq9ZkF/Whats-App-Image-2026-03-17-at-12-46-01-PM.jpg",
      websiteUrl: "https://www.solaredge.com",
      docTypes: ["brochure", "datasheet", "images", "installation", "approval", "ppt", "pricing"],
    },
    {
      slug: "enphase",
      label: "Enphase",
      icon: "🔆",
      color: "#D97706",
      logoUrl: "https://ornatesolar.com/wp-content/uploads/2020/08/Enphase-LOgo.png",
      websiteUrl: "https://www.enphase.com",
      docTypes: ["brochure", "datasheet", "images", "installation", "approval", "ppt", "email"],
    },
    {
      slug: "fronius",
      label: "Fronius",
      icon: "🔌",
      color: "#C2410C",
      logoUrl: "https://ornatesolar.com/wp-content/uploads/2020/08/Fronius-Logo.png",
      websiteUrl: "https://www.fronius.com",
      docTypes: ["brochure", "datasheet", "images", "installation", "approval", "ppt", "pricing"],
    },
    {
      slug: "havells",
      label: "Havells",
      icon: "💡",
      color: "#7E22CE",
      logoUrl: "https://ornatesolar.com/wp-content/uploads/2022/04/Havells-Solar.webp",
      websiteUrl: "https://www.havells.com",
      docTypes: ["brochure", "datasheet", "images", "approval", "ppt", "pricing", "email"],
    },
  ];

  // Upsert all companies — move bess to UnityESS category, inroof to Inroof category
  for (const company of aboutCompanies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: { logoUrl: company.logoUrl, docTypes: company.docTypes, categoryId: aboutOrnate.id },
      create: { ...company, categoryId: aboutOrnate.id },
    });
  }

  for (const company of unityCompanies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: { logoUrl: company.logoUrl, docTypes: company.docTypes, categoryId: unityCategory.id },
      create: { ...company, categoryId: unityCategory.id },
    });
  }

  for (const company of inroofCompanies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: { logoUrl: company.logoUrl, docTypes: company.docTypes, categoryId: inroofCategory.id },
      create: { ...company, categoryId: inroofCategory.id },
    });
  }

  for (const company of ornateCompanies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: { logoUrl: company.logoUrl, docTypes: company.docTypes },
      create: { ...company, categoryId: ornateProducts.id },
    });
  }

  for (const company of panelCompanies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: { logoUrl: company.logoUrl, docTypes: company.docTypes },
      create: { ...company, categoryId: panels.id },
    });
  }

  for (const company of inverterCompanies) {
    await prisma.company.upsert({
      where: { slug: company.slug },
      update: { logoUrl: company.logoUrl, docTypes: company.docTypes },
      create: { ...company, categoryId: inverters.id },
    });
  }

  console.log("Seeded 6 categories and 16 companies successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
