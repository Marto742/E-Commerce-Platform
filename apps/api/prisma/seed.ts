/**
 * Database Seed Script
 *
 * Run with:  pnpm --filter @repo/api db:seed
 *
 * Credentials after seeding:
 *   Admin:      admin@example.com      / Admin123!
 *   Customer 1: john.doe@example.com   / Customer123!
 *   Customer 2: jane.smith@example.com / Customer123!
 */

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import bcryptjs from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...\n')

  // ─── Users ──────────────────────────────────────────────────────────────────

  const [adminPasswordHash, customerPasswordHash] = await Promise.all([
    hashPassword('Admin123!'),
    hashPassword('Customer123!'),
  ])

  const [admin, customer1, customer2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        passwordHash: customerPasswordHash,
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        phoneNumber: '+1 (555) 123-4567',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        email: 'jane.smith@example.com',
        passwordHash: customerPasswordHash,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        phoneNumber: '+1 (555) 987-6543',
      },
    }),
  ])

  console.log('✅  Users seeded (3)')

  // ─── Addresses ────────────────────────────────────────────────────────────

  await Promise.all([
    prisma.address.upsert({
      where: { id: 'addr-seed-john-1' },
      update: {},
      create: {
        id: 'addr-seed-john-1',
        userId: customer1.id,
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: true,
      },
    }),
    prisma.address.upsert({
      where: { id: 'addr-seed-john-2' },
      update: {},
      create: {
        id: 'addr-seed-john-2',
        userId: customer1.id,
        line1: '456 Work Plaza',
        line2: 'Suite 300',
        city: 'New York',
        state: 'NY',
        postalCode: '10022',
        country: 'US',
        isDefault: false,
      },
    }),
    prisma.address.upsert({
      where: { id: 'addr-seed-jane-1' },
      update: {},
      create: {
        id: 'addr-seed-jane-1',
        userId: customer2.id,
        line1: '789 Oak Ave',
        line2: 'Apt 2B',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        isDefault: true,
      },
    }),
  ])

  console.log('✅  Addresses seeded (3)')

  // ─── Categories ─────────────────────────────────────────────────────────────

  // Parent categories first
  const [electronics, clothing, homeGarden] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        imageUrl: 'https://placehold.co/400x300?text=Electronics',
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        slug: 'clothing',
        imageUrl: 'https://placehold.co/400x300?text=Clothing',
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home-garden' },
      update: {},
      create: {
        name: 'Home & Garden',
        slug: 'home-garden',
        imageUrl: 'https://placehold.co/400x300?text=Home+%26+Garden',
        isActive: true,
        sortOrder: 3,
      },
    }),
  ])

  // Child categories
  const [smartphones, laptops, headphones, mensClothing, womensClothing, kitchen] =
    await Promise.all([
      prisma.category.upsert({
        where: { slug: 'smartphones' },
        update: {},
        create: {
          name: 'Smartphones',
          slug: 'smartphones',
          imageUrl: 'https://placehold.co/400x300?text=Smartphones',
          parentId: electronics.id,
          isActive: true,
          sortOrder: 1,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'laptops' },
        update: {},
        create: {
          name: 'Laptops',
          slug: 'laptops',
          imageUrl: 'https://placehold.co/400x300?text=Laptops',
          parentId: electronics.id,
          isActive: true,
          sortOrder: 2,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'headphones' },
        update: {},
        create: {
          name: 'Headphones & Audio',
          slug: 'headphones',
          imageUrl: 'https://placehold.co/400x300?text=Headphones',
          parentId: electronics.id,
          isActive: true,
          sortOrder: 3,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'mens-clothing' },
        update: {},
        create: {
          name: "Men's Clothing",
          slug: 'mens-clothing',
          imageUrl: "https://placehold.co/400x300?text=Men's",
          parentId: clothing.id,
          isActive: true,
          sortOrder: 1,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'womens-clothing' },
        update: {},
        create: {
          name: "Women's Clothing",
          slug: 'womens-clothing',
          imageUrl: "https://placehold.co/400x300?text=Women's",
          parentId: clothing.id,
          isActive: true,
          sortOrder: 2,
        },
      }),
      prisma.category.upsert({
        where: { slug: 'kitchen' },
        update: {},
        create: {
          name: 'Kitchen',
          slug: 'kitchen',
          imageUrl: 'https://placehold.co/400x300?text=Kitchen',
          parentId: homeGarden.id,
          isActive: true,
          sortOrder: 1,
        },
      }),
    ])

  console.log('✅  Categories seeded (9)')

  // ─── Products ───────────────────────────────────────────────────────────────

  const iphone = await prisma.product.upsert({
    where: { slug: 'iphone-15-pro' },
    update: {},
    create: {
      name: 'iPhone 15 Pro',
      slug: 'iphone-15-pro',
      description:
        'The most advanced iPhone ever. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system ever.',
      categoryId: smartphones.id,
      basePrice: 999.0,
      comparePrice: 1099.0,
      isActive: true,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://placehold.co/800x600/1a1a2e/ffffff?text=iPhone+15+Pro',
            altText: 'iPhone 15 Pro — front view',
            sortOrder: 0,
          },
          {
            url: 'https://placehold.co/800x600/1a1a2e/ffffff?text=iPhone+15+Pro+Back',
            altText: 'iPhone 15 Pro — back view',
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'IPH15P-128-BTI',
            name: '128GB / Black Titanium',
            price: 999.0,
            stock: 50,
            attributes: { storage: '128GB', color: 'Black Titanium' },
          },
          {
            sku: 'IPH15P-256-BTI',
            name: '256GB / Black Titanium',
            price: 1099.0,
            stock: 35,
            attributes: { storage: '256GB', color: 'Black Titanium' },
          },
          {
            sku: 'IPH15P-512-BTI',
            name: '512GB / Black Titanium',
            price: 1299.0,
            stock: 20,
            attributes: { storage: '512GB', color: 'Black Titanium' },
          },
          {
            sku: 'IPH15P-128-WTI',
            name: '128GB / White Titanium',
            price: 999.0,
            stock: 45,
            attributes: { storage: '128GB', color: 'White Titanium' },
          },
          {
            sku: 'IPH15P-256-WTI',
            name: '256GB / White Titanium',
            price: 1099.0,
            stock: 30,
            attributes: { storage: '256GB', color: 'White Titanium' },
          },
        ],
      },
    },
    include: { variants: true },
  })

  const samsung = await prisma.product.upsert({
    where: { slug: 'samsung-galaxy-s24-ultra' },
    update: {},
    create: {
      name: 'Samsung Galaxy S24 Ultra',
      slug: 'samsung-galaxy-s24-ultra',
      description:
        'Titanium frame, built-in S Pen, and a 200MP camera system with 100x Space Zoom. Powered by Snapdragon 8 Gen 3 for unmatched performance.',
      categoryId: smartphones.id,
      basePrice: 1299.99,
      isActive: true,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://placehold.co/800x600/0d1b2a/ffffff?text=Galaxy+S24+Ultra',
            altText: 'Samsung Galaxy S24 Ultra',
            sortOrder: 0,
          },
          {
            url: 'https://placehold.co/800x600/0d1b2a/ffffff?text=S24+Ultra+S+Pen',
            altText: 'Galaxy S24 Ultra with S Pen',
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'SGS24U-256-TBK',
            name: '256GB / Titanium Black',
            price: 1299.99,
            stock: 30,
            attributes: { storage: '256GB', color: 'Titanium Black' },
          },
          {
            sku: 'SGS24U-512-TBK',
            name: '512GB / Titanium Black',
            price: 1419.99,
            stock: 20,
            attributes: { storage: '512GB', color: 'Titanium Black' },
          },
          {
            sku: 'SGS24U-256-TGR',
            name: '256GB / Titanium Gray',
            price: 1299.99,
            stock: 25,
            attributes: { storage: '256GB', color: 'Titanium Gray' },
          },
          {
            sku: 'SGS24U-512-TGR',
            name: '512GB / Titanium Gray',
            price: 1419.99,
            stock: 15,
            attributes: { storage: '512GB', color: 'Titanium Gray' },
          },
        ],
      },
    },
    include: { variants: true },
  })

  const macbook = await prisma.product.upsert({
    where: { slug: 'macbook-pro-14' },
    update: {},
    create: {
      name: 'MacBook Pro 14"',
      slug: 'macbook-pro-14',
      description:
        'Supercharged by M3, M3 Pro, or M3 Max, MacBook Pro hands you astonishing speed and capability — and now it comes in a stunning Space Black finish.',
      categoryId: laptops.id,
      basePrice: 1599.0,
      comparePrice: 1799.0,
      isActive: true,
      isFeatured: true,
      images: {
        create: [
          {
            url: 'https://placehold.co/800x600/2d2d2d/ffffff?text=MacBook+Pro+14',
            altText: 'MacBook Pro 14" open',
            sortOrder: 0,
          },
          {
            url: 'https://placehold.co/800x600/2d2d2d/ffffff?text=MacBook+Pro+14+Side',
            altText: 'MacBook Pro 14" side profile',
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'MBP14-M3-8-512-SG',
            name: 'M3 / 8GB / 512GB / Space Gray',
            price: 1599.0,
            stock: 25,
            attributes: { chip: 'M3', ram: '8GB', storage: '512GB', color: 'Space Gray' },
          },
          {
            sku: 'MBP14-M3-16-512-SG',
            name: 'M3 / 16GB / 512GB / Space Gray',
            price: 1999.0,
            stock: 15,
            attributes: { chip: 'M3', ram: '16GB', storage: '512GB', color: 'Space Gray' },
          },
          {
            sku: 'MBP14-M3P-18-512-SB',
            name: 'M3 Pro / 18GB / 512GB / Space Black',
            price: 1999.0,
            stock: 20,
            attributes: { chip: 'M3 Pro', ram: '18GB', storage: '512GB', color: 'Space Black' },
          },
          {
            sku: 'MBP14-M3P-18-1TB-SB',
            name: 'M3 Pro / 18GB / 1TB / Space Black',
            price: 2199.0,
            stock: 10,
            attributes: { chip: 'M3 Pro', ram: '18GB', storage: '1TB', color: 'Space Black' },
          },
        ],
      },
    },
    include: { variants: true },
  })

  const sonyHeadphones = await prisma.product.upsert({
    where: { slug: 'sony-wh-1000xm5' },
    update: {},
    create: {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      description:
        'Industry-leading noise canceling headphones with exceptional call quality, 30-hour battery life, and multipoint Bluetooth connection.',
      categoryId: headphones.id,
      basePrice: 349.99,
      comparePrice: 399.99,
      isActive: true,
      isFeatured: false,
      images: {
        create: [
          {
            url: 'https://placehold.co/800x600/1c1c1c/ffffff?text=Sony+WH-1000XM5',
            altText: 'Sony WH-1000XM5 Black',
            sortOrder: 0,
          },
          {
            url: 'https://placehold.co/800x600/f5f5f0/333333?text=Sony+WH-1000XM5+Silver',
            altText: 'Sony WH-1000XM5 Silver',
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'SONY-WH5-BLK',
            name: 'Black',
            price: 349.99,
            stock: 60,
            attributes: { color: 'Black' },
          },
          {
            sku: 'SONY-WH5-SLV',
            name: 'Silver',
            price: 349.99,
            stock: 40,
            attributes: { color: 'Silver' },
          },
        ],
      },
    },
    include: { variants: true },
  })

  const polo = await prisma.product.upsert({
    where: { slug: 'mens-classic-polo' },
    update: {},
    create: {
      name: "Men's Classic Polo",
      slug: 'mens-classic-polo',
      description:
        '100% premium cotton polo shirt with a relaxed fit. Ideal for casual or smart-casual occasions. Preshrunk to maintain its shape wash after wash.',
      categoryId: mensClothing.id,
      basePrice: 59.99,
      isActive: true,
      isFeatured: false,
      images: {
        create: [
          {
            url: "https://placehold.co/800x600/1e3a5f/ffffff?text=Men's+Polo+Navy",
            altText: "Men's Classic Polo — Navy",
            sortOrder: 0,
          },
          {
            url: "https://placehold.co/800x600/f8f8f8/333333?text=Men's+Polo+White",
            altText: "Men's Classic Polo — White",
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'POLO-NAVY-S',
            name: 'Navy / S',
            price: 59.99,
            stock: 30,
            attributes: { color: 'Navy', size: 'S' },
          },
          {
            sku: 'POLO-NAVY-M',
            name: 'Navy / M',
            price: 59.99,
            stock: 45,
            attributes: { color: 'Navy', size: 'M' },
          },
          {
            sku: 'POLO-NAVY-L',
            name: 'Navy / L',
            price: 59.99,
            stock: 40,
            attributes: { color: 'Navy', size: 'L' },
          },
          {
            sku: 'POLO-NAVY-XL',
            name: 'Navy / XL',
            price: 59.99,
            stock: 25,
            attributes: { color: 'Navy', size: 'XL' },
          },
          {
            sku: 'POLO-WHT-S',
            name: 'White / S',
            price: 59.99,
            stock: 25,
            attributes: { color: 'White', size: 'S' },
          },
          {
            sku: 'POLO-WHT-M',
            name: 'White / M',
            price: 59.99,
            stock: 35,
            attributes: { color: 'White', size: 'M' },
          },
          {
            sku: 'POLO-WHT-L',
            name: 'White / L',
            price: 59.99,
            stock: 30,
            attributes: { color: 'White', size: 'L' },
          },
          {
            sku: 'POLO-WHT-XL',
            name: 'White / XL',
            price: 59.99,
            stock: 20,
            attributes: { color: 'White', size: 'XL' },
          },
        ],
      },
    },
    include: { variants: true },
  })

  const dress = await prisma.product.upsert({
    where: { slug: 'womens-summer-dress' },
    update: {},
    create: {
      name: "Women's Summer Dress",
      slug: 'womens-summer-dress',
      description:
        'Lightweight floral summer dress made from breathable linen-cotton blend. Adjustable spaghetti straps and a flattering A-line silhouette.',
      categoryId: womensClothing.id,
      basePrice: 79.99,
      comparePrice: 99.99,
      isActive: true,
      isFeatured: true,
      images: {
        create: [
          {
            url: "https://placehold.co/800x600/f9c6d0/333333?text=Women's+Dress+Floral",
            altText: "Women's Summer Dress — Floral",
            sortOrder: 0,
          },
          {
            url: "https://placehold.co/800x600/87ceeb/333333?text=Women's+Dress+Blue",
            altText: "Women's Summer Dress — Sky Blue",
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'DRESS-FLRL-XS',
            name: 'Floral / XS',
            price: 79.99,
            stock: 20,
            attributes: { pattern: 'Floral', size: 'XS' },
          },
          {
            sku: 'DRESS-FLRL-S',
            name: 'Floral / S',
            price: 79.99,
            stock: 30,
            attributes: { pattern: 'Floral', size: 'S' },
          },
          {
            sku: 'DRESS-FLRL-M',
            name: 'Floral / M',
            price: 79.99,
            stock: 35,
            attributes: { pattern: 'Floral', size: 'M' },
          },
          {
            sku: 'DRESS-FLRL-L',
            name: 'Floral / L',
            price: 79.99,
            stock: 25,
            attributes: { pattern: 'Floral', size: 'L' },
          },
          {
            sku: 'DRESS-BLUE-S',
            name: 'Sky Blue / S',
            price: 79.99,
            stock: 20,
            attributes: { pattern: 'Sky Blue', size: 'S' },
          },
          {
            sku: 'DRESS-BLUE-M',
            name: 'Sky Blue / M',
            price: 79.99,
            stock: 25,
            attributes: { pattern: 'Sky Blue', size: 'M' },
          },
        ],
      },
    },
    include: { variants: true },
  })

  const cookware = await prisma.product.upsert({
    where: { slug: 'stainless-steel-cookware-set' },
    update: {},
    create: {
      name: 'Stainless Steel Cookware Set',
      slug: 'stainless-steel-cookware-set',
      description:
        'Professional-grade tri-ply stainless steel cookware set with aluminum core for rapid, even heat distribution. Oven-safe up to 500°F and dishwasher-safe.',
      categoryId: kitchen.id,
      basePrice: 299.99,
      comparePrice: 399.99,
      isActive: true,
      isFeatured: false,
      images: {
        create: [
          {
            url: 'https://placehold.co/800x600/c0c0c0/333333?text=Cookware+Set+10pc',
            altText: 'Stainless Steel Cookware Set — 10 Piece',
            sortOrder: 0,
          },
          {
            url: 'https://placehold.co/800x600/c0c0c0/333333?text=Cookware+Set+12pc',
            altText: 'Stainless Steel Cookware Set — 12 Piece',
            sortOrder: 1,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: 'CKW-SS-10PC',
            name: '10-Piece Set',
            price: 299.99,
            stock: 30,
            attributes: { pieces: 10 },
          },
          {
            sku: 'CKW-SS-12PC',
            name: '12-Piece Set',
            price: 349.99,
            stock: 15,
            attributes: { pieces: 12 },
          },
        ],
      },
    },
    include: { variants: true },
  })

  console.log('✅  Products seeded (7 products, 35 variants)')

  // ─── Coupons ────────────────────────────────────────────────────────────────

  await Promise.all([
    prisma.coupon.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        maxUses: 1000,
        isActive: true,
        expiresAt: new Date('2027-12-31'),
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'SAVE20' },
      update: {},
      create: {
        code: 'SAVE20',
        type: 'FIXED_AMOUNT',
        value: 20,
        minOrderAmount: 100,
        maxUses: 500,
        isActive: true,
        expiresAt: new Date('2027-06-30'),
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'SUMMER25' },
      update: {},
      create: {
        code: 'SUMMER25',
        type: 'PERCENTAGE',
        value: 25,
        minOrderAmount: 150,
        maxUses: 200,
        isActive: true,
        expiresAt: new Date('2026-09-30'),
      },
    }),
    prisma.coupon.upsert({
      where: { code: 'FLASH50' },
      update: {},
      create: {
        code: 'FLASH50',
        type: 'FIXED_AMOUNT',
        value: 50,
        minOrderAmount: 200,
        maxUses: 100,
        isActive: false,
        expiresAt: new Date('2026-01-31'),
      },
    }),
  ])

  console.log('✅  Coupons seeded (4)')

  // ─── Orders ─────────────────────────────────────────────────────────────────

  const johnShippingAddress = {
    line1: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  }

  const janeShippingAddress = {
    line1: '789 Oak Ave',
    line2: 'Apt 2B',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90001',
    country: 'US',
  }

  const iphoneVariant = iphone.variants.find((v) => v.sku === 'IPH15P-256-BTI')!
  const macbookVariant = macbook.variants.find((v) => v.sku === 'MBP14-M3-16-512-SG')!
  const headphonesVariant = sonyHeadphones.variants.find((v) => v.sku === 'SONY-WH5-BLK')!
  const dressVariant = dress.variants.find((v) => v.sku === 'DRESS-FLRL-M')!

  // John — DELIVERED order (February)
  const order1 = await prisma.order.upsert({
    where: { stripePaymentIntentId: 'pi_seed_001_delivered' },
    update: {},
    create: {
      userId: customer1.id,
      status: 'DELIVERED',
      subtotal: 1099.0,
      shippingCost: 0,
      tax: 109.9,
      total: 1208.9,
      shippingAddress: johnShippingAddress,
      billingAddress: johnShippingAddress,
      stripePaymentIntentId: 'pi_seed_001_delivered',
      createdAt: new Date('2026-02-15T10:30:00Z'),
      items: {
        create: [
          {
            variantId: iphoneVariant.id,
            productName: 'iPhone 15 Pro',
            variantName: '256GB / Black Titanium',
            price: 1099.0,
            quantity: 1,
          },
        ],
      },
    },
  })

  // John — PENDING order (recent)
  await prisma.order.upsert({
    where: { stripePaymentIntentId: 'pi_seed_002_pending' },
    update: {},
    create: {
      userId: customer1.id,
      status: 'PENDING',
      subtotal: 349.99,
      shippingCost: 9.99,
      tax: 35.0,
      total: 394.98,
      shippingAddress: johnShippingAddress,
      billingAddress: johnShippingAddress,
      stripePaymentIntentId: 'pi_seed_002_pending',
      items: {
        create: [
          {
            variantId: headphonesVariant.id,
            productName: 'Sony WH-1000XM5',
            variantName: 'Black',
            price: 349.99,
            quantity: 1,
          },
        ],
      },
    },
  })

  // Jane — SHIPPED order (March) with coupon
  const order3 = await prisma.order.upsert({
    where: { stripePaymentIntentId: 'pi_seed_003_shipped' },
    update: {},
    create: {
      userId: customer2.id,
      status: 'SHIPPED',
      subtotal: 2078.99,
      shippingCost: 0,
      tax: 207.9,
      discountAmount: 20.0,
      total: 2266.89,
      couponCode: 'SAVE20',
      shippingAddress: janeShippingAddress,
      billingAddress: janeShippingAddress,
      stripePaymentIntentId: 'pi_seed_003_shipped',
      createdAt: new Date('2026-03-10T14:00:00Z'),
      items: {
        create: [
          {
            variantId: macbookVariant.id,
            productName: 'MacBook Pro 14"',
            variantName: 'M3 / 16GB / 512GB / Space Gray',
            price: 1999.0,
            quantity: 1,
          },
          {
            variantId: dressVariant.id,
            productName: "Women's Summer Dress",
            variantName: 'Floral / M',
            price: 79.99,
            quantity: 1,
          },
        ],
      },
    },
  })

  console.log('✅  Orders seeded (3)')

  // ─── Reviews ────────────────────────────────────────────────────────────────

  await Promise.all([
    prisma.review.upsert({
      where: { userId_productId: { userId: customer1.id, productId: iphone.id } },
      update: {},
      create: {
        userId: customer1.id,
        productId: iphone.id,
        rating: 5,
        title: 'Best iPhone yet!',
        body: 'The titanium design feels incredibly premium and the camera system is absolutely outstanding. Battery life easily gets me through a full day with heavy use.',
        isVerifiedPurchase: true,
      },
    }),
    prisma.review.upsert({
      where: { userId_productId: { userId: customer2.id, productId: macbook.id } },
      update: {},
      create: {
        userId: customer2.id,
        productId: macbook.id,
        rating: 5,
        title: 'Incredible performance, all-day battery',
        body: "The M3 chip is in a league of its own. Compiles my large projects in seconds, runs multiple VMs without breaking a sweat, and the battery genuinely lasts all day. Best laptop I've ever owned.",
        isVerifiedPurchase: true,
      },
    }),
    prisma.review.upsert({
      where: { userId_productId: { userId: customer1.id, productId: sonyHeadphones.id } },
      update: {},
      create: {
        userId: customer1.id,
        productId: sonyHeadphones.id,
        rating: 4,
        title: 'Top-tier noise cancellation',
        body: 'The noise cancellation is class-leading — near-silent on a busy train. Very comfortable for long sessions. Minor gripe: the companion app sometimes loses its Bluetooth connection.',
        isVerifiedPurchase: false,
      },
    }),
    prisma.review.upsert({
      where: { userId_productId: { userId: customer2.id, productId: dress.id } },
      update: {},
      create: {
        userId: customer2.id,
        productId: dress.id,
        rating: 5,
        title: 'Perfect for summer',
        body: "Gorgeous floral print and the linen-cotton fabric is so lightweight and breathable. Fits true to size. I've already ordered a second one in Sky Blue.",
        isVerifiedPurchase: true,
      },
    }),
  ])

  console.log('✅  Reviews seeded (4)')

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log('\n🎉 Database seeded successfully!\n')
  console.log('📋 Seed credentials:')
  console.log('   Admin:      admin@example.com      / Admin123!')
  console.log('   Customer 1: john.doe@example.com   / Customer123!')
  console.log('   Customer 2: jane.smith@example.com / Customer123!\n')

  // Suppress unused variable warnings — these are available for future use
  void admin
  void order1
  void order3
  void samsung
  void polo
  void cookware
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('\n❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
