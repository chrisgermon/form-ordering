"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"

import { createProductSchema, type CreateProductType } from "@/lib/validations/product"
import { createProduct, getProduct, updateProduct } from "@/lib/api/product"
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { FileUploader } from "./file-manager"

interface Props {
  brandSlug: string
}

export function FormEditor({ brandSlug }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const params = useParams()
  const productId = params.productId as string | undefined
  const [isNewProduct, setIsNewProduct] = useState(!productId)

  const form = useForm<CreateProductType>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      brandSlug: brandSlug,
      images: [],
      isFeatured: false,
      isTrending: false,
    },
    mode: "onChange",
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId as string),
    enabled: !!productId,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (product) {
      form.reset(product)
      setIsNewProduct(false)
    }
  }, [product, form])

  const { mutate: create, isPending: isCreatePending } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast({
        title: "Product created successfully",
      })
      router.push(`/admin/dashboard`) // Redirect to dashboard after creation
    },
    onError: (error) => {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const { mutate: update, isPending: isUpdatePending } = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      toast({
        title: "Product updated successfully",
      })
      router.push(`/admin/dashboard`) // Redirect to dashboard after update
    },
    onError: (error) => {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const onSubmit = (values: CreateProductType) => {
    if (isNewProduct) {
      create(values)
    } else {
      update({ id: productId as string, ...values })
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold tracking-tight">{isNewProduct ? "Create Product" : "Edit Product"}</h1>
      <Separator className="my-4" />
      {isLoading && !isNewProduct ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      ) : (
        <FormProvider {...form}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Product description" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Product price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Featured</FormLabel>
                      <FormDescription>Mark this product as featured</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isTrending"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Trending</FormLabel>
                      <FormDescription>Mark this product as trending</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <FileUploader onValueChange={field.onChange} value={field.value} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isCreatePending || isUpdatePending}>
                {isCreatePending || isUpdatePending ? "Loading..." : isNewProduct ? "Create" : "Update"}
              </Button>
            </form>
          </Form>
        </FormProvider>
      )}
    </div>
  )
}
