import { BigNumber } from "ethers"

const ERROR_RANGE = 5 // ±5%
const ERROR_RANGE_PRECISION = 1e2

export function getErrorRange(value: BigNumber) {
  let errorRange = value.mul(ERROR_RANGE).div(ERROR_RANGE_PRECISION)

  return errorRange > BigNumber.from(0) ? errorRange : value
}

export function getDaysInSeconds(days: number) {
  return 86400 * days
}

export function getMonthsInSeconds(months: number) {
  return getDaysInSeconds(30) * months
}

export function getYearsInSeconds(years: number) {
  return getDaysInSeconds(365) * years
}
