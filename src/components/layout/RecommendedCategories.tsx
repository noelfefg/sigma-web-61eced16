import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface RecommendedCategoriesProps {
  collapsed: boolean;
}

export function RecommendedCategories({ collapsed }: RecommendedCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')
        .limit(5);
      if (data) setCategories(data);
    }
    fetch();
  }, []);

  if (collapsed || categories.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
        Categories
      </p>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          to={`/browse?category=${cat.slug}`}
          className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all duration-200 text-xs font-medium"
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
