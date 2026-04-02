/**
 * OpenAPI 3.0 specification for the E-Commerce Platform API.
 *
 * Served at GET /v1/docs (Swagger UI) and GET /v1/docs.json (raw JSON).
 */

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'E-Commerce Platform API',
    version: '1.0.0',
    description:
      'REST API for the E-Commerce Platform. All endpoints are prefixed with `/v1`.\n\n' +
      '**Auth note:** Authentication endpoints (Phase 3) are not yet live. ' +
      'Endpoints marked 🔒 require a Bearer JWT once auth is wired.',
    contact: { name: 'API Support', email: 'support@example.com' },
  },
  servers: [
    { url: 'http://localhost:4000/v1', description: 'Local development' },
    { url: 'https://api.yourdomain.com/v1', description: 'Production' },
  ],

  // ─── Security scheme ────────────────────────────────────────────────────────
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT issued by POST /auth/login',
      },
    },

    // ─── Reusable schemas ──────────────────────────────────────────────────────
    schemas: {
      // ── Primitives ──
      Cuid: { type: 'string', example: 'clh3xfzvy0000356ok9cxx5oi' },
      Decimal: {
        type: 'string',
        pattern: '^\\d+(\\.\\d{1,2})?$',
        example: '19.99',
      },
      OrderStatus: {
        type: 'string',
        enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
      },

      // ── Envelopes ──
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
        },
        required: ['success', 'data'],
      },
      PaginatedEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: {} },
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
        required: ['success', 'data', 'meta'],
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
              message: { type: 'string', example: 'Product not found' },
              details: { type: 'array', items: {} },
              requestId: { type: 'string', example: 'clh3xfzvy0000356ok9cxx5oi' },
            },
            required: ['code', 'message'],
          },
        },
        required: ['success', 'error'],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 3 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
        required: ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPrevPage'],
      },

      // ── Category ──
      Category: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          name: { type: 'string', example: 'Electronics' },
          slug: { type: 'string', example: 'electronics' },
          imageUrl: { type: 'string', nullable: true, example: null },
          parentId: { $ref: '#/components/schemas/Cuid', nullable: true },
          isActive: { type: 'boolean', example: true },
          sortOrder: { type: 'integer', example: 0 },
          _count: {
            type: 'object',
            properties: { products: { type: 'integer', example: 12 } },
          },
        },
      },
      CreateCategoryBody: {
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string', maxLength: 255, example: 'Laptops' },
          slug: { type: 'string', maxLength: 255, example: 'laptops' },
          imageUrl: { type: 'string', format: 'uri', example: 'https://cdn.example.com/laptops.jpg' },
          parentId: { $ref: '#/components/schemas/Cuid' },
          isActive: { type: 'boolean', default: true },
          sortOrder: { type: 'integer', minimum: 0, default: 0 },
        },
      },

      // ── Product ──
      ProductImage: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          url: { type: 'string', example: 'https://cdn.example.com/widget.jpg' },
          altText: { type: 'string', nullable: true, example: 'Widget front view' },
          sortOrder: { type: 'integer', example: 0 },
        },
      },
      ProductVariant: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          productId: { $ref: '#/components/schemas/Cuid' },
          sku: { type: 'string', example: 'WGT-L-BLK' },
          name: { type: 'string', example: 'Large / Black' },
          price: { $ref: '#/components/schemas/Decimal' },
          stock: { type: 'integer', example: 42 },
          isActive: { type: 'boolean', example: true },
          attributes: { type: 'object', additionalProperties: true, example: { size: 'L', color: 'Black' } },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          name: { type: 'string', example: 'Premium Widget' },
          slug: { type: 'string', example: 'premium-widget' },
          description: { type: 'string', nullable: true, example: 'A top-quality widget.' },
          basePrice: { $ref: '#/components/schemas/Decimal' },
          comparePrice: { $ref: '#/components/schemas/Decimal', nullable: true },
          isActive: { type: 'boolean', example: true },
          isFeatured: { type: 'boolean', example: false },
          category: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/Cuid' },
              name: { type: 'string', example: 'Electronics' },
              slug: { type: 'string', example: 'electronics' },
            },
          },
          images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
          variants: { type: 'array', items: { $ref: '#/components/schemas/ProductVariant' } },
          _count: {
            type: 'object',
            properties: { reviews: { type: 'integer', example: 5 } },
          },
        },
      },
      CreateProductBody: {
        type: 'object',
        required: ['name', 'slug', 'categoryId', 'basePrice'],
        properties: {
          name: { type: 'string', maxLength: 255, example: 'Premium Widget' },
          slug: { type: 'string', maxLength: 255, example: 'premium-widget' },
          description: { type: 'string', example: 'A top-quality widget.' },
          categoryId: { $ref: '#/components/schemas/Cuid' },
          basePrice: { $ref: '#/components/schemas/Decimal' },
          comparePrice: { $ref: '#/components/schemas/Decimal' },
          isActive: { type: 'boolean', default: true },
          isFeatured: { type: 'boolean', default: false },
        },
      },
      CreateVariantBody: {
        type: 'object',
        required: ['sku', 'name', 'price'],
        properties: {
          sku: { type: 'string', maxLength: 100, example: 'WGT-L-BLK' },
          name: { type: 'string', maxLength: 255, example: 'Large / Black' },
          price: { $ref: '#/components/schemas/Decimal' },
          stock: { type: 'integer', minimum: 0, default: 0, example: 50 },
          attributes: { type: 'object', additionalProperties: true, example: { size: 'L', color: 'Black' } },
          isActive: { type: 'boolean', default: true },
        },
      },
      StockAdjustBody: {
        type: 'object',
        required: ['operation', 'quantity'],
        properties: {
          operation: { type: 'string', enum: ['set', 'add', 'subtract'] },
          quantity: { type: 'integer', minimum: 0, example: 10 },
        },
      },

      // ── Cart ──
      CartItem: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          cartId: { $ref: '#/components/schemas/Cuid' },
          variantId: { $ref: '#/components/schemas/Cuid' },
          quantity: { type: 'integer', example: 2 },
          variant: { $ref: '#/components/schemas/ProductVariant' },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          userId: { $ref: '#/components/schemas/Cuid', nullable: true },
          sessionId: { type: 'string', nullable: true, example: 'sess_abc123' },
          items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
        },
      },
      AddToCartBody: {
        type: 'object',
        required: ['variantId', 'quantity'],
        properties: {
          variantId: { $ref: '#/components/schemas/Cuid' },
          quantity: { type: 'integer', minimum: 1, example: 2 },
        },
      },
      UpdateCartItemBody: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'integer', minimum: 1, example: 3 },
        },
      },

      // ── Order ──
      OrderItem: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          productName: { type: 'string', example: 'Premium Widget' },
          variantName: { type: 'string', example: 'Large / Black' },
          price: { $ref: '#/components/schemas/Decimal' },
          quantity: { type: 'integer', example: 2 },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          userId: { $ref: '#/components/schemas/Cuid' },
          status: { $ref: '#/components/schemas/OrderStatus' },
          subtotal: { $ref: '#/components/schemas/Decimal' },
          shippingCost: { $ref: '#/components/schemas/Decimal' },
          tax: { $ref: '#/components/schemas/Decimal' },
          total: { $ref: '#/components/schemas/Decimal' },
          discountAmount: { $ref: '#/components/schemas/Decimal' },
          couponCode: { type: 'string', nullable: true, example: 'SAVE10' },
          shippingAddress: { type: 'object', additionalProperties: true },
          billingAddress: { type: 'object', additionalProperties: true },
          notes: { type: 'string', nullable: true },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateOrderBody: {
        type: 'object',
        required: ['items', 'shippingAddressId'],
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['variantId', 'quantity'],
              properties: {
                variantId: { $ref: '#/components/schemas/Cuid' },
                quantity: { type: 'integer', minimum: 1, example: 2 },
              },
            },
          },
          shippingAddressId: { $ref: '#/components/schemas/Cuid' },
          billingAddressId: { $ref: '#/components/schemas/Cuid' },
          couponCode: { type: 'string', example: 'SAVE10' },
          notes: { type: 'string', maxLength: 1000, example: 'Leave at front door' },
        },
      },
      UpdateOrderStatusBody: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { $ref: '#/components/schemas/OrderStatus' },
        },
      },

      // ── Review ──
      Review: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          productId: { $ref: '#/components/schemas/Cuid' },
          userId: { $ref: '#/components/schemas/Cuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
          title: { type: 'string', nullable: true, example: 'Great product' },
          body: { type: 'string', nullable: true, example: 'Really enjoyed using this.' },
          isVerifiedPurchase: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/Cuid' },
              firstName: { type: 'string', example: 'Alice' },
              lastName: { type: 'string', example: 'Smith' },
              avatarUrl: { type: 'string', nullable: true },
            },
          },
        },
      },
      RatingSummary: {
        type: 'object',
        properties: {
          average: { type: 'number', nullable: true, example: 4.3 },
          count: { type: 'integer', example: 28 },
          distribution: {
            type: 'object',
            properties: {
              1: { type: 'integer', example: 1 },
              2: { type: 'integer', example: 2 },
              3: { type: 'integer', example: 4 },
              4: { type: 'integer', example: 8 },
              5: { type: 'integer', example: 13 },
            },
          },
        },
      },
      CreateReviewBody: {
        type: 'object',
        required: ['productId', 'rating'],
        properties: {
          productId: { $ref: '#/components/schemas/Cuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          title: { type: 'string', maxLength: 255, example: 'Excellent!' },
          body: { type: 'string', example: 'Highly recommend.' },
        },
      },
      UpdateReviewBody: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
          title: { type: 'string', maxLength: 255, example: 'Updated title' },
          body: { type: 'string', example: 'Updated body text.' },
        },
      },

      // ── Inventory ──
      InventoryVariant: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          sku: { type: 'string', example: 'WGT-L-BLK' },
          name: { type: 'string', example: 'Large / Black' },
          stock: { type: 'integer', example: 42 },
          isActive: { type: 'boolean', example: true },
          product: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/Cuid' },
              name: { type: 'string', example: 'Premium Widget' },
              slug: { type: 'string', example: 'premium-widget' },
            },
          },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      StockSummary: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 120 },
          outOfStock: { type: 'integer', example: 3 },
          lowStock: { type: 'integer', example: 8 },
          threshold: { type: 'integer', example: 10 },
        },
      },
      BulkUpdateBody: {
        type: 'object',
        required: ['updates'],
        properties: {
          updates: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: {
              type: 'object',
              required: ['variantId', 'operation', 'quantity'],
              properties: {
                variantId: { $ref: '#/components/schemas/Cuid' },
                operation: { type: 'string', enum: ['set', 'add', 'subtract'] },
                quantity: { type: 'integer', minimum: 0, example: 50 },
              },
            },
          },
        },
      },

      // ── Wishlist ──
      WishlistItem: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid' },
          productId: { $ref: '#/components/schemas/Cuid' },
          createdAt: { type: 'string', format: 'date-time' },
          product: {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/Cuid' },
              name: { type: 'string', example: 'Premium Widget' },
              slug: { type: 'string', example: 'premium-widget' },
              basePrice: { $ref: '#/components/schemas/Decimal' },
              images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
            },
          },
        },
      },
      Wishlist: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/Cuid', nullable: true },
          userId: { $ref: '#/components/schemas/Cuid' },
          items: { type: 'array', items: { $ref: '#/components/schemas/WishlistItem' } },
          _count: {
            type: 'object',
            properties: { items: { type: 'integer', example: 4 } },
          },
        },
      },
      AddToWishlistBody: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { $ref: '#/components/schemas/Cuid' },
        },
      },
    },

    // ─── Reusable parameters ──────────────────────────────────────────────────
    parameters: {
      idParam: {
        in: 'path',
        name: 'id',
        required: true,
        schema: { $ref: '#/components/schemas/Cuid' },
        description: 'Resource CUID',
      },
      pageParam: {
        in: 'query',
        name: 'page',
        schema: { type: 'integer', minimum: 1, default: 1 },
      },
      limitParam: {
        in: 'query',
        name: 'limit',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
    },

    // ─── Reusable responses ───────────────────────────────────────────────────
    responses: {
      BadRequest: {
        description: 'Validation error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Unauthorized: {
        description: 'Authentication required',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Conflict: {
        description: 'Resource already exists',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
    },
  },

  // ─── Tags ───────────────────────────────────────────────────────────────────
  tags: [
    { name: 'Health', description: 'System health check' },
    { name: 'Categories', description: 'Product categories (nested tree)' },
    { name: 'Products', description: 'Product catalog and variants' },
    { name: 'Cart', description: 'Shopping cart (guest or authenticated)' },
    { name: 'Orders', description: '🔒 Order management' },
    { name: 'Reviews', description: 'Product reviews and ratings' },
    { name: 'Inventory', description: 'Stock management (admin)' },
    { name: 'Wishlist', description: '🔒 User wishlist' },
  ],

  // ─── Paths ──────────────────────────────────────────────────────────────────
  paths: {
    // ── Health ──────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            status: { type: 'string', example: 'ok' },
                            timestamp: { type: 'string', format: 'date-time' },
                            uptime: { type: 'number', example: 3600 },
                            environment: { type: 'string', example: 'production' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },

    // ── Categories ───────────────────────────────────────────────────────────
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        operationId: 'listCategories',
        parameters: [
          {
            in: 'query',
            name: 'flat',
            schema: { type: 'boolean', default: false },
            description: 'Return flat list instead of nested tree',
          },
        ],
        responses: {
          200: {
            description: 'Category list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category',
        operationId: 'createCategory',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateCategoryBody' } } },
        },
        responses: {
          201: {
            description: 'Category created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Category' } } },
                  ],
                },
              },
            },
          },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/categories/{id}': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      get: {
        tags: ['Categories'],
        summary: 'Get category by ID',
        operationId: 'getCategoryById',
        responses: {
          200: {
            description: 'Category',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Category' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
      patch: {
        tags: ['Categories'],
        summary: 'Update category',
        operationId: 'updateCategory',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCategoryBody' },
              example: { name: 'Updated Name' },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated category',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Category' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category',
        operationId: 'deleteCategory',
        responses: {
          204: { description: 'Deleted' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },

    // ── Products ─────────────────────────────────────────────────────────────
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        operationId: 'listProducts',
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Full-text search on name/description' },
          { in: 'query', name: 'categoryId', schema: { $ref: '#/components/schemas/Cuid' } },
          { in: 'query', name: 'minPrice', schema: { $ref: '#/components/schemas/Decimal' } },
          { in: 'query', name: 'maxPrice', schema: { $ref: '#/components/schemas/Decimal' } },
          { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['name', 'basePrice', 'createdAt', 'isFeatured'] } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Paginated product list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } },
                  ],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create product',
        operationId: 'createProduct',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductBody' } } },
        },
        responses: {
          201: {
            description: 'Product created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Product' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/products/{id}': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      get: {
        tags: ['Products'],
        summary: 'Get product by ID',
        operationId: 'getProductById',
        responses: {
          200: {
            description: 'Product detail',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Product' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
      patch: {
        tags: ['Products'],
        summary: 'Update product',
        operationId: 'updateProduct',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProductBody' } } },
        },
        responses: {
          200: {
            description: 'Updated product',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Product' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete product',
        operationId: 'deleteProduct',
        responses: {
          204: { description: 'Deleted' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/products/slug/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by slug',
        operationId: 'getProductBySlug',
        parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Product detail',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Product' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/products/{id}/variants': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      get: {
        tags: ['Products'],
        summary: 'List variants for a product',
        operationId: 'listVariants',
        responses: {
          200: {
            description: 'Variants',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/ProductVariant' } } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create variant',
        operationId: 'createVariant',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateVariantBody' } } },
        },
        responses: {
          201: {
            description: 'Variant created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/ProductVariant' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/products/{id}/variants/{variantId}': {
      parameters: [
        { $ref: '#/components/parameters/idParam' },
        { in: 'path', name: 'variantId', required: true, schema: { $ref: '#/components/schemas/Cuid' } },
      ],
      get: {
        tags: ['Products'],
        summary: 'Get variant',
        operationId: 'getVariant',
        responses: {
          200: {
            description: 'Variant',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/ProductVariant' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Products'],
        summary: 'Update variant',
        operationId: 'updateVariant',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateVariantBody' } } },
        },
        responses: {
          200: {
            description: 'Updated variant',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/ProductVariant' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete variant',
        operationId: 'deleteVariant',
        responses: {
          204: { description: 'Deleted' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/products/{id}/variants/{variantId}/stock': {
      parameters: [
        { $ref: '#/components/parameters/idParam' },
        { in: 'path', name: 'variantId', required: true, schema: { $ref: '#/components/schemas/Cuid' } },
      ],
      patch: {
        tags: ['Products'],
        summary: 'Adjust variant stock',
        operationId: 'adjustStock',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/StockAdjustBody' } } },
        },
        responses: {
          200: {
            description: 'Updated variant',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/ProductVariant' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/products/{id}/reviews': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      get: {
        tags: ['Reviews'],
        summary: 'List reviews for a product',
        operationId: 'listProductReviews',
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { in: 'query', name: 'rating', schema: { type: 'integer', minimum: 1, maximum: 5 } },
          { in: 'query', name: 'verified', schema: { type: 'string', enum: ['true', 'false'] } },
          { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['rating', 'createdAt'] } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Paginated reviews',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Review' } } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/products/{id}/reviews/summary': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      get: {
        tags: ['Reviews'],
        summary: 'Get rating summary for a product',
        operationId: 'getProductRatingSummary',
        responses: {
          200: {
            description: 'Rating summary',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/RatingSummary' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Cart ─────────────────────────────────────────────────────────────────
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get cart',
        operationId: 'getCart',
        description: 'Pass `X-Session-ID` header for guest carts, or a Bearer token for authenticated carts.',
        parameters: [
          { in: 'header', name: 'X-Session-ID', schema: { type: 'string' }, description: 'Guest session ID' },
        ],
        responses: {
          200: {
            description: 'Cart',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Cart' } } },
                  ],
                },
              },
            },
          },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear cart',
        operationId: 'clearCart',
        parameters: [
          { in: 'header', name: 'X-Session-ID', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Cleared cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } },
          },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        operationId: 'addCartItem',
        parameters: [
          { in: 'header', name: 'X-Session-ID', schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddToCartBody' } } },
        },
        responses: {
          201: {
            description: 'Updated cart',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Cart' } } },
                  ],
                },
              },
            },
          },
          409: { description: 'Insufficient stock', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/cart/items/{itemId}': {
      parameters: [
        { in: 'path', name: 'itemId', required: true, schema: { $ref: '#/components/schemas/Cuid' } },
        { in: 'header', name: 'X-Session-ID', schema: { type: 'string' } },
      ],
      patch: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        operationId: 'updateCartItem',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCartItemBody' } } },
        },
        responses: {
          200: {
            description: 'Updated cart',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Cart' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          409: { description: 'Insufficient stock', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove cart item',
        operationId: 'removeCartItem',
        responses: {
          200: {
            description: 'Updated cart',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessEnvelope' } } },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Orders ───────────────────────────────────────────────────────────────
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: '🔒 List orders',
        operationId: 'listOrders',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { in: 'query', name: 'status', schema: { $ref: '#/components/schemas/OrderStatus' } },
          { in: 'query', name: 'userId', schema: { $ref: '#/components/schemas/Cuid' }, description: 'Admin only — filter by user' },
        ],
        responses: {
          200: {
            description: 'Paginated orders',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: '🔒 Create order',
        operationId: 'createOrder',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrderBody' } } },
        },
        responses: {
          201: {
            description: 'Order created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Order' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { description: 'Insufficient stock', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } } },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/orders/{id}': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      get: {
        tags: ['Orders'],
        summary: '🔒 Get order by ID',
        operationId: 'getOrderById',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Order detail',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Order' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/orders/{id}/status': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      patch: {
        tags: ['Orders'],
        summary: '🔒 Update order status (admin)',
        operationId: 'updateOrderStatus',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateOrderStatusBody' } } },
        },
        responses: {
          200: {
            description: 'Updated order',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Order' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/orders/{id}/cancel': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      post: {
        tags: ['Orders'],
        summary: '🔒 Cancel order',
        operationId: 'cancelOrder',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Cancelled order',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Order' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },

    // ── Reviews ──────────────────────────────────────────────────────────────
    '/reviews': {
      post: {
        tags: ['Reviews'],
        summary: '🔒 Create review',
        operationId: 'createReview',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReviewBody' } } },
        },
        responses: {
          201: {
            description: 'Review created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Review' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/reviews/my': {
      get: {
        tags: ['Reviews'],
        summary: '🔒 List my reviews',
        operationId: 'listMyReviews',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
        ],
        responses: {
          200: {
            description: 'Paginated reviews',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Review' } } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/reviews/{id}': {
      parameters: [{ $ref: '#/components/parameters/idParam' }],
      get: {
        tags: ['Reviews'],
        summary: 'Get review by ID',
        operationId: 'getReviewById',
        responses: {
          200: {
            description: 'Review',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Review' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Reviews'],
        summary: '🔒 Update review',
        operationId: 'updateReview',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateReviewBody' } } },
        },
        responses: {
          200: {
            description: 'Updated review',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Review' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Reviews'],
        summary: '🔒 Delete review',
        operationId: 'deleteReview',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Deleted' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Inventory ────────────────────────────────────────────────────────────
    '/inventory': {
      get: {
        tags: ['Inventory'],
        summary: 'List inventory',
        operationId: 'listInventory',
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Filter by name or SKU' },
          { in: 'query', name: 'productId', schema: { $ref: '#/components/schemas/Cuid' } },
          { in: 'query', name: 'minStock', schema: { type: 'integer', minimum: 0 } },
          { in: 'query', name: 'maxStock', schema: { type: 'integer', minimum: 0 } },
          { in: 'query', name: 'isActive', schema: { type: 'string', enum: ['true', 'false'] } },
          { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['stock', 'name', 'sku', 'updatedAt'] } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Paginated inventory',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/InventoryVariant' } } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/inventory/summary': {
      get: {
        tags: ['Inventory'],
        summary: 'Get stock summary',
        operationId: 'getStockSummary',
        responses: {
          200: {
            description: 'Stock summary',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/StockSummary' } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/inventory/low-stock': {
      get: {
        tags: ['Inventory'],
        summary: 'List low-stock variants',
        operationId: 'listLowStock',
        parameters: [
          { $ref: '#/components/parameters/pageParam' },
          { $ref: '#/components/parameters/limitParam' },
          { in: 'query', name: 'threshold', schema: { type: 'integer', minimum: 0, default: 10 }, description: 'Stock level threshold' },
        ],
        responses: {
          200: {
            description: 'Low-stock variants',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/InventoryVariant' } } } },
                  ],
                },
              },
            },
          },
        },
      },
    },
    '/inventory/sku/{sku}': {
      parameters: [{ in: 'path', name: 'sku', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Inventory'],
        summary: 'Get variant by SKU',
        operationId: 'getVariantBySku',
        responses: {
          200: {
            description: 'Variant',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/InventoryVariant' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/inventory/bulk': {
      patch: {
        tags: ['Inventory'],
        summary: 'Bulk update stock',
        operationId: 'bulkUpdateStock',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkUpdateBody' } } },
        },
        responses: {
          200: {
            description: 'Updated variants',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/InventoryVariant' } } } },
                  ],
                },
              },
            },
          },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },

    // ── Wishlist ─────────────────────────────────────────────────────────────
    '/wishlist': {
      get: {
        tags: ['Wishlist'],
        summary: '🔒 Get wishlist',
        operationId: 'getWishlist',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Wishlist with items',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Wishlist' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Wishlist'],
        summary: '🔒 Clear wishlist',
        operationId: 'clearWishlist',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Cleared' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/wishlist/items': {
      post: {
        tags: ['Wishlist'],
        summary: '🔒 Add item to wishlist',
        operationId: 'addWishlistItem',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddToWishlistBody' } } },
        },
        responses: {
          201: {
            description: 'Wishlist item created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/WishlistItem' } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
          422: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/wishlist/items/{productId}': {
      parameters: [
        { in: 'path', name: 'productId', required: true, schema: { $ref: '#/components/schemas/Cuid' } },
      ],
      get: {
        tags: ['Wishlist'],
        summary: '🔒 Check if product is wishlisted',
        operationId: 'checkWishlistItem',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Wishlist status',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { type: 'object', properties: { wishlisted: { type: 'boolean', example: true } } } } },
                  ],
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Wishlist'],
        summary: '🔒 Remove item from wishlist',
        operationId: 'removeWishlistItem',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Removed' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
} as const

export default spec
