import { Hero } from '@/components/home/hero'
import { CategoryGrid } from '@/components/home/category-grid'
import { FeaturedProducts } from '@/components/home/featured-products'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
    </main>
  )
}
