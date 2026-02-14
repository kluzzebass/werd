import { saveAs } from 'file-saver'
import {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  UnderlineType,
} from 'docx'
import mammoth from 'mammoth'
import { WordEntry, DEFAULT_WORD_FORMAT } from '@shared/types'

function werdAlignToDocx(align: string): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (align) {
    case 'center': return AlignmentType.CENTER
    case 'right': return AlignmentType.RIGHT
    case 'justify': return AlignmentType.JUSTIFIED
    default: return AlignmentType.LEFT
  }
}

function hexToRgb(hex: string): string {
  return hex.replace('#', '')
}

// Export to .docx
export async function exportToDocx(word: WordEntry, filename: string = 'document.docx') {
  const text = word.value ?? ''
  const fmt = word.format

  const run = new TextRun({
    text,
    bold: fmt.bold,
    italics: fmt.italic,
    underline: fmt.underline ? { type: UnderlineType.SINGLE } : undefined,
    strike: fmt.strikethrough,
    size: fmt.fontSize * 2, // docx uses half-points
    font: fmt.fontFamily,
    color: hexToRgb(fmt.fontColor),
    shading: fmt.backgroundColor !== '#ffffff'
      ? { fill: hexToRgb(fmt.backgroundColor) }
      : undefined,
  })

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: werdAlignToDocx(fmt.textAlign),
          children: [run],
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename)
}

// Import from .docx — strips everything except letters and digits into one word
export async function importFromDocx(file: File): Promise<WordEntry> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const oneWord = result.value.replace(/[^\p{L}\p{N}]/gu, '')

  return {
    value: oneWord === '' ? null : oneWord,
    format: { ...DEFAULT_WORD_FORMAT },
  }
}
