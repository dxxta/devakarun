import path from 'node:path'
import type { Payload } from 'payload'

import type { Certificate, Profile, Project, TechStack } from '../payload-types'

type TechStackSeed = Pick<TechStack, 'name' | 'category' | 'order'>
type ProjectSeed = Pick<
  Project,
  'title' | 'slug' | 'summary' | 'description' | 'techStack' | 'featured' | 'order' | 'source' | 'githubRepo' | 'repoUrl' | 'lockedFields'
>
type CertificateSeed = Pick<Certificate, 'title' | 'issuer' | 'issueDate' | 'order' | 'highlighted'> & {
  expiryDate?: string
  credentialUrl?: string
  imageFile: string
}
type RichTextNode = Record<string, unknown>

function textNode(text: string): RichTextNode {
  return { type: 'text', version: 1, detail: 0, format: 0, mode: 'normal', style: '', text }
}

function paragraph(text: string): RichTextNode {
  return {
    type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0,
    children: [textNode(text)],
  }
}

function heading(text: string): RichTextNode {
  return {
    type: 'heading', tag: 'h3', version: 1, direction: 'ltr', format: '', indent: 0,
    children: [textNode(text)],
  }
}

function bulletList(items: string[]): RichTextNode {
  return {
    type: 'list', listType: 'bullet', tag: 'ul', start: 1, version: 1,
    direction: 'ltr', format: '', indent: 0,
    children: items.map((text, index) => ({
      type: 'listitem', value: index + 1, version: 1, direction: 'ltr', format: '', indent: 0,
      children: [textNode(text)],
    })),
  }
}

function richText(nodes: RichTextNode[]): Profile['bio'] {
  return {
    root: {
      type: 'root', version: 1, direction: 'ltr', format: '', indent: 0,
      children: nodes,
    },
  } as Profile['bio']
}

function projectDescription(summary: string, year: number): Project['description'] {
  return richText([paragraph(summary), paragraph(String(year))]) as Project['description']
}

async function upsertTechStackItem(payload: Payload, data: TechStackSeed): Promise<TechStack> {
  const { docs } = await payload.find({
    collection: 'tech-stack', where: { name: { equals: data.name } },
    limit: 1, overrideAccess: true,
  })
  if (docs[0]) {
    return payload.update({ collection: 'tech-stack', id: docs[0].id, data, overrideAccess: true })
  }
  return payload.create({ collection: 'tech-stack', data, overrideAccess: true })
}

async function upsertCertificate(payload: Payload, certificate: CertificateSeed): Promise<void> {
  const media = await payload.find({
    collection: 'media',
    where: { filename: { equals: certificate.imageFile } },
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  })
  const image = media.docs[0] ?? await payload.create({
    collection: 'media',
    data: { alt: `${certificate.title} certificate` },
    filePath: path.join(process.cwd(), 'seed-assets', 'certificates', certificate.imageFile),
    overrideAccess: true,
  })
  const data = {
    title: certificate.title,
    issuer: certificate.issuer,
    issueDate: certificate.issueDate,
    expiryDate: certificate.expiryDate ?? null,
    credentialUrl: certificate.credentialUrl ?? null,
    image: image.id,
    order: certificate.order,
    highlighted: certificate.highlighted,
  }
  const existing = await payload.find({
    collection: 'certificates', where: { title: { equals: certificate.title } },
    limit: 1, overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.update({ collection: 'certificates', id: existing.docs[0].id, data, overrideAccess: true })
    return
  }
  await payload.create({ collection: 'certificates', data, overrideAccess: true })
}

async function upsertProject(payload: Payload, data: ProjectSeed): Promise<void> {
  const existing = await payload.find({
    collection: 'projects', where: { slug: { equals: data.slug } },
    limit: 1, overrideAccess: true,
  })
  if (existing.docs[0]) {
    const updateData: Partial<ProjectSeed> = data.source === 'github' && !data.lockedFields?.length
      ? {
        githubRepo: data.githubRepo,
        repoUrl: data.repoUrl,
        source: data.source,
        lockedFields: data.lockedFields,
        featured: data.featured,
        order: data.order,
      }
      : data
    await payload.update({ collection: 'projects', id: existing.docs[0].id, data: updateData, overrideAccess: true })
    return
  }
  await payload.create({ collection: 'projects', data, overrideAccess: true })
}

async function deleteByField<K extends 'tech-stack' | 'certificates'>(
  payload: Payload,
  collection: K,
  field: K extends 'tech-stack' ? 'name' : 'title',
  values: string[],
): Promise<void> {
  for (const value of values) {
    const { docs } = await payload.find({
      collection,
      where: { [field]: { equals: value } },
      limit: 1000,
      overrideAccess: true,
    } as never)
    for (const document of docs) {
      await payload.delete({ collection, id: document.id, overrideAccess: true })
    }
  }
}

const techSeeds: TechStackSeed[] = [
  { name: 'Vue', category: 'frontend', order: 10 },
  { name: 'Angular', category: 'frontend', order: 20 },
  { name: 'React', category: 'frontend', order: 30 },
  { name: 'Wix', category: 'frontend', order: 40 },
  { name: 'Jetpack Compose', category: 'frontend', order: 50 },
  { name: 'Node.js', category: 'backend', order: 60 },
  { name: 'Go', category: 'backend', order: 70 },
  { name: 'VB.NET', category: 'backend', order: 80 },
  { name: 'C#', category: 'backend', order: 90 },
  { name: 'FastAPI', category: 'backend', order: 100 },
  { name: 'PostgreSQL', category: 'backend', order: 110 },
  { name: 'MongoDB', category: 'backend', order: 120 },
  { name: 'Firestore', category: 'backend', order: 130 },
  { name: 'MySQL', category: 'backend', order: 140 },
  { name: 'GitLab', category: 'devops', order: 150 },
  { name: 'GitHub', category: 'devops', order: 160 },
  { name: 'Figma', category: 'tools', order: 170 },
  { name: 'Balsamiq', category: 'tools', order: 180 },
  { name: 'Jest', category: 'tools', order: 190 },
  { name: 'Cypress', category: 'tools', order: 200 },
  { name: 'Whimsical', category: 'tools', order: 210 },
  { name: 'Keras', category: 'tools', order: 220 },
  { name: 'Arduino', category: 'tools', order: 230 },
  { name: 'JavaScript', category: 'other', order: 240 },
  { name: 'Kotlin', category: 'other', order: 250 },
  { name: 'Java', category: 'other', order: 260 },
]

// Verify Dicoding certificate identifiers in a browser; some URLs may use O or 0.
const certificates: CertificateSeed[] = [
  { title: 'Kotlin Android Intermediate', issuer: 'Dicoding Indonesia', issueDate: '2024-06-18T00:00:00.000Z', expiryDate: '2027-06-18T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/MRZME6N9LPYQ', imageFile: 'dicoding-android-intermediate.jpeg', order: 10, highlighted: false },
  { title: 'Machine Learning Implementation For Kotlin Android', issuer: 'Dicoding Indonesia', issueDate: '2024-05-02T00:00:00.000Z', expiryDate: '2027-05-02T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/NVP7Q9GQOZR0', imageFile: 'dicoding-ml-android.jpeg', order: 20, highlighted: false },
  { title: 'AI Fundamentals', issuer: 'Dicoding Indonesia', issueDate: '2024-04-19T00:00:00.000Z', expiryDate: '2027-04-19T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/07Z605VKJZQR', imageFile: 'dicoding-ai-basics.jpeg', order: 30, highlighted: false },
  { title: 'Android Fundamentals', issuer: 'Dicoding Indonesia', issueDate: '2024-04-01T00:00:00.000Z', expiryDate: '2027-04-01T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/1OP8NGKJVXQK', imageFile: 'dicoding-android-fundamentals.jpeg', order: 40, highlighted: false },
  { title: 'Android Application For Beginners With Kotlin', issuer: 'Dicoding Indonesia', issueDate: '2024-03-06T00:00:00.000Z', expiryDate: '2027-03-06T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/N9ZOOK68DZG5', imageFile: 'dicoding-android-beginner.jpeg', order: 50, highlighted: false },
  { title: 'Kotlin Programming Basics', issuer: 'Dicoding Indonesia', issueDate: '2024-02-24T00:00:00.000Z', expiryDate: '2027-02-24T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/1RXY1JEL3PVM', imageFile: 'dicoding-kotlin.jpeg', order: 60, highlighted: false },
  { title: 'Java Programming', issuer: 'Dicoding Indonesia', issueDate: '2024-02-19T00:00:00.000Z', expiryDate: '2027-02-19T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/JMZVD00QJZN9', imageFile: 'dicoding-java.jpeg', order: 70, highlighted: false },
  { title: 'Git and GitHub Basics', issuer: 'Dicoding Indonesia', issueDate: '2024-02-18T00:00:00.000Z', expiryDate: '2027-02-18T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/07Z6WDJNMZQR', imageFile: 'dicoding-git-github.jpeg', order: 80, highlighted: false },
  { title: 'Software Development Programming Basics', issuer: 'Dicoding Indonesia', issueDate: '2024-02-18T00:00:00.000Z', expiryDate: '2027-02-18T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/98XW2Q434PM3', imageFile: 'dicoding-software-dev-basics.jpeg', order: 90, highlighted: false },
  { title: 'Programming Logic 101', issuer: 'Dicoding Indonesia', issueDate: '2024-02-18T00:00:00.000Z', expiryDate: '2027-02-18T00:00:00.000Z', credentialUrl: 'https://www.dicoding.com/certificates/JMZVD09OOZN9', imageFile: 'dicoding-programming-logic-101.jpeg', order: 100, highlighted: false },
  { title: 'Certificate of Completion as Mobile Dev Cohort - Bangkit Academy', issuer: 'Bangkit Academy led by Google, Tokopedia, Gojek, and Traveloka', issueDate: '2024-07-10T00:00:00.000Z', imageFile: 'bangkit-mobile-dev.jpeg', order: 110, highlighted: true },
  { title: 'Red Hat System Administration I (RH124)', issuer: 'Texas A&M Red Hat Academy', issueDate: '2023-12-29T00:00:00.000Z', imageFile: 'redhat-rh124.png', order: 120, highlighted: true },
  // The dates on these two practicum certificates are approximate; the owner should verify them in /admin.
  { title: 'Practicum Assistant, Digital Image Processing (Even Semester 2023/2024)', issuer: 'Informatics Engineering Study Program, University of Mataram', issueDate: '2024-06-30T00:00:00.000Z', imageFile: 'unram-practicum-image-processing.jpeg', order: 130, highlighted: false },
  { title: 'Practicum Assistant, Algorithms and Data Structures (Odd Semester 2023/2024)', issuer: 'Informatics Engineering Study Program, University of Mataram', issueDate: '2024-01-11T00:00:00.000Z', imageFile: 'unram-practicum-data-structures.jpeg', order: 140, highlighted: false },
  { title: 'Project Work Certificate (PKL Replacement), CV. TEC Solution', issuer: 'CV. TEC Solution', issueDate: '2020-10-20T00:00:00.000Z', imageFile: 'tec-solution-pkl-2020.jpeg', order: 150, highlighted: false },
]

export async function seedContent(payload: Payload): Promise<void> {
  await deleteByField(payload, 'certificates', 'title', [
    'Sample Certificate in Web Development',
    'Sample Certificate in Cloud Fundamentals',
  ])
  const seededTechNames = new Set(techSeeds.map(({ name }) => name))
  const obsoleteTechNames = ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker']
    .filter((name) => !seededTechNames.has(name))
  await deleteByField(payload, 'tech-stack', 'name', obsoleteTechNames)

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      siteTitle: 'dev.akarun',
      description: 'Portfolio and blog of Dinta Syaifuddin, self hosted software engineer.',
      socialLinks: [
        { label: 'GitHub', url: 'https://github.com/dxxta' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/dinta-syaifuddin' },
      ],
    },
    overrideAccess: true,
  })

  await payload.updateGlobal({
    slug: 'profile',
    data: {
      name: 'Dinta Syaifuddin',
      headline: 'Self Hosted Software Engineer',
      bio: richText([
        paragraph("I'm a Self Hosted Software Engineer with experience in Frontend, Backend, Mobile and ML/IoT integration. Informatics Engineering graduate (B.Inf, GPA 3.70) from University of Mataram, based in Lombok, Indonesia."),
        heading('Experience'),
        bulletList([
          'Batii Prohire, Fullstack Contract Based (2 Feb 2026 - Present): migrated existing modules into a new integrated micro frontend app using Angular, and used C# to build an API-based app with a PostgreSQL database.',
          'Batii Prohire, Fullstack Contract Based (Jan - Dec 2025): migrated existing modules into a new integrated micro frontend app using Angular.',
          'PT Hayookerja Abhinaya Indonesia, Web-Dev (Jan 2022 - Dec 2025): managed the company landing page and Human Resource Information System (HRIS) application. Started as frontend developer and was promoted to backend developer in early 2025.',
          'Bangkit Academy led by Google, Tokopedia, Gojek and Traveloka (Feb - June 2024): Android developer at Edusign team (Bangkit cohort) using Jetpack Compose with integrated machine learning and RESTful API; the app helps people understand American Sign Language.',
          'Kedaireka Halal Tourism, Fullstack Web-Dev (Aug - Dec 2023): web application with integrated RESTful API and payment gateway for Lombok Halal Room, a platform used for halal tourism.',
          'CV Tech Solution, Fullstack Desktop-Dev (Aug - Dec 2023): laundry management system using MySQL and VB.NET.',
        ]),
        heading('Education'),
        bulletList([
          'University of Mataram, Informatics Engineering (graduated Aug 2025), Bachelor of Informatics Engineering (B.Inf), GPA 3.70.',
          'SMKN 2 Mataram, Computer Software Engineering (Aug 2021).',
        ]),
        heading('Achievements'),
        bulletList([
          '2nd winner of Lomba Kompetensi Siswa (LKS) National in Software IT and Business Competition, Province stage (West Nusa Tenggara).',
        ]),
      ]),
      contactLinks: [
        { label: 'GitHub', url: 'https://github.com/dxxta' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/dinta-syaifuddin' },
        { label: 'Email', url: 'mailto:dintasyaifuddin@gmail.com' },
      ],
    },
    overrideAccess: true,
  })

  const techByName = new Map<string, number>()
  for (const data of techSeeds) {
    const saved = await upsertTechStackItem(payload, data)
    techByName.set(saved.name, saved.id)
  }

  for (const certificate of certificates) await upsertCertificate(payload, certificate)

  function technologyIDs(names: string[]): number[] {
    return names.map((name) => {
      const id = techByName.get(name)
      if (id === undefined) throw new Error(`Missing seeded technology: ${name}`)
      return id
    })
  }

  const projects: ProjectSeed[] = [
    {
      title: 'Slipakar',
      slug: 'slipakar',
      summary: 'Syncing details from GitHub.',
      description: richText([paragraph(' ')]) as Project['description'],
      techStack: [], featured: true, order: 10, source: 'github',
      githubRepo: 'dxxta/slipakar', repoUrl: 'https://github.com/dxxta/slipakar',
    },
    {
      title: 'Byecheating: Real-time Exam Integrity Platform For Cheating Detection',
      slug: 'byecheating',
      summary: 'Integrated REST API with a cheating detection model (YOLOv5) through RTSP protocol.',
      description: projectDescription('Integrated REST API with a cheating detection model (YOLOv5) through RTSP protocol.', 2024),
      techStack: technologyIDs([]), featured: true, order: 20, source: 'github',
      githubRepo: 'dxxta/Cheating-Detection-API', repoUrl: 'https://github.com/dxxta/Cheating-Detection-API',
      lockedFields: ['title', 'summary', 'description'],
    },
    {
      title: 'FundConn: Web3 Crowdfunding Platform Based on Ethereum',
      slug: 'fundconn',
      summary: "Management system for event organizers' funding using blockchain technologies.",
      description: projectDescription("Management system for event organizers' funding using blockchain technologies.", 2024),
      techStack: technologyIDs([]), featured: true, order: 30, source: 'github',
      githubRepo: 'dxxta/fundconn', repoUrl: 'https://github.com/dxxta/fundconn',
      lockedFields: ['title', 'summary', 'description'],
    },
    {
      title: 'Edusign: American Sign Language App',
      slug: 'edusign',
      summary: 'Mobile application designed to facilitate the learning and practice of American Sign Language (ASL) through the integration of machine learning technology.',
      description: projectDescription('Mobile application designed to facilitate the learning and practice of American Sign Language (ASL) through the integration of machine learning technology.', 2024),
      techStack: technologyIDs(['Jetpack Compose', 'Kotlin']), featured: true, order: 40, source: 'manual',
      githubRepo: null, repoUrl: null, lockedFields: [],
    },
    {
      title: 'ColorSorter: Integrated Real-time IoT System with Telegram Bot',
      slug: 'colorsorter',
      summary: 'An integrated system that delivers real-time alerts for IoT gadgets and functions as a color sorter.',
      description: projectDescription('An integrated system that delivers real-time alerts for IoT gadgets and functions as a color sorter.', 2024),
      techStack: technologyIDs(['Arduino']), featured: false, order: 50, source: 'github',
      githubRepo: 'dxxta/Color-Sorter-IoT-Telegram', repoUrl: 'https://github.com/dxxta/Color-Sorter-IoT-Telegram',
      lockedFields: ['title', 'summary', 'description'],
    },
    {
      title: 'LombokHalalRoom: Halal Tourism Platform',
      slug: 'lombokhalalroom',
      summary: 'Web application using integrated RESTful API and payment gateway for Lombok Halal Room as platform used for halal tourism.',
      description: projectDescription('Web application using integrated RESTful API and payment gateway for Lombok Halal Room as platform used for halal tourism.', 2023),
      techStack: technologyIDs([]), featured: false, order: 60, source: 'manual',
      githubRepo: null, repoUrl: null, lockedFields: [],
    },
    {
      title: 'Web Application ReseleryFood',
      slug: 'reseleryfood',
      summary: 'Passionate about creating simple and efficient front and back-end solutions to enhance user experiences.',
      description: projectDescription('Passionate about creating simple and efficient front and back-end solutions to enhance user experiences.', 2023),
      techStack: technologyIDs([]), featured: false, order: 70, source: 'manual',
      githubRepo: null, repoUrl: null, lockedFields: [],
    },
    {
      title: 'KitaRescue REST API',
      slug: 'kitarescue-rest-api',
      summary: 'Contributing to the development of Kita Rescue as Backend Developer for the Software Development category in GEMASTIKXV competition by Puspresnas.',
      description: projectDescription('Contributing to the development of Kita Rescue as Backend Developer for the Software Development category in GEMASTIKXV competition by Puspresnas.', 2023),
      techStack: technologyIDs([]), featured: false, order: 80, source: 'manual',
      githubRepo: null, repoUrl: null, lockedFields: [],
    },
  ]
  for (const project of projects) await upsertProject(payload, project)
}
