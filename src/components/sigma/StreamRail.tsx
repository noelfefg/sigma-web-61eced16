import { ReactNode } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface RailProps<T> {
  title: string;
  description?: string;
  items: T[];
  loading?: boolean;
  /** Tailwind basis classes controlling item width per breakpoint. */
  basis?: string;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Horizontal carousel rail used across Discover for streams, creators and categories. */
export function StreamRail<T>({
  title,
  description,
  items,
  loading = false,
  basis = 'basis-[78%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4',
  renderItem,
  empty,
  action,
  className,
}: RailProps<T>) {
  const showEmpty = !loading && items.length === 0;

  return (
    <section className={cn('space-y-3', className)} aria-label={title}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">{title}</h2>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className={cn('aspect-[16/10] shrink-0 rounded-3xl', 'w-[78%] sm:w-1/2 lg:w-1/3 xl:w-1/4')} />
          ))}
        </div>
      ) : showEmpty ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-5 py-8 text-center text-sm text-muted-foreground">
          {empty ?? 'Nothing here yet.'}
        </div>
      ) : (
        <Carousel opts={{ align: 'start', dragFree: true }} className="group/rail">
          <CarouselContent className="-ml-3">
            {items.map((item, i) => (
              <CarouselItem key={i} className={cn('pl-3', basis)}>
                {renderItem(item, i)}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden opacity-0 transition-opacity group-hover/rail:opacity-100 lg:flex" />
          <CarouselNext className="hidden opacity-0 transition-opacity group-hover/rail:opacity-100 lg:flex" />
        </Carousel>
      )}
    </section>
  );
}
