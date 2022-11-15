import { BigNumber } from "ethers"
import AccessControlRoles from "../../constants/AccessControlRoles.json"

const ERROR_RANGE_NUMERATOR = BigNumber.from(5) // ±5%
const ERROR_RANGE_DENOMINATOR = BigNumber.from(1e2)

export function getErrorRange(
  value: BigNumber,
  errorRangeNumerator: BigNumber = ERROR_RANGE_NUMERATOR,
  errorRangeDenominator: BigNumber = ERROR_RANGE_DENOMINATOR
) {
  let errorRange = value.mul(errorRangeNumerator).div(errorRangeDenominator)

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

export function createRolesArray(ownerAddr: string) {
  return [
    { role: AccessControlRoles.admin, users: [ownerAddr] },
    { role: AccessControlRoles.governor, users: [ownerAddr] },
    { role: AccessControlRoles.strategist, users: [ownerAddr] },
    { role: AccessControlRoles.maintainer, users: [ownerAddr] },
    { role: AccessControlRoles.upgrade, users: [ownerAddr] },
    { role: AccessControlRoles.pause, users: [ownerAddr] },
  ]
}
