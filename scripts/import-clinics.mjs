import fetch from 'node-fetch'

const CSV_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/All_Radiology_Clinics-cbogOYiLIo59XIZ5H8sjOoKRT4c7DS.csv'

function parseCSV(text) {
  const lines = text.trim().replace(/\r\n/g, '\n').split('\n')
  const headerLine = lines.shift() || ''
  const header = headerLine
    .replace(/^\uFEFF/, '')
    .split(',')
    .map((h) => h.trim())

  return lines
    .map((line) => {
      if (!line.trim()) return null
      const values = line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g) || []
      const row = {}
      header.forEach((key, i) => {
        let value = (values[i] || '').trim()
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1)
        }
        value = value.replace(/""/g, '"')
        row[key] = value
      })
      return row
    })
    .filter(Boolean)
}

export async function importClinics() {
  console.log(`Fetching clinic data from CSV...`)
  const response = await fetch(CSV_URL)
  if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`)
  const csvText = await response.text()
  const records = parseCSV(csvText)
  console.log(`Parsed ${records.length} clinic records.`)

  return records.reduce((acc, record) => {
    const brandName = record.Brand
    if (!brandName) return acc

    if (!acc[brandName]) {
      acc[brandName] = { logo: '', clinics: [], emails: [] }
    }

    if (!acc[brandName].logo && record['Logo URL']) {
      acc[brandName].logo = record['Logo URL']
    }

    if (record.Clinic) {
      acc[brandName].clinics.push({
        name: record.Clinic,
        address: record.Location || '',
        phone: record.Phone || '',
      })
    }

    if (record.Email && !acc[brandName].emails.includes(record.Email)) {
      acc[brandName].emails.push(record.Email)
    }

    return acc
  }, {})
}
