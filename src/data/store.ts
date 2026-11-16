import fs from 'fs';
import path from 'path';
import { Property, PROPERTIES } from './properties';
import { BlogArticle, INITIAL_BLOGS } from './blogs';

export interface Inquiry {
  id: string;
  type: 'Showing' | 'Instant Offer' | 'General Consultation' | 'Interior Design' | 'Turnkey Construction' | 'Builder JV Mandate';
  name: string;
  phone: string;
  email?: string;
  propertyTitle?: string;
  date?: string;
  notes?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  createdAt: string;
}

interface DatabaseSchema {
  properties: Property[];
  blogs: BlogArticle[];
  inquiries: Inquiry[];
}

const DB_FILE = path.join(process.cwd(), 'src', 'data', 'db.json');

// Shared cache. Next.js bundles API routes and pages separately, so a plain module-level
// variable would give each bundle its own copy and they would never see each other's
// writes. Keeping it on globalThis shares one copy, and the file's modified time is checked
// on every read so changes made by anything else (another process, manual edits) are picked up.
const globalForDb = globalThis as unknown as {
  __realicDb?: { data: DatabaseSchema; mtimeMs: number };
};

function fileMtime(): number {
  try {
    return fs.statSync(DB_FILE).mtimeMs;
  } catch {
    return 0;
  }
}

const DEFAULT_AUTHOR_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
const DEFAULT_COVER_IMAGE =
  '/images/projects/venus-capital-heights/palatial-tower-facade-elevation.jpg';

function formatReadableDate(val?: string | null): string {
  if (!val) {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return String(val);
}

export function normalizeBlog(raw: any, existing?: BlogArticle): BlogArticle {
  const base = existing ? { ...existing, ...raw } : { ...raw };

  const title = String(base.title || 'Untitled Article').trim();
  const cleanSlug = String(
    base.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
  ).trim();

  const id = String(base.id || cleanSlug || `blog-${Date.now()}`);

  // Author resolution (supports both Klane string `author` and Realic object `author`)
  const rawAuthor = raw?.author !== undefined ? raw.author : existing?.author;
  let authorName = 'Amit Vikram';
  let authorRole = 'Managing Director, Bihar & Eastern Corridor';
  let authorAvatar = DEFAULT_AUTHOR_AVATAR;

  if (typeof rawAuthor === 'string' && rawAuthor.trim()) {
    authorName = rawAuthor.trim();
    authorRole =
      raw?.author_role ??
      raw?.authorRole ??
      existing?.author?.role ??
      existing?.author_role ??
      authorRole;
    authorAvatar =
      raw?.author_avatar ??
      raw?.authorAvatar ??
      existing?.author?.avatar ??
      existing?.author_avatar ??
      authorAvatar;
  } else if (rawAuthor && typeof rawAuthor === 'object') {
    authorName =
      rawAuthor.name ||
      raw?.author_name ||
      raw?.authorName ||
      existing?.author?.name ||
      authorName;
    authorRole =
      rawAuthor.role ||
      raw?.author_role ||
      raw?.authorRole ||
      existing?.author?.role ||
      authorRole;
    authorAvatar =
      rawAuthor.avatar ||
      raw?.author_avatar ||
      raw?.authorAvatar ||
      existing?.author?.avatar ||
      authorAvatar;
  } else if (raw?.author_name || raw?.authorName) {
    authorName = raw.author_name || raw.authorName;
    authorRole = raw.author_role || raw.authorRole || existing?.author?.role || authorRole;
    authorAvatar = raw.author_avatar || raw.authorAvatar || existing?.author?.avatar || authorAvatar;
  }

  // Cover image resolution
  const coverImage =
    raw?.featured_image !== undefined
      ? raw.featured_image || raw.coverImage || DEFAULT_COVER_IMAGE
      : raw?.coverImage !== undefined
      ? raw.coverImage || DEFAULT_COVER_IMAGE
      : existing?.coverImage || existing?.featured_image || DEFAULT_COVER_IMAGE;

  // Read time resolution
  const readTime =
    raw?.read_time ||
    raw?.readTime ||
    existing?.readTime ||
    existing?.read_time ||
    '5 min read';

  // Published date resolution
  const rawPublished =
    raw?.published_at !== undefined
      ? raw.published_at
      : raw?.publishedAt !== undefined
      ? raw.publishedAt
      : existing?.published_at || existing?.publishedAt;
  const publishedAt = formatReadableDate(rawPublished);
  const published_at = rawPublished || publishedAt;

  // Status resolution
  const status: 'draft' | 'published' =
    base.status === 'draft' ? 'draft' : 'published';

  // Featured resolution
  const featured =
    raw?.featured !== undefined
      ? Boolean(raw.featured === 1 || raw.featured === true || raw.featured === '1')
      : Boolean(existing?.featured);

  // Tags resolution
  let tags: string[] = [];
  const rawTags = raw?.tags !== undefined ? raw.tags : existing?.tags;
  if (Array.isArray(rawTags)) {
    tags = rawTags.map((t: any) => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === 'string') {
    tags = rawTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Keywords resolution
  let keywords: string[] = tags;
  const rawKeywords = raw?.keywords !== undefined ? raw.keywords : existing?.keywords;
  if (Array.isArray(rawKeywords)) {
    keywords = rawKeywords.map((k: any) => String(k).trim()).filter(Boolean);
  } else if (typeof rawKeywords === 'string' && rawKeywords.trim()) {
    keywords = rawKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  // Meta title & description resolution
  const metaTitle =
    raw?.meta_title !== undefined
      ? raw.meta_title || ''
      : raw?.metaTitle !== undefined
      ? raw.metaTitle || ''
      : existing?.metaTitle || existing?.meta_title || `${title} | Realic Property Consultant`;

  const metaDescription =
    raw?.meta_description !== undefined
      ? raw.meta_description || ''
      : raw?.metaDescription !== undefined
      ? raw.metaDescription || ''
      : existing?.metaDescription || existing?.meta_description || base.excerpt || '';

  // Content resolution
  const content =
    typeof base.content === 'string'
      ? base.content
      : JSON.stringify(base.content || []);

  const nowIso = new Date().toISOString();

  return {
    id,
    slug: cleanSlug,
    title,
    title_hindi: base.title_hindi ?? existing?.title_hindi ?? '',
    excerpt: base.excerpt ?? existing?.excerpt ?? '',
    content,
    category: base.category || existing?.category || 'Market Trends',
    category_hindi: base.category_hindi ?? existing?.category_hindi ?? '',
    coverImage,
    featured_image: coverImage,
    author: {
      name: authorName,
      role: authorRole,
      avatar: authorAvatar,
    },
    author_name: authorName,
    author_role: authorRole,
    author_avatar: authorAvatar,
    status,
    publishedAt,
    published_at,
    readTime,
    read_time: readTime,
    tags,
    featured,
    metaTitle,
    meta_title: metaTitle,
    metaDescription,
    meta_description: metaDescription,
    keywords,
    canonicalUrl: base.canonicalUrl ?? existing?.canonicalUrl ?? '',
    relatedPropertyIds: Array.isArray(base.relatedPropertyIds)
      ? base.relatedPropertyIds
      : existing?.relatedPropertyIds || [],
    created_at: base.created_at || existing?.created_at || nowIso,
    updated_at: nowIso,
  };
}

// Shared cache (see globalForDb above) with a modified-time check, so Admin Panel edits and
// SSR/API routes stay in sync without re-reading and re-normalising the file on every call.
function initializeDb(): DatabaseSchema {
  const cached = globalForDb.__realicDb;
  if (cached && cached.mtimeMs === fileMtime()) {
    return cached.data;
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DatabaseSchema;
      if (parsed && Array.isArray(parsed.blogs)) {
        parsed.blogs = parsed.blogs.map((b) => normalizeBlog(b));
      }
      globalForDb.__realicDb = { data: parsed, mtimeMs: fileMtime() };
      return parsed;
    } catch (e) {
      console.error('Error reading db.json, reinitializing from defaults', e);
    }
  }

  const initialData: DatabaseSchema = {
    properties: PROPERTIES,
    blogs: INITIAL_BLOGS.map((b) => normalizeBlog(b)),
    inquiries: [
      {
        id: 'inq-1',
        type: 'Showing',
        name: 'Dr. Anand Kishore',
        phone: '+91 94310 88221',
        email: 'anand.kishore@gmail.com',
        propertyTitle: '3 BHK Luxury Sky Penthouse on Bailey Road',
        date: '2026-09-20',
        notes: 'Interested in Sunday afternoon in-person walkthrough and RERA document review.',
        status: 'New',
        createdAt: '2026-09-17 14:30',
      },
      {
        id: 'inq-2',
        type: 'Instant Offer',
        name: 'Suresh Singhania',
        phone: '+91 98450 77123',
        email: 'suresh@singhania.com',
        propertyTitle: 'Waterfront Villa at Bellandur Lake',
        notes: 'Looking for 30-day closing valuation for ancestral home in Patna Patliputra.',
        status: 'Contacted',
        createdAt: '2026-09-16 11:15',
      },
    ],
  };

  saveDb(initialData);
  return globalForDb.__realicDb!.data;
}

function saveDb(data: DatabaseSchema) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    globalForDb.__realicDb = { data, mtimeMs: fileMtime() };
  } catch (e) {
    console.error('Error saving db.json', e);
    // Keep serving the in-memory copy even if the disk is read-only.
    globalForDb.__realicDb = { data, mtimeMs: fileMtime() };
  }
}

// Properties Methods
export function getAllProperties(): Property[] {
  const db = initializeDb();
  return db.properties;
}

export function getPropertyByIdOrSlug(idOrSlug: string): Property | undefined {
  const db = initializeDb();
  return db.properties.find((p) => p.slug === idOrSlug || p.id === idOrSlug);
}

export function createProperty(newProp: Omit<Property, 'id' | 'slug'>): Property {
  const db = initializeDb();
  const slug = newProp.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const id = `prop-${Date.now()}`;

  const property: Property = {
    ...newProp,
    id,
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
  };

  db.properties.unshift(property);
  saveDb(db);
  return property;
}

export function updateProperty(id: string, updates: Partial<Property>): Property | null {
  const db = initializeDb();
  const idx = db.properties.findIndex((p) => p.id === id || p.slug === id);
  if (idx === -1) return null;

  db.properties[idx] = {
    ...db.properties[idx],
    ...updates,
  };
  saveDb(db);
  return db.properties[idx];
}

export function deleteProperty(id: string): boolean {
  const db = initializeDb();
  const initialLen = db.properties.length;
  db.properties = db.properties.filter((p) => p.id !== id && p.slug !== id);
  if (db.properties.length !== initialLen) {
    saveDb(db);
    return true;
  }
  return false;
}

// Blogs Methods
export function getAllBlogs(includeDrafts: boolean = false): BlogArticle[] {
  const db = initializeDb();
  if (includeDrafts) {
    return db.blogs;
  }
  return db.blogs.filter((b) => b.status !== 'draft');
}

export function getBlogBySlug(slugOrId: string, includeDrafts: boolean = true): BlogArticle | undefined {
  const db = initializeDb();
  const decoded = decodeURIComponent(String(slugOrId)).trim().toLowerCase();
  const found = db.blogs.find(
    (b) =>
      String(b.slug).toLowerCase() === decoded ||
      String(b.id).toLowerCase() === decoded
  );
  if (!found) return undefined;
  if (!includeDrafts && found.status === 'draft') return undefined;
  return found;
}

export function createBlog(newBlog: any): BlogArticle {
  const db = initializeDb();

  let desiredSlug = String(
    newBlog.slug ||
      newBlog.title
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') ||
      `post-${Date.now()}`
  ).trim();

  // Only append suffix if slug already exists
  if (db.blogs.some((b) => b.slug.toLowerCase() === desiredSlug.toLowerCase())) {
    desiredSlug = `${desiredSlug}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const id = newBlog.id ? String(newBlog.id) : desiredSlug;

  const article = normalizeBlog({
    ...newBlog,
    id,
    slug: desiredSlug,
  });

  db.blogs.unshift(article);
  saveDb(db);
  return article;
}

export function updateBlog(idOrSlug: string, updates: any): BlogArticle | null {
  const db = initializeDb();
  const decoded = decodeURIComponent(String(idOrSlug)).trim().toLowerCase();
  const idx = db.blogs.findIndex(
    (b) =>
      String(b.id).toLowerCase() === decoded ||
      String(b.slug).toLowerCase() === decoded
  );
  if (idx === -1) return null;

  const existing = db.blogs[idx];
  const updated = normalizeBlog(updates, existing);

  db.blogs[idx] = updated;
  saveDb(db);
  return updated;
}

export function deleteBlog(idOrSlug: string): boolean {
  const db = initializeDb();
  const decoded = decodeURIComponent(String(idOrSlug)).trim().toLowerCase();
  const initialLen = db.blogs.length;
  db.blogs = db.blogs.filter(
    (b) =>
      String(b.id).toLowerCase() !== decoded &&
      String(b.slug).toLowerCase() !== decoded
  );
  if (db.blogs.length !== initialLen) {
    saveDb(db);
    return true;
  }
  return false;
}

// Inquiries Methods
export function getAllInquiries(): Inquiry[] {
  const db = initializeDb();
  return db.inquiries;
}

export function createInquiry(newInq: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Inquiry {
  const db = initializeDb();
  const inquiry: Inquiry = {
    ...newInq,
    id: `inq-${Date.now()}`,
    status: 'New',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };
  db.inquiries.unshift(inquiry);
  saveDb(db);
  return inquiry;
}

export function updateInquiryStatus(id: string, status: Inquiry['status']): boolean {
  const db = initializeDb();
  const inq = db.inquiries.find((i) => i.id === id);
  if (inq) {
    inq.status = status;
    saveDb(db);
    return true;
  }
  return false;
}
