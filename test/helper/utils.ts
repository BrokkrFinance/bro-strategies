import { BigNumber } from "ethers"
import { AccessControlRoles } from "./constants"

const ERROR_RANGE = 5 // ±5%
const ERROR_RANGE_PRECISION = 1e2

export function getErrorRange(value: BigNumber) {
  let errorRange = value.mul(ERROR_RANGE).div(ERROR_RANGE_PRECISION)

  return errorRange > BigNumber.from(0) ? errorRange : value
}

export function getErrorRangeGeneral(
  value: BigNumber,
  errorRangeNumerator: BigNumber,
  errorRangeDenominator: BigNumber
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
    { role: AccessControlRoles.ADMIN_ROLE, users: [ownerAddr] },
    { role: AccessControlRoles.GOVERNOR_ROLE, users: [ownerAddr] },
    { role: AccessControlRoles.STRATEGIST_ROLE, users: [ownerAddr] },
    { role: AccessControlRoles.MAINTAINER_ROLE, users: [ownerAddr] },
    { role: AccessControlRoles.UPGRADE_ROLE, users: [ownerAddr] },
    { role: AccessControlRoles.PAUSE_ROLE, users: [ownerAddr] },
  ]
}
