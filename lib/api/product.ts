import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { CreateProductType } from "@/lib/validations/product"

export async function getProduct(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

  if (error) {
    // It's okay if no product is found, return null
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(error.message)
  }
  return data
}

export async function createProduct(product: CreateProductType) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name: product.name,
        description: product.description,
        price: product.price,
        brand_slug: product.brandSlug,
        is_featured: product.isFeatured,
        is_trending: product.isTrending,
        images: product.images || [],
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function updateProduct(product: { id: string } & CreateProductType) {
  const supabase = await createSupabaseServerClient()
  const { id, ...updateData } = product
  const { data, error } = await supabase
    .from("products")
    .update({
      name: updateData.name,
      description: updateData.description,
      price: updateData.price,
      brand_slug: updateData.brandSlug,
      is_featured: updateData.isFeatured,
      is_trending: updateData.isTrending,
      images: updateData.images || [],
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}
