import pdf35 from '../../assets/images/blog/35.pdf'
import pdf611 from '../../assets/images/blog/611.pdf'
import pdf1214 from '../../assets/images/blog/1214.pdf'
import pdf2560 from '../../assets/images/blog/2560.pdf'
import duongPdf from '../../assets/images/blog/duong.pdf'
import duongtreemPdf from '../../assets/images/blog/duongtreem.pdf'
import gtddPdf from '../../assets/images/blog/gtdd.pdf'
import gtrauPdf from '../../assets/images/blog/gtrau.pdf'
import hePdf from '../../assets/images/blog/he.pdf'
import huyetapPdf from '../../assets/images/blog/huyetap.pdf'
import mnPdf from '../../assets/images/blog/mn.pdf'
import muoiPdf from '../../assets/images/blog/muoi.pdf'
import rangPdf from '../../assets/images/blog/rang.pdf'
import rauPdf from '../../assets/images/blog/rau.pdf'
import rauqaPdf from '../../assets/images/blog/rauqa.pdf'
import tachai2Pdf from '../../assets/images/blog/tachai2.pdf'
import tePdf from '../../assets/images/blog/te.pdf'
import te2Pdf from '../../assets/images/blog/te2.pdf'
import thuPdf from '../../assets/images/blog/thu.pdf'
import thuacanPdf from '../../assets/images/blog/thuacan.pdf'
import tpatPdf from '../../assets/images/blog/tpat.pdf'
import treemPdf from '../../assets/images/blog/treem.pdf'
import vandongPdf from '../../assets/images/blog/vandong.pdf'

import thumb35 from '../../assets/images/blog/thumbnails/35.png'
import thumb611 from '../../assets/images/blog/thumbnails/611.png'
import thumb1214 from '../../assets/images/blog/thumbnails/1214.png'
import thumb2560 from '../../assets/images/blog/thumbnails/2560.png'
import duongThumb from '../../assets/images/blog/thumbnails/duong.png'
import duongtreemThumb from '../../assets/images/blog/thumbnails/duongtreem.png'
import gtddThumb from '../../assets/images/blog/thumbnails/gtdd.png'
import gtrauThumb from '../../assets/images/blog/thumbnails/gtrau.png'
import heThumb from '../../assets/images/blog/thumbnails/he.png'
import huyetapThumb from '../../assets/images/blog/thumbnails/huyetap.png'
import mnThumb from '../../assets/images/blog/thumbnails/mn.png'
import muoiThumb from '../../assets/images/blog/thumbnails/muoi.png'
import rangThumb from '../../assets/images/blog/thumbnails/rang.png'
import rauThumb from '../../assets/images/blog/thumbnails/rau.png'
import rauqaThumb from '../../assets/images/blog/thumbnails/rauqa.png'
import tachai2Thumb from '../../assets/images/blog/thumbnails/tachai2.png'
import teThumb from '../../assets/images/blog/thumbnails/te.png'
import te2Thumb from '../../assets/images/blog/thumbnails/te2.png'
import thuThumb from '../../assets/images/blog/thumbnails/thu.png'
import thuacanThumb from '../../assets/images/blog/thumbnails/thuacan.png'
import tpatThumb from '../../assets/images/blog/thumbnails/tpat.png'
import treemThumb from '../../assets/images/blog/thumbnails/treem.png'
import vandongThumb from '../../assets/images/blog/thumbnails/vandong.png'

export const blogTags = [
  'All',
  'Children',
  'Drinks',
  'Diseases',
  'Nutrition',
  'Vegetables & Fruits',
] as const

export type BlogTag = (typeof blogTags)[number]

export interface BlogPost {
  id: string
  title: string
  code: string
  publisher: string
  pdfUrl: string
  thumbnailUrl: string
  tags: BlogTag[]
}

export const blogPosts: BlogPost[] = [
  {
    id: 'treem',
    title: 'Infographic: Sugary drinks and children',
    code: 'KHA-2025-0013',
    publisher: 'WHO',
    pdfUrl: treemPdf,
    thumbnailUrl: treemThumb,
    tags: ['Children', 'Drinks'],
  },
  {
    id: 'duongtreem',
    title: 'Infographic: The harms of sugary drinks for children',
    code: 'KHA-2025-0016',
    publisher: 'WHO',
    pdfUrl: duongtreemPdf,
    thumbnailUrl: duongtreemThumb,
    tags: ['Children', 'Drinks'],
  },
  {
    id: 'rang',
    title: 'Infographic: Preventing oral diseases',
    code: 'KHA-2025-0008',
    publisher: 'WHO',
    pdfUrl: rangPdf,
    thumbnailUrl: rangThumb,
    tags: ['Diseases'],
  },
  {
    id: 'duong',
    title: 'Infographic: You cannot eat 10 spoons of sugar at once, so why drink them?',
    code: 'KHA-2025-0018',
    publisher: 'WHO',
    pdfUrl: duongPdf,
    thumbnailUrl: duongThumb,
    tags: ['Drinks'],
  },
  {
    id: 'tachai2',
    title: 'Infographic: The harms of sugary drinks',
    code: 'KHA-2025-0015',
    publisher: 'WHO',
    pdfUrl: tachai2Pdf,
    thumbnailUrl: tachai2Thumb,
    tags: ['Drinks'],
  },
  {
    id: 'huyetap',
    title: 'Infographic: Preventing and controlling high blood pressure',
    code: 'KHA-2025-0014',
    publisher: 'WHO',
    pdfUrl: huyetapPdf,
    thumbnailUrl: huyetapThumb,
    tags: ['Diseases'],
  },
  {
    id: 'thuacan',
    title: 'Infographic: Overweight and obesity are rising quickly in Vietnam',
    code: 'KHA-2025-0005',
    publisher: 'WHO',
    pdfUrl: thuacanPdf,
    thumbnailUrl: thuacanThumb,
    tags: ['Diseases', 'Drinks'],
  },
  {
    id: 'muoi',
    title: 'Infographic: Many people consume more salt than the recommended maximum',
    code: 'KHA-2025-0017',
    publisher: 'WHO',
    pdfUrl: muoiPdf,
    thumbnailUrl: muoiThumb,
    tags: ['Diseases'],
  },
  {
    id: 'vandong',
    title: 'Infographic: Every movement matters',
    code: 'KHA-2025-0023',
    publisher: 'WHO',
    pdfUrl: vandongPdf,
    thumbnailUrl: vandongThumb,
    tags: ['Children', 'Nutrition'],
  },
  {
    id: 'tpat',
    title: 'Infographic: 5 important keys to food safety',
    code: 'KHA-2025-0021',
    publisher: 'WHO',
    pdfUrl: tpatPdf,
    thumbnailUrl: tpatThumb,
    tags: ['Nutrition'],
  },
  {
    id: 'pdf611',
    title: 'Nutrition pyramid for children aged 12-14',
    code: 'APP-2025-0152',
    publisher: 'National Institute of Nutrition',
    pdfUrl: pdf611,
    thumbnailUrl: thumb611,
    tags: ['Nutrition', 'Children'],
  },
  {
    id: 'pdf2560',
    title: 'Nutrition pyramid for children aged 3-5',
    code: 'APP-2025-0146',
    publisher: 'National Institute of Nutrition',
    pdfUrl: pdf2560,
    thumbnailUrl: thumb2560,
    tags: ['Nutrition', 'Children'],
  },
  {
    id: 'pdf35',
    title: 'Nutrition leaflet for children aged 25-60 months',
    code: 'TOG-2025-0146',
    publisher: 'National Health Education and Communication Center',
    pdfUrl: pdf35,
    thumbnailUrl: thumb35,
    tags: ['Nutrition', 'Children'],
  },
  {
    id: 'pdf1214',
    title: 'Nutrition pyramid for children aged 6-11',
    code: 'APP-2025-0147',
    publisher: 'National Institute of Nutrition',
    pdfUrl: pdf1214,
    thumbnailUrl: thumb1214,
    tags: ['Nutrition', 'Children'],
  },
  {
    id: 'te',
    title: 'Poster: Micronutrients are essential for a child’s full development',
    code: 'APP-2024-0191',
    publisher: 'National Institute of Nutrition - GNBV',
    pdfUrl: tePdf,
    thumbnailUrl: teThumb,
    tags: ['Nutrition', 'Children'],
  },
  {
    id: 'te2',
    title: 'Poster: Micronutrients are essential for everyone’s health',
    code: 'APP-2024-0190',
    publisher: 'National Institute of Nutrition - GNBV',
    pdfUrl: te2Pdf,
    thumbnailUrl: te2Thumb,
    tags: ['Nutrition'],
  },
  {
    id: 'mn',
    title: 'Poster: Ensure adequate nutrition to prevent acute malnutrition in children',
    code: 'APP-2024-0217',
    publisher: 'National Institute of Nutrition - GNBV',
    pdfUrl: mnPdf,
    thumbnailUrl: mnThumb,
    tags: ['Nutrition', 'Children'],
  },
  {
    id: 'gtdd',
    title: 'Poster: Nutrition value of the five color groups of fruits and vegetables',
    code: 'APP-2022-0120',
    publisher: 'National Institute of Nutrition',
    pdfUrl: gtddPdf,
    thumbnailUrl: gtddThumb,
    tags: ['Vegetables & Fruits', 'Nutrition'],
  },
  {
    id: 'rau',
    title: 'Poster: Eat a variety of fruits and vegetables every day',
    code: 'APP-2022-0119',
    publisher: 'National Institute of Nutrition',
    pdfUrl: rauPdf,
    thumbnailUrl: rauThumb,
    tags: ['Vegetables & Fruits', 'Nutrition'],
  },
  {
    id: 'gtrau',
    title: 'Leaflet: Nutrition value of fruits and vegetables',
    code: 'TOG-2022-0118',
    publisher: 'National Institute of Nutrition',
    pdfUrl: gtrauPdf,
    thumbnailUrl: gtrauThumb,
    tags: ['Vegetables & Fruits', 'Nutrition'],
  },
  {
    id: 'rauqa',
    title: 'Leaflet: How to eat fruits and vegetables the right way',
    code: 'TOG-2022-0202',
    publisher: 'National Institute of Nutrition',
    pdfUrl: rauqaPdf,
    thumbnailUrl: rauqaThumb,
    tags: ['Vegetables & Fruits', 'Nutrition'],
  },
  {
    id: 'he',
    title: 'Leaflet: Some summer fruits and vegetables',
    code: 'TOG-2022-0203',
    publisher: 'National Institute of Nutrition',
    pdfUrl: hePdf,
    thumbnailUrl: heThumb,
    tags: ['Vegetables & Fruits'],
  },
  {
    id: 'thu',
    title: 'Leaflet: Some autumn fruits and vegetables',
    code: 'TOG-2022-0204',
    publisher: 'National Institute of Nutrition',
    pdfUrl: thuPdf,
    thumbnailUrl: thuThumb,
    tags: ['Vegetables & Fruits'],
  },
]
