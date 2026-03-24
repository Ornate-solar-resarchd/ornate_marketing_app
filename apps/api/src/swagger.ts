export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Ornate Solar — Marketing Collateral Hub API",
    description: "API documentation for the Ornate Solar Marketing Collateral Hub. Manage categories, companies, documents, uploads, shares, and admin operations.",
    version: "1.0.0",
    contact: { name: "Ornate Solar", url: "https://ornatesolar.com" },
  },
  servers: [
    { url: "https://marketing-backend.ornatesolar.com/api", description: "Production" },
    { url: "http://localhost:4000/api", description: "Local Development" },
  ],
  tags: [
    { name: "Health", description: "Health check" },
    { name: "Categories", description: "Category management" },
    { name: "Companies", description: "Company management" },
    { name: "Documents", description: "Document operations (requires auth)" },
    { name: "Upload", description: "File upload (requires auth + upload permission)" },
    { name: "Share", description: "Share documents via public links" },
    { name: "Search", description: "Search across all documents" },
    { name: "Admin", description: "Admin operations (requires super_admin role)" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Clerk JWT token from frontend",
      },
    },
    schemas: {
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string", example: "ornate-products" },
          label: { type: "string", example: "Ornate Solar Products" },
          icon: { type: "string", example: "☀️" },
          order: { type: "integer" },
          _count: { type: "object", properties: { companies: { type: "integer" } } },
        },
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string", example: "bess" },
          label: { type: "string", example: "UnityESS" },
          icon: { type: "string" },
          color: { type: "string", example: "#006297" },
          logoUrl: { type: "string" },
          websiteUrl: { type: "string" },
          docTypes: { type: "array", items: { type: "string" } },
          category: { type: "object", properties: { label: { type: "string" }, slug: { type: "string" } } },
          _count: { type: "object", properties: { documents: { type: "integer" } } },
        },
      },
      Document: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          originalName: { type: "string" },
          fileKey: { type: "string" },
          fileUrl: { type: "string" },
          mimeType: { type: "string" },
          sizeBytes: { type: "integer" },
          docType: { type: "string", example: "brochure" },
          companyId: { type: "string" },
          uploadedBy: { type: "string" },
          uploaderName: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          code: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "API is running",
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" }, timestamp: { type: "string" } } } } },
          },
        },
      },
    },
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List all categories with company counts",
        responses: {
          "200": {
            description: "Array of categories",
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Category" } } } },
          },
        },
      },
    },
    "/categories/{slug}": {
      get: {
        tags: ["Categories"],
        summary: "Get single category with its companies",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" }, example: "ornate-products" }],
        responses: {
          "200": { description: "Category with companies", content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } } },
          "404": { description: "Category not found" },
        },
      },
    },
    "/companies/{id}": {
      get: {
        tags: ["Companies"],
        summary: "Get single company by ID or slug",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Company details", content: { "application/json": { schema: { $ref: "#/components/schemas/Company" } } } },
          "404": { description: "Company not found" },
        },
      },
    },
    "/companies/{id}/documents": {
      get: {
        tags: ["Documents"],
        summary: "Get all documents for a company (grouped by docType)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Documents grouped by docType",
            content: { "application/json": { schema: { type: "object", additionalProperties: { type: "array", items: { $ref: "#/components/schemas/Document" } } } } },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/companies/{id}/documents/{docType}": {
      get: {
        tags: ["Documents"],
        summary: "Get documents for one section",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "docType", in: "path", required: true, schema: { type: "string" }, example: "brochure" },
        ],
        responses: {
          "200": { description: "Array of documents", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Document" } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/documents/{id}/view-url": {
      post: {
        tags: ["Documents"],
        summary: "Generate S3 signed URL for viewing (1h expiry)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Signed URL for viewing",
            content: { "application/json": { schema: { type: "object", properties: { signedUrl: { type: "string" }, document: { $ref: "#/components/schemas/Document" } } } } },
          },
          "401": { description: "Unauthorized" },
          "404": { description: "Document not found" },
        },
      },
    },
    "/documents/{id}": {
      delete: {
        tags: ["Documents"],
        summary: "Delete a document",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Document deleted" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
          "404": { description: "Document not found" },
        },
      },
    },
    "/upload": {
      post: {
        tags: ["Upload"],
        summary: "Upload files to a company's document section",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["companyId", "docType", "files"],
                properties: {
                  companyId: { type: "string", description: "Company ID" },
                  docType: { type: "string", description: "Document type key", example: "brochure" },
                  files: { type: "array", items: { type: "string", format: "binary" }, description: "Files to upload" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Upload successful", content: { "application/json": { schema: { type: "object", properties: { documents: { type: "array", items: { $ref: "#/components/schemas/Document" } } } } } } },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden — no upload permission" },
          "429": { description: "Rate limited (20 requests/minute)" },
        },
      },
    },
    "/documents/{id}/share": {
      post: {
        tags: ["Share"],
        summary: "Generate a share link for a document (24h expiry)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Share link generated",
            content: { "application/json": { schema: { type: "object", properties: { shareUrl: { type: "string" }, shareToken: { type: "string" }, expiresAt: { type: "string", format: "date-time" } } } } },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/share/{token}": {
      get: {
        tags: ["Share"],
        summary: "Access shared document (public — no auth)",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Signed URL for download",
            content: { "application/json": { schema: { type: "object", properties: { signedUrl: { type: "string" }, document: { $ref: "#/components/schemas/Document" } } } } },
          },
          "404": { description: "Link expired or not found" },
        },
      },
    },
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Search documents across all companies",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category slug" },
          { name: "docType", in: "query", schema: { type: "string" }, description: "Filter by document type" },
          { name: "mimeType", in: "query", schema: { type: "string" }, description: "Filter by MIME type prefix" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["date", "name", "size"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 30 } },
        ],
        responses: {
          "200": {
            description: "Search results grouped by company",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: { type: "array", items: { type: "object" } },
                    total: { type: "integer" },
                    page: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List all users with roles",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "Array of users" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden — super_admin only" },
        },
      },
    },
    "/admin/users/{id}/role": {
      patch: {
        tags: ["Admin"],
        summary: "Update user role",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { role: { type: "string", enum: ["super_admin", "admin", "manager", "viewer"] } } } } },
        },
        responses: {
          "200": { description: "Role updated" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/admin/audit-logs": {
      get: {
        tags: ["Admin"],
        summary: "Get audit logs",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", default: 50 } }],
        responses: {
          "200": { description: "Array of audit log entries" },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
    },
  },
};
