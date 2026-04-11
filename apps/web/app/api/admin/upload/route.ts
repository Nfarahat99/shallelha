import { v2 as cloudinary } from 'cloudinary'
import { NextResponse } from 'next/server'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: Request) {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'نوع الملف غير مسموح به' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'حجم الملف يتجاوز 10 ميجابايت' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise<Response>((resolve) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'shallelha/questions',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error || !result) {
          resolve(NextResponse.json({ error: 'فشل رفع الملف' }, { status: 500 }))
          return
        }
        resolve(NextResponse.json({ url: result.secure_url }))
      }
    )
    uploadStream.end(buffer)
  })
}
