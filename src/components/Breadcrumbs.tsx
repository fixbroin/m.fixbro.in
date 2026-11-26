import { ChevronRight, Home } from 'lucide-react';
import LoadingLink from './LoadingLink';
import { WEBSITE_URL } from '@/lib/config';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items || items.length === 0) return null;

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      ...(item.href ? { item: `${WEBSITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <div className={cn('bg-secondary/45 border-b border-border/60 py-3', className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <nav aria-label="Breadcrumb" className="container">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                {item.href && !isLast ? (
                  <LoadingLink
                    href={item.href}
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors font-medium"
                  >
                    {index === 0 && <Home className="h-3.5 w-3.5" />}
                    <span>{item.label}</span>
                  </LoadingLink>
                ) : (
                  <span className="font-semibold text-foreground">{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
