import { Zap, Twitter, Globe, Newspaper, Layout, Share2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function LandingPage() {
  const platforms = [
    { name: 'Twitter', icon: Twitter },
    { name: 'Ghost', icon: Globe },
    { name: 'Substack', icon: Newspaper },
    { name: 'Squarespace', icon: Layout },
    { name: 'Nostr', icon: Share2 },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="mx-auto w-full max-w-md space-y-8 text-center md:max-w-4xl">
        <div className="flex flex-col items-center gap-4">
          <Zap className="size-16 md:size-20 text-primary" />
          <h1 className="text-5xl font-bold md:text-7xl">sats.gg</h1>
        </div>

        <p className="whitespace-pre-line text-2xl font-medium text-muted-foreground md:text-4xl">
          {'Post Content.\nGet Paid.'}
        </p>

        <div className="flex flex-col justify-center gap-4 pt-8 sm:flex-row">
          <Link
            href="/stream"
            className={cn(buttonVariants({ size: 'lg' }), 'flex-1 text-lg sm:min-w-[160px] sm:flex-initial')}
          >
            Go Live
          </Link>

          <Link
            href="/browse"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'flex-1 text-lg sm:min-w-[160px] sm:flex-initial',
            )}
          >
            Watch
          </Link>
        </div>

        <div className="space-y-6 pt-16">
          <p className="text-sm text-muted-foreground">Monetized content available on your favorite platforms:</p>
          <div className="flex flex-wrap justify-center gap-8">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <platform.icon className="size-6" />
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
