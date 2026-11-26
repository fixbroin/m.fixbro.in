import { getPortfolioItems, getPortfolioPageContent } from '@/app/admin/settings/actions/portfolio-actions';
import PortfolioShowcaseClient from './PortfolioShowcaseClient';

export default async function PortfolioSection() {
  const [allItems, pageContent] = await Promise.all([
    getPortfolioItems(),
    getPortfolioPageContent(),
  ]);

  if (!allItems || allItems.length === 0) return null;

  return (
    <PortfolioShowcaseClient
      items={allItems}
      title={pageContent.title}
      subtitle={pageContent.subtitle}
    />
  );
}
