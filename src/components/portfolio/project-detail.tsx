import { RichText } from '@payloadcms/richtext-lexical/react'
import { IconBrandGithub, IconExternalLink, IconStar } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MediaImage } from '@/components/portfolio/media-image'
import { getGithubUrl } from '@/components/portfolio/project-card'
import { Card, CardContent } from '@/components/ui/card'
import type { Project } from '@/payload-types'

function hasDescriptionText(description: Project['description']): boolean {
  function containsText(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false
    if ('text' in value && typeof value.text === 'string' && value.text.trim()) return true
    return 'children' in value && Array.isArray(value.children) && value.children.some(containsText)
  }
  return containsText(description.root)
}

export function ProjectDetail({ project }: { project: Project }) {
  const technologies = project.techStack?.filter(
    (technology): technology is Exclude<typeof technology, number> => typeof technology === 'object',
  ) ?? []
  const gallery = project.gallery?.filter((image) => typeof image === 'object') ?? []
  const language = (project as Project & { language?: string | null }).language
  const githubUrl = getGithubUrl(project)
  const hasAboutText = hasDescriptionText(project.description)
  const features = project.features?.filter((feature) => Boolean(feature.title?.trim() || feature.text?.trim())) ?? []
  const architectureSummary = project.architecture?.summary?.trim() ?? ''
  const architectureDiagram = project.architecture?.architectureDiagram?.trim() ?? ''
  const architectureItems = project.architecture?.items?.filter((item) =>
    Boolean(item.name?.trim() || item.purpose?.trim() || item.detail?.trim()),
  ) ?? []
  const hasArchitecture = Boolean(architectureSummary || architectureItems.length || architectureDiagram)

  return (
    <article className="mx-auto grid max-w-4xl gap-8">
      <header className="grid gap-5">
        <h1 className="m-0 text-balance font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
          {project.title}
        </h1>
        <p className="m-0 max-w-3xl text-pretty text-xl leading-relaxed text-muted-foreground">
          {project.summary}
        </p>
        <div className="flex flex-wrap gap-3">
          {githubUrl ? <Button asChild><a href={githubUrl} rel="noopener noreferrer" target="_blank"><IconBrandGithub aria-hidden="true" />View on GitHub</a></Button> : null}
          {project.liveUrl ? <Button asChild variant="quiet"><a href={project.liveUrl} rel="noreferrer" target="_blank"><IconExternalLink aria-hidden="true" />Live site</a></Button> : null}
        </div>
        <ul aria-label="Project details" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {language ? <li><Badge variant="outline">{language}</Badge></li> : null}
          {(project.stars ?? 0) > 0 ? <li><Badge className="gap-1" variant="outline"><IconStar aria-hidden="true" />{project.stars}</Badge></li> : null}
          {technologies.map((technology) => <li key={technology.id}><Badge variant="secondary">{technology.name}</Badge></li>)}
        </ul>
      </header>

      <MediaImage
        alt={project.title}
        className="aspect-video w-full"
        placeholder={<span className="flex h-full w-full items-center justify-center"><IconBrandGithub aria-hidden="true" className="size-16 text-muted-foreground" /></span>}
        media={project.coverImage}
        sizes="(min-width: 1024px) 56rem, 100vw"
        priority
      />

      {hasAboutText ? (
        <section aria-labelledby="project-about-heading" className="grid gap-5">
          <h2 className="m-0 font-display text-2xl font-bold" id="project-about-heading">About this project</h2>
          <Card className="gap-4 shadow-none">
            <CardContent className="p-0 leading-relaxed text-foreground">
              <RichText data={project.description} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {features.length > 0 ? (
        <section aria-labelledby="project-features-heading" className="grid gap-5">
          <h2 className="m-0 font-display text-2xl font-bold" id="project-features-heading">Features</h2>
          <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
            {features.map((feature, index) => (
              <li className="flex items-start gap-4 rounded-card border-2 border-border bg-card p-5" key={feature.id ?? `${feature.title}-${index}`}>
                <span aria-hidden="true" className="mt-[0.3em] size-[18px] flex-none rounded-full border-2 border-ink bg-primary shadow-[1px_1px_0_#000]" />
                <div className="min-w-0">
                  {feature.title?.trim() ? <h3 className="m-0 font-display font-bold">{feature.title}</h3> : null}
                  {feature.text?.trim() ? <p className="mb-0 mt-1 leading-relaxed text-muted-foreground">{feature.text}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasArchitecture ? (
        <section aria-labelledby="project-architecture-heading" className="grid gap-5">
          <h2 className="m-0 font-display text-2xl font-bold" id="project-architecture-heading">Architecture</h2>
          {architectureSummary ? <p className="m-0 max-w-prose text-pretty leading-relaxed text-muted-foreground">{architectureSummary}</p> : null}
          {architectureItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {architectureItems.map((item, index) => {
                const name = item.name?.trim() ?? ''
                const isIdentifier = /^[A-Za-z_][A-Za-z0-9_.:/-]*$/.test(name)
                return (
                  <Card className="gap-3 p-4" key={item.id ?? `${name}-${index}`}>
                    {name ? <h3 className={`m-0 inline-flex w-fit max-w-full break-all rounded-control border-2 border-border bg-muted px-2 py-1 font-display text-sm font-bold ${isIdentifier ? 'font-mono' : ''}`}>{name}</h3> : null}
                    {item.purpose?.trim() ? <p className="m-0 leading-relaxed text-foreground">{item.purpose}</p> : null}
                    {item.detail?.trim() ? <p className="m-0 text-sm leading-relaxed text-muted-foreground">{item.detail}</p> : null}
                  </Card>
                )
              })}
            </div>
          ) : null}
          {architectureDiagram ? (
            <pre className="m-0 overflow-x-auto rounded-card border-2 border-border bg-muted p-4 font-mono text-sm leading-relaxed">{architectureDiagram}</pre>
          ) : null}
        </section>
      ) : null}

      {gallery.length > 0 ? (
        <section aria-labelledby="project-gallery-heading" className="grid gap-5">
          <h2 className="m-0 font-display text-2xl font-bold" id="project-gallery-heading">Gallery</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {gallery.map((image, index) => (
              <MediaImage
                alt={`${project.title} gallery image ${index + 1}`}
                className="aspect-video w-full"
                key={typeof image === 'object' ? image.id : index}
                media={image}
                sizes="(min-width: 640px) 50vw, 100vw"
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
