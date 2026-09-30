import { FolderTree } from 'lucide-react';

import { CategoryManager } from '@/features/categories/components/CategoryManager';
import { getCategoryTree } from '@/features/categories/server/data';
import { requireRole } from '@/lib/auth/session';
import { PageHeader } from '@/shared/components/dashboard/PageHeader';
import { ROLES } from '@/shared/constants/roles';

export default async function AdminCategoriesPage() {
  await requireRole(ROLES.ADMIN);
  const raw = await getCategoryTree();

  const tree = raw.map((node) => ({
    id: node.id,
    name: node.name,
    courseCount: node._count.courses,
    children: node.children.map((child) => ({
      id: child.id,
      name: child.name,
      courseCount: child._count.courses,
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin', href: '/admin' }]}
        icon={<FolderTree />}
        title="Categories"
        description="Organize courses into categories and subcategories. Courses are tagged to a leaf."
      />
      <CategoryManager tree={tree} />
    </div>
  );
}
