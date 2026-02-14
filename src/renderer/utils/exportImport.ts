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
import { WordEntry, DEFAULT_WORD_FORMAT, getFormatRuns } from '@shared/types'

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

export async function exportToDocx(word: WordEntry, filename: string = 'document.docx') {
  const text = word.value ?? ''
  const runs = getFormatRuns(text, word.charFormats)

  const textRuns = runs.map(run => {
    const fmt = run.format
    return new TextRun({
      text: run.text,
      bold: fmt.bold,
      italics: fmt.italic,
      underline: fmt.underline ? { type: UnderlineType.SINGLE } : undefined,
      strike: fmt.strikethrough,
      size: fmt.fontSize * 2, // docx uses half-points
      font: fmt.fontFamily,
      color: hexToRgb(fmt.fontColor),
      shading: fmt.backgroundColor !== 'transparent'
        ? { fill: hexToRgb(fmt.backgroundColor) }
        : undefined,
    })
  })

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: werdAlignToDocx(word.format.textAlign),
          children: textRuns,
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, filename)
}

export async function importFromDocx(file: File): Promise<WordEntry> {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const oneWord = result.value.replace(/[^\p{L}\p{N}]/gu, '')

  return {
    value: oneWord === '' ? null : oneWord,
    format: { ...DEFAULT_WORD_FORMAT },
    charFormats: null,
  }
}
