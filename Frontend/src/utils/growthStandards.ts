import bmiAgeCsv from '../data/growth/bmiagerev.csv?raw'
import cdcStatureAgeCsv from '../data/growth/cdc-statage.csv?raw'
import cdcWeightAgeCsv from '../data/growth/cdc-wtage.csv?raw'
import cdcWeightStatureCsv from '../data/growth/cdc-wtstat.csv?raw'
import whoBoysLengthAgeCsv from '../data/growth/who-boys-length-for-age.csv?raw'
import whoGirlsLengthAgeCsv from '../data/growth/who-girls-length-for-age.csv?raw'
import whoBoysWeightAgeCsv from '../data/growth/who-boys-weight-for-age.csv?raw'
import whoGirlsWeightAgeCsv from '../data/growth/who-girls-weight-for-age.csv?raw'
import whoBoysWeightLengthCsv from '../data/growth/who-boys-weight-for-length.csv?raw'
import whoGirlsWeightLengthCsv from '../data/growth/who-girls-weight-for-length.csv?raw'

type SexCode = 1 | 2

interface LmsRow {
  x: number
  l: number
  m: number
  s: number
}

interface PediatricGrowthResult {
  mode: 'who-growth' | 'bmi-age-percentile'
  status: string
  summaryLabel: string
  summaryValue: string
  warning: string
  idealWeightText: string
  percentileText: string
  detailLines: string[]
}

function parseCsv(csv: string) {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/)
  const headers = headerLine.split(',').map((header) => header.trim())

  return lines
    .map((line) => line.split(','))
    .filter((columns) => columns.length === headers.length)
    .map((columns) =>
      Object.fromEntries(headers.map((header, index) => [header, columns[index]?.trim() ?? ''])) as Record<
        string,
        string
      >,
    )
}

function createLmsMap(rows: Record<string, string>[], xField: string) {
  return rows.map((row) => ({
    x: Number(row[xField]),
    l: Number(row.L),
    m: Number(row.M),
    s: Number(row.S),
  }))
}

function createSexLmsMap(rows: Record<string, string>[], xField: string) {
  const sexMap: Record<SexCode, LmsRow[]> = { 1: [], 2: [] }

  rows.forEach((row) => {
    const sex = Number(row.Sex) as SexCode
    sexMap[sex].push({
      x: Number(row[xField]),
      l: Number(row.L),
      m: Number(row.M),
      s: Number(row.S),
    })
  })

  return sexMap
}

function interpolateRow(rows: LmsRow[], target: number) {
  if (rows.length === 0) return null
  if (target <= rows[0].x) return rows[0]
  if (target >= rows[rows.length - 1].x) return rows[rows.length - 1]

  for (let index = 0; index < rows.length - 1; index += 1) {
    const current = rows[index]
    const next = rows[index + 1]

    if (target >= current.x && target <= next.x) {
      const ratio = (target - current.x) / (next.x - current.x)

      return {
        x: target,
        l: current.l + (next.l - current.l) * ratio,
        m: current.m + (next.m - current.m) * ratio,
        s: current.s + (next.s - current.s) * ratio,
      }
    }
  }

  return rows[rows.length - 1]
}

function calculateZScore(value: number, row: LmsRow) {
  if (value <= 0) return 0
  if (row.l === 0) return Math.log(value / row.m) / row.s
  return (Math.pow(value / row.m, row.l) - 1) / (row.l * row.s)
}

function erf(x: number) {
  const sign = x < 0 ? -1 : 1
  const absoluteX = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const t = 1 / (1 + p * absoluteX)
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absoluteX * absoluteX))

  return sign * y
}

function normalCdf(zScore: number) {
  return 0.5 * (1 + erf(zScore / Math.SQRT2))
}

function percentileFromZ(zScore: number) {
  return Math.max(0, Math.min(100, normalCdf(zScore) * 100))
}

function valueFromZ(row: LmsRow, zScore: number) {
  if (row.l === 0) return row.m * Math.exp(row.s * zScore)
  return row.m * Math.pow(1 + row.l * row.s * zScore, 1 / row.l)
}

const Z_5TH = -1.64485362695147
const Z_85TH = 1.03643338949379
const Z_95TH = 1.64485362695147

let bmiAgeRowsCache: Record<SexCode, LmsRow[]> | null = null
let cdcWeightAgeRowsCache: Record<SexCode, LmsRow[]> | null = null
let cdcStatureAgeRowsCache: Record<SexCode, LmsRow[]> | null = null
let cdcWeightStatureRowsCache: Record<SexCode, LmsRow[]> | null = null
let whoWeightForLengthCache: Record<SexCode, LmsRow[]> | null = null
let whoWeightForAgeCache: Record<SexCode, LmsRow[]> | null = null
let whoLengthForAgeCache: Record<SexCode, LmsRow[]> | null = null

function getBmiAgeRows() {
  bmiAgeRowsCache ??= createSexLmsMap(parseCsv(bmiAgeCsv), 'Agemos')
  return bmiAgeRowsCache
}

function getCdcWeightAgeRows() {
  cdcWeightAgeRowsCache ??= createSexLmsMap(parseCsv(cdcWeightAgeCsv), 'Agemos')
  return cdcWeightAgeRowsCache
}

function getCdcStatureAgeRows() {
  cdcStatureAgeRowsCache ??= createSexLmsMap(parseCsv(cdcStatureAgeCsv), 'Agemos')
  return cdcStatureAgeRowsCache
}

function getCdcWeightStatureRows() {
  cdcWeightStatureRowsCache ??= createSexLmsMap(parseCsv(cdcWeightStatureCsv), 'Height')
  return cdcWeightStatureRowsCache
}

function getWhoWeightForLengthRows() {
  whoWeightForLengthCache ??= {
    1: createLmsMap(parseCsv(whoBoysWeightLengthCsv), 'Length'),
    2: createLmsMap(parseCsv(whoGirlsWeightLengthCsv), 'Length'),
  }
  return whoWeightForLengthCache
}

function getWhoWeightForAgeRows() {
  whoWeightForAgeCache ??= {
    1: createLmsMap(parseCsv(whoBoysWeightAgeCsv), 'Month'),
    2: createLmsMap(parseCsv(whoGirlsWeightAgeCsv), 'Month'),
  }
  return whoWeightForAgeCache
}

function getWhoLengthForAgeRows() {
  whoLengthForAgeCache ??= {
    1: createLmsMap(parseCsv(whoBoysLengthAgeCsv), 'Month'),
    2: createLmsMap(parseCsv(whoGirlsLengthAgeCsv), 'Month'),
  }
  return whoLengthForAgeCache
}

function toSexCode(gender: 'Nam' | 'Nữ'): SexCode {
  return gender === 'Nam' ? 1 : 2
}

export function assessPediatricGrowth(input: {
  gender: 'Nam' | 'Nữ'
  ageYears: number
  ageMonths?: number
  heightCm: number
  weightKg: number
}) {
  const sex = toSexCode(input.gender)
  if (input.heightCm <= 0 || input.weightKg <= 0 || input.ageYears < 0) return null

  const totalMonths =
    Number.isFinite(input.ageMonths) && input.ageMonths && input.ageMonths > 0
      ? input.ageMonths > 11
        ? input.ageMonths
        : input.ageYears * 12 + input.ageMonths
      : input.ageYears * 12

  if (totalMonths < 24) {
    const weightForLengthRow = interpolateRow(getWhoWeightForLengthRows()[sex], input.heightCm)
    const weightForAgeRow = interpolateRow(getWhoWeightForAgeRows()[sex], totalMonths)
    const lengthForAgeRow = interpolateRow(getWhoLengthForAgeRows()[sex], totalMonths)

    if (!weightForLengthRow || !weightForAgeRow || !lengthForAgeRow) return null

    const weightForLengthZ = calculateZScore(input.weightKg, weightForLengthRow)
    const weightForLengthPercentile = percentileFromZ(weightForLengthZ)
    const weightForAgePercentile = percentileFromZ(calculateZScore(input.weightKg, weightForAgeRow))
    const lengthForAgePercentile = percentileFromZ(calculateZScore(input.heightCm, lengthForAgeRow))
    const normalWeightMin = valueFromZ(weightForLengthRow, Z_5TH)
    const normalWeightMax = valueFromZ(weightForLengthRow, Z_95TH)

    let status = 'Bình thường'
    if (weightForLengthZ < -3) status = 'Gầy còm nặng'
    else if (weightForLengthZ < -2) status = 'Gầy còm'
    else if (weightForLengthZ > 3) status = 'Béo phì'
    else if (weightForLengthZ > 2) status = 'Thừa cân'

    return {
      mode: 'who-growth',
      status,
      summaryLabel: 'Đánh giá tăng trưởng WHO (0-2 tuổi)',
      summaryValue: status,
      warning:
        status === 'Bình thường'
          ? 'Trẻ dưới 2 tuổi đang trong vùng tăng trưởng chấp nhận được theo WHO.'
          : `Kết quả WHO gợi ý: ${status}. Nên đối chiếu thêm với bác sĩ/nhi khoa nếu cần.`,
      idealWeightText: `${normalWeightMin.toFixed(1)} - ${normalWeightMax.toFixed(1)}kg theo chiều dài hiện tại`,
      percentileText: `Cân nặng/chiều dài: P${weightForLengthPercentile.toFixed(1)} • Cân nặng/tuổi: P${weightForAgePercentile.toFixed(1)} • Chiều dài/tuổi: P${lengthForAgePercentile.toFixed(1)}`,
      detailLines: [
        `Cân nặng theo tuổi: P${weightForAgePercentile.toFixed(1)}`,
        `Chiều dài theo tuổi: P${lengthForAgePercentile.toFixed(1)}`,
        `Cân nặng theo chiều dài: P${weightForLengthPercentile.toFixed(1)}`,
        `Kết luận chính: ${status} theo cân nặng/chiều dài`,
        `Ngưỡng cân nặng bình thường ở chiều dài hiện tại: ${normalWeightMin.toFixed(1)} - ${normalWeightMax.toFixed(1)}kg`,
      ],
    } satisfies PediatricGrowthResult
  }

  const bmi = input.heightCm > 0 ? input.weightKg / (input.heightCm / 100) ** 2 : 0
  const bmiRow = interpolateRow(getBmiAgeRows()[sex], totalMonths)
  const weightAgeRow = interpolateRow(getCdcWeightAgeRows()[sex], totalMonths)
  const statureAgeRow = interpolateRow(getCdcStatureAgeRows()[sex], totalMonths)
  const weightStatureRow = interpolateRow(getCdcWeightStatureRows()[sex], input.heightCm)
  if (!bmiRow || !weightAgeRow || !statureAgeRow) return null

  const bmiZ = calculateZScore(bmi, bmiRow)
  const bmiPercentile = percentileFromZ(bmiZ)
  const weightAgePercentile = percentileFromZ(calculateZScore(input.weightKg, weightAgeRow))
  const statureAgePercentile = percentileFromZ(calculateZScore(input.heightCm, statureAgeRow))
  const weightStaturePercentile = weightStatureRow
    ? percentileFromZ(calculateZScore(input.weightKg, weightStatureRow))
    : null
  const normalBmiMin = valueFromZ(bmiRow, Z_5TH)
  const normalBmiMax = valueFromZ(bmiRow, Z_85TH)
  const normalWeightMin = normalBmiMin * (input.heightCm / 100) ** 2
  const normalWeightMax = normalBmiMax * (input.heightCm / 100) ** 2

  let status = 'Cân nặng khỏe mạnh'
  if (bmiPercentile < 5) status = 'Thiếu cân'
  else if (bmiPercentile >= 95) status = 'Béo phì'
  else if (bmiPercentile >= 85) status = 'Thừa cân'

  return {
    mode: 'bmi-age-percentile',
    status,
    summaryLabel: 'Đánh giá BMI theo tuổi (2-18 tuổi)',
    summaryValue: status,
    warning:
      status === 'Cân nặng khỏe mạnh'
        ? 'Trẻ đang ở vùng BMI theo tuổi bình thường.'
        : `Kết quả BMI theo tuổi gợi ý: ${status}. Nên theo dõi thêm cùng biểu đồ tăng trưởng.`,
    idealWeightText: `${normalWeightMin.toFixed(1)} - ${normalWeightMax.toFixed(1)}kg ở chiều cao hiện tại`,
    percentileText: `BMI theo tuổi: P${bmiPercentile.toFixed(1)} • Chiều cao theo tuổi: P${statureAgePercentile.toFixed(1)} • Cân nặng theo tuổi: P${weightAgePercentile.toFixed(1)}${weightStaturePercentile !== null ? ` • Cân nặng theo chiều cao: P${weightStaturePercentile.toFixed(1)}` : ''}`,
    detailLines: [
      `BMI theo tuổi: P${bmiPercentile.toFixed(1)}`,
      `Chiều cao theo tuổi: P${statureAgePercentile.toFixed(1)}`,
      `Cân nặng theo tuổi: P${weightAgePercentile.toFixed(1)}`,
      `Kết luận chính: ${status} theo BMI theo tuổi`,
      `Ngưỡng cân nặng bình thường ở chiều cao hiện tại: ${normalWeightMin.toFixed(1)} - ${normalWeightMax.toFixed(1)}kg`,
      weightStaturePercentile !== null
        ? `Cân nặng theo chiều cao: P${weightStaturePercentile.toFixed(1)}`
        : 'Cân nặng theo chiều cao: dùng ngưỡng cân nặng bình thường theo BMI-age ở chiều cao hiện tại',
    ],
  } satisfies PediatricGrowthResult
}
