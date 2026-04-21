export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            categories: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    name: string
                    slug: string
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name: string
                    slug: string
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    name?: string
                    slug?: string
                }
                Relationships: []
            }
            product_images: {
                Row: {
                    alt_text: string | null
                    created_at: string | null
                    id: string
                    is_primary: boolean | null
                    product_id: string | null
                    storage_path: string
                }
                Insert: {
                    alt_text?: string | null
                    created_at?: string | null
                    id?: string
                    is_primary?: boolean | null
                    product_id?: string | null
                    storage_path: string
                }
                Update: {
                    alt_text?: string | null
                    created_at?: string | null
                    id?: string
                    is_primary?: boolean | null
                    product_id?: string | null
                    storage_path?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "product_images_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            product_variants: {
                Row: {
                    created_at: string | null
                    id: string
                    product_id: string | null
                    size: string
                    stock: number | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    product_id?: string | null
                    size: string
                    stock?: number | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    product_id?: string | null
                    size?: string
                    stock?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "product_variants_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    category_id: string | null
                    created_at: string | null
                    description: string | null
                    featured: boolean | null
                    id: string
                    name: string
                    price: number
                    sku: string | null
                    slug: string
                }
                Insert: {
                    category_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    featured?: boolean | null
                    id?: string
                    name: string
                    price: number
                    sku?: string | null
                    slug: string
                }
                Update: {
                    category_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    featured?: boolean | null
                    id?: string
                    name?: string
                    price?: number
                    sku?: string | null
                    slug?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "products_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            product_clicks: {
                Row: {
                    id: string
                    product_id: string
                    created_at: string
                    session_id: string | null
                }
                Insert: {
                    id?: string
                    product_id: string
                    created_at?: string
                    session_id?: string | null
                }
                Update: {
                    id?: string
                    product_id?: string
                    created_at?: string
                    session_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "product_clicks_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
