import path from 'node:path'
import type { Payload } from 'payload'

import type { Certificate, Media, PortfolioShowcase, Profile, Project, TechStack } from '../payload-types'

type TechStackSeed = Pick<TechStack, 'name' | 'category' | 'order'>
type ProjectSeed = Pick<
  Project,
  'title' | 'slug' | 'summary' | 'description' | 'features' | 'architecture' | 'techStack' | 'featured' | 'order' | 'source' | 'githubRepo' | 'repoUrl' | 'lockedFields'
>
type ShowcaseSeed = Pick<PortfolioShowcase, 'title' | 'order' | 'caption' | 'featured'> & {
  imageFile: string
  projectSlug: string | null
}
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
  const image = await upsertSeedMedia(
    payload,
    certificate.imageFile,
    `${certificate.title} certificate`,
    path.join('certificates', certificate.imageFile),
  )
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

async function upsertSeedMedia(
  payload: Payload,
  filename: string,
  alt: string,
  relativePath: string,
): Promise<Media> {
  const media = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
    showHiddenFields: true,
  })
  if (media.docs[0]) return media.docs[0]

  return payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.join(process.cwd(), 'seed-assets', relativePath),
    overrideAccess: true,
  })
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

async function deleteByField<K extends 'tech-stack' | 'certificates' | 'projects'>(
  payload: Payload,
  collection: K,
  field: K extends 'tech-stack' ? 'name' : K extends 'certificates' ? 'title' : 'slug',
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

async function upsertShowcase(payload: Payload, showcase: ShowcaseSeed): Promise<void> {
  const image = await upsertSeedMedia(
    payload,
    showcase.imageFile,
    `${showcase.title} portfolio showcase`,
    path.join('showcases', showcase.imageFile),
  )
  let projectID: number | null = null
  if (showcase.projectSlug) {
    const project = await payload.find({
      collection: 'projects',
      where: { slug: { equals: showcase.projectSlug } },
      limit: 1,
      overrideAccess: true,
    })
    if (!project.docs[0]) throw new Error(`Missing project for showcase: ${showcase.projectSlug}`)
    projectID = project.docs[0].id
  }

  const data = {
    title: showcase.title,
    order: showcase.order,
    caption: showcase.caption,
    featured: showcase.featured,
    image: image.id,
    project: projectID,
  }
  const existing = await payload.find({
    collection: 'portfolio-showcases',
    where: { title: { equals: showcase.title } },
    limit: 1,
    overrideAccess: true,
  })
  if (existing.docs[0]) {
    await payload.update({ collection: 'portfolio-showcases', id: existing.docs[0].id, data, overrideAccess: true })
    return
  }
  await payload.create({ collection: 'portfolio-showcases', data, overrideAccess: true })
}

const obsoleteShowcaseImages = [
  'showcase-01.png', 'showcase-02.png', 'showcase-03.png', 'showcase-04.png',
  'showcase-05.png', 'showcase-06.png', 'showcase-07.png', 'showcase-08-slipakar.png',
]

// Replaces the previous showcase set: drops showcases that are no longer listed and the old image files.
async function removeObsoleteShowcases(payload: Payload, currentTitles: string[]): Promise<void> {
  const existing = await payload.find({ collection: 'portfolio-showcases', limit: 1000, overrideAccess: true })
  for (const showcase of existing.docs) {
    if (currentTitles.includes(showcase.title)) continue
    await payload.delete({ collection: 'portfolio-showcases', id: showcase.id, overrideAccess: true })
  }
  for (const filename of obsoleteShowcaseImages) {
    const media = await payload.find({
      collection: 'media', where: { filename: { equals: filename } },
      limit: 1, overrideAccess: true,
    })
    if (media.docs[0]) await payload.delete({ collection: 'media', id: media.docs[0].id, overrideAccess: true })
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
  { name: 'Google Cloud', category: 'devops', order: 170 },
  { name: 'Cloudflare', category: 'devops', order: 180 },
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
  { title: '2nd Place, LKS SMK Provincial NTB 2021 - IT Software Solutions for Business', issuer: 'Dinas Pendidikan dan Kebudayaan Provinsi NTB', issueDate: '2021-09-02T00:00:00.000Z', imageFile: 'lks-ntb-2021.png', order: 0, highlighted: false },
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
  { title: 'Practicum Assistant, Algorithms and Data Structures (Odd Semester 2023/2024)', issuer: 'Informatics Engineering Study Program, University of Mataram', issueDate: '2024-01-11T00:00:00.000Z', imageFile: 'unram-practicum-data-structures.jpeg', order: 140, highlighted: true },
  { title: 'Project Work Certificate (PKL Replacement), CV. TEC Solution', issuer: 'CV. TEC Solution', issueDate: '2020-10-20T00:00:00.000Z', imageFile: 'tec-solution-pkl-2020.jpeg', order: 150, highlighted: false },
]

export async function seedContent(payload: Payload): Promise<void> {
  await deleteByField(payload, 'projects', 'slug', [
    'portfolio-starter',
    'content-hub',
    'delivery-toolkit',
  ])
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

  const portfolioPdf = await upsertSeedMedia(
    payload,
    'Mochammad-Dinta-Alif-Syaifuddin-Portfolio.pdf',
    'Mochammad Dinta Alif Syaifuddin portfolio PDF',
    path.join('portfolio', 'Mochammad-Dinta-Alif-Syaifuddin-Portfolio.pdf'),
  )
  const avatar = await upsertSeedMedia(
    payload,
    'avatar.jpeg',
    'Dinta Syaifuddin avatar',
    path.join('portfolio', 'avatar.jpeg'),
  )
  const previewAssets = {
    lks: await upsertSeedMedia(payload, 'lks-ntb-2021.png', 'LKS SMK Provincial NTB 2021 2nd place certificate', path.join('certificates', 'lks-ntb-2021.png')),
    bangkit: await upsertSeedMedia(payload, 'bangkit-mobile-dev.jpeg', 'Certificate of Completion as Mobile Dev Cohort - Bangkit Academy certificate', path.join('certificates', 'bangkit-mobile-dev.jpeg')),
    tec: await upsertSeedMedia(payload, 'tec-solution-pkl-2020.jpeg', 'Project Work Certificate (PKL Replacement), CV. TEC Solution certificate', path.join('certificates', 'tec-solution-pkl-2020.jpeg')),
  }

  await payload.updateGlobal({
    slug: 'profile',
    data: {
      name: 'Dinta Syaifuddin',
      headline: 'Fullstack Software Engineer',
      bio: richText([
        paragraph("I'm a Software Engineer with experience in Frontend, Backend, Mobile and ML/IoT integration. Informatics Engineering graduate (B.Inf) from University of Mataram, based in Lombok, Indonesia."),
        heading('Experience'),
        bulletList([
          'Batii, Fullstack Contract Based (Feb 2026 - Present): migrated existing modules into a new integrated micro frontend app using Angular, and used C# to build an API-based app with a PostgreSQL database.',
          'Batii, Frontend Contract Based (Oct - Dec 2025): migrated existing modules into a new integrated micro frontend app using Angular.',
          'PT Hayookerja Abhinaya Indonesia, Web-Dev (Jan 2022 - Dec 2025): managed the company landing page and Human Resource Information System (HRIS) application. Started as frontend developer and was promoted to backend developer in early 2025.',
          'Bangkit Academy led by Google, Tokopedia, Gojek and Traveloka (Feb - June 2024): Android developer at Edusign team (Bangkit cohort) using Jetpack Compose with integrated machine learning and RESTful API; the app helps people understand American Sign Language.',
          'Kedaireka Halal Tourism, Fullstack Web-Dev (Aug - Dec 2023): web application with integrated RESTful API and payment gateway for Lombok Halal Room, a platform used for halal tourism.',
          'CV Tech Solution, Fullstack Desktop-Dev (Aug - Dec 2023): laundry management system using MySQL and VB.NET.',
        ]),
        heading('Education'),
        bulletList([
          'University of Mataram, Informatics Engineering (graduated Aug 2025), Bachelor of Informatics Engineering (B.Inf).',
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
      listPreviews: [
        { keyword: 'LKS', image: previewAssets.lks.id, label: 'LKS SMK Provincial NTB 2021 2nd place certificate' },
        { keyword: 'Bangkit Academy', image: previewAssets.bangkit.id, label: 'Bangkit Academy Mobile Developer Cohort certificate' },
        { keyword: 'CV Tech Solution', image: previewAssets.tec.id, label: 'CV. TEC Solution project work certificate' },
      ],
      avatar: avatar.id,
      portfolioPdf: portfolioPdf.id,
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
      title: 'Slipakar: Self-hostable platform for personalized bulk email payslip',
      slug: 'slipakar',
      summary: 'Slipakar is an open-source, self-hostable platform for personalized bulk email. It lets a company send messages through its own SMTP server and optionally attach a personalized PDF, such as an employee payslip, to each recipient',
      description: richText([paragraph('Slipakar is an open-source, self-hostable platform for personalized bulk email. It lets a company send messages through its own SMTP server and optionally attach a personalized PDF, such as an employee payslip, to each recipient. The primary use case is HR, finance, or operations uploading a spreadsheet, mapping its columns to a reusable email or PDF template, previewing the result, and sending a campaign without writing code.')]) as Project['description'],
      features: [
        { title: 'Projects, SMTP & Templates', text: 'Projects organize SMTP connections, email templates, uploads, PDF templates, and campaigns. SMTP credentials are configured per project and encrypted at rest with APPENCRYPTIONKEY (never returned in API views). Email templates use safe {{placeholder}} substitution without evaluat' },
        { title: 'Data Upload, Mapping & PDF Builder', text: 'Upload recipient data from CSV, XLSX, or JSON files and map columns to template placeholders. Build personalized PDF templates using a visual node builder (text, table, image, and divider nodes); generated PDFs and extra shared attachments are stored in Garage.' },
        { title: 'Campaigns', text: 'Queued through RabbitMQ and sent asynchronously in the background with Redis token-bucket rate limiting per SMTP connection, per-recipient status tracking, and automatic retries for transient SMTP failures.' },
        { title: 'Notifications & Announcements', text: 'Campaign notifications (campaignfinished, sendfailed) and admin announcements (UserNotice from broadcasts) appear in the user app with unread badges.' },
        { title: 'User Profile & Theme Preferences', text: 'Users can edit their display name, upload or reset a custom avatar (PNG/JPEG/WebP up to 2 MB, magic-byte verified, stored in Garage), and change their email address (always requires clicking a verification link sent to the new address). Account-saved theme preferences support lig' },
        { title: 'Login Activity', text: 'Records sign-in events with resolved client IP, a best-effort proxy indicator, parsed browser/OS/device type, and offline geolocation via geoip-lite ( retained for LOGINEVENTRETENTION_DAYS, default 90 days). Optional map previews load OpenStreetMap raster tiles on demand only whe' },
        { title: 'Admin Web', text: 'Manage users (view, edit name/image, disable/enable accounts with immediate session revocation), compose and send broadcasts to all users, by role, or selected users, audit login activity across all accounts, toggle instance feature flags (scalardocs, pdfbuilder, self_signup), vi' },
        { title: 'OpenAPI & Observability', text: 'Scalar OpenAPI reference at /docs and specification at /openapi.json (requires authentication; toggleable via scalar_docs). Prometheus scrapes /metrics for Grafana dashboards, Uptime Kuma monitors service health, API error logs are persisted to object storage, and browser Sentry ' },
      ],
      architecture: {
        summary: '',
        items: [
          { name: 'api', purpose: 'Express REST API, authentication, and background workers', detail: '3000' },
          { name: 'web', purpose: 'One Nginx container serving user web at / and admin web at /console/', detail: '8080' },
          { name: 'landing', purpose: 'Public Angular landing site with English and Indonesian pages', detail: '8082' },
          { name: 'postgres', purpose: 'Application database', detail: 'Internal only' },
          { name: 'redis', purpose: 'Session/cache state, rate limiting, and feature-flag updates', detail: 'Internal only' },
          { name: 'rabbitmq', purpose: 'Background email and notification jobs', detail: 'Internal only' },
          { name: 'garage', purpose: 'S3-compatible object storage for attachments, generated PDFs, and error records', detail: 'Internal only' },
          { name: 'prometheus', purpose: 'Scrapes API metrics', detail: 'Internal only' },
          { name: 'grafana', purpose: 'Metrics dashboards', detail: '3001' },
        ],
        architectureDiagram: 'apps/api/          Express API, domain and internal layers, Prisma schema and migrations\napps/admin-web/    Angular administration app\napps/user-web/     Angular user app\napps/landing-web/  Public Angular SSR landing site\npackages/shared/   Shared TypeScript code\npackages/ui/       Shared UI package source\ninfra/             Garage, Prometheus, Grafana, and web-server configuration\ntests/             Infrastructure checks and Playwright browser flows',
      },
      techStack: [], featured: true, order: 10, source: 'github',
      githubRepo: 'dxxta/slipakar', repoUrl: 'https://github.com/dxxta/slipakar',
      lockedFields: ['title'],
    },
    {
      title: 'Notakar',
      slug: 'notakar',
      summary: 'Personalized e-receipt in a few steps, send it to your customer, and keep every sale easy to find',
      description: richText([paragraph('Personalized e-receipt in a few steps, send it to your customer, and keep every sale easy to find')]) as Project['description'],
      techStack: technologyIDs([]), featured: false, order: 0, source: 'github',
      githubRepo: 'dxxta/notakar', repoUrl: 'https://github.com/dxxta/notakar', lockedFields: [],
    },
    {
      title: 'Byecheating: Real-time Exam Integrity Platform For Cheating Detection',
      slug: 'byecheating',
      summary: 'Integrated REST API with a cheating detection model (YOLOv5) through RTSP protocol.',
      description: projectDescription('Integrated REST API with a cheating detection model (YOLOv5) through RTSP protocol.', 2024),
      techStack: technologyIDs([]), featured: true, order: 20, source: 'github',
      githubRepo: 'dxxta/cheating-detection-api', repoUrl: 'https://github.com/dxxta/cheating-detection-api',
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
      techStack: technologyIDs(['Arduino', 'FastAPI']), featured: false, order: 50, source: 'github',
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

  const showcases: ShowcaseSeed[] = [
    { title: 'Byecheating: Real-time Exam Integrity Platform For Cheating Detection', order: 1, caption: 'Project 1 of 9', imageFile: 'showcase-01-byecheating.png', featured: true, projectSlug: 'byecheating' },
    { title: 'Backend: Payment API For Xendit Integration', order: 2, caption: 'Project 2 of 9', imageFile: 'showcase-02-xendit-payment-api.png', featured: false, projectSlug: null },
    { title: 'Fullstack: Rent Management System For Product Related', order: 3, caption: 'Project 3 of 9', imageFile: 'showcase-03-rent-management.png', featured: false, projectSlug: null },
    { title: 'ColorSorter: Integrated Real-time IoT System with Telegram Bot', order: 4, caption: 'Project 4 of 9', imageFile: 'showcase-04-colorsorter.png', featured: false, projectSlug: 'colorsorter' },
    { title: 'FundConn: Web3 Crowdfunding Platform Based on Ethereum', order: 5, caption: 'Project 5 of 9', imageFile: 'showcase-05-fundconn.png', featured: true, projectSlug: 'fundconn' },
    { title: 'Edusign: American Sign Language Mobile App', order: 6, caption: 'Project 6 of 9', imageFile: 'showcase-06-edusign.png', featured: false, projectSlug: 'edusign' },
    { title: 'SEO Friendly Landing Page for Company', order: 7, caption: 'Project 7 of 9', imageFile: 'showcase-07-company-landing.png', featured: false, projectSlug: null },
    { title: 'Slipakar: Personalized payslip in bulk email platform', order: 8, caption: 'Project 8 of 9', imageFile: 'showcase-08-slipakar.png', featured: true, projectSlug: 'slipakar' },
    { title: 'Notakar: Personalized e-receipts in more easier way', order: 9, caption: 'Project 9 of 9', imageFile: 'showcase-09-notakar.png', featured: false, projectSlug: 'notakar' },
  ]
  await removeObsoleteShowcases(payload, showcases.map(({ title }) => title))
  for (const showcase of showcases) await upsertShowcase(payload, showcase)
}
