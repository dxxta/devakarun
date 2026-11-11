import Link from 'next/link'
import { IconBrandGithub, IconStar } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MediaImage } from '@/components/portfolio/media-image'
import type { Project } from '@/payload-types'

export function ProjectCard({ project }: { project: Project }) {
  const technologies =
    project.techStack?.filter(
      (technology): technology is Exclude<typeof technology, number> =>
        typeof technology === 'object',
    ) ?? []
  const githubUrl = getGithubUrl(project)

  return (
    <div className="group relative h-full min-w-0">
      <Link
        aria-label={`View ${project.title}`}
        className="group flex h-full min-w-0 rounded-card focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        data-pressable="card"
        href={`/projects/${project.slug}`}
      >
      <Card className="pointer-events-none h-full w-full gap-4 rounded-[calc(1.5rem-3px)] border-0">
        <div className="relative">
          <MediaImage
            alt={project.title}
            className="aspect-video w-full rounded-control"
            placeholder={<span className="flex h-full w-full items-center justify-center"><IconBrandGithub aria-hidden="true" className="size-10 text-muted-foreground" /></span>}
            media={project.coverImage}
            sizes="(min-width: 1152px) 33vw, (min-width: 640px) 50vw, 85vw"
          />
          {project.featured ? <Badge className="absolute top-3 left-3" variant="secondary">Highlight</Badge> : null}
        </div>
        <CardHeader className="flex min-w-0 flex-1 flex-col gap-3 p-0">
          <CardTitle className="line-clamp-2 min-h-[2.5em]">{project.title}</CardTitle>
          <p className="m-0 line-clamp-3 min-h-[4.5em] text-pretty leading-relaxed text-muted-foreground">{project.summary}</p>
        </CardHeader>
        <CardContent className="mt-auto flex min-h-8 flex-nowrap items-center gap-2 overflow-hidden p-0 pr-10">
          {(project as Project & { language?: string | null }).language ? (
            <Badge variant="outline">{(project as Project & { language?: string | null }).language}</Badge>
          ) : null}
          {(project.stars ?? 0) > 0 ? (
            <Badge className="gap-1" variant="outline"><IconStar aria-hidden="true" />{project.stars}</Badge>
          ) : null}
          {technologies.slice(0, 3).map((technology) => (
            <Badge key={technology.id} variant="secondary">{technology.name}</Badge>
          ))}
          {technologies.length > 3 ? <Badge variant="secondary">+{technologies.length - 3}</Badge> : null}
        </CardContent>
      </Card>
      </Link>
      {githubUrl ? (
        <Button
          asChild
          aria-label="View repository on GitHub"
          className="absolute right-5 bottom-5 z-10 size-8 rounded-full p-0"
          size="icon"
          variant="quiet"
        >
          <a href={githubUrl} rel="noopener noreferrer" target="_blank">
            <IconBrandGithub aria-hidden="true" className="size-4" />
          </a>
        </Button>
      ) : null}
    </div>
  )
}

export function getGithubUrl(project: Project): string | undefined {
  const repoUrl = project.repoUrl?.trim()
  if (repoUrl && /^https?:\/\/(www\.)?github\.com\//i.test(repoUrl)) return repoUrl
  if (project.source === 'github' || project.githubRepo) {
    const repository = project.githubRepo?.trim()
    return repository ? `https://github.com/${repository.replace(/^\/+|\/+$/g, '')}` : undefined
  }
  return undefined
}
