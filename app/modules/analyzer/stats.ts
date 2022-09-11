import type {
  BuildAbilitiesTupleWithUnknown,
  MainWeaponId,
} from "~/modules/in-game-lists";
import type { AnalyzedBuild, StatFunctionInput } from "./types";
import invariant from "tiny-invariant";
import {
  abilityPointsToEffect,
  apFromMap,
  buildToAbilityPoints,
  weaponParams,
} from "./utils";

export function buildStats({
  build,
  weaponSplId,
}: {
  build: BuildAbilitiesTupleWithUnknown;
  weaponSplId: MainWeaponId;
}): AnalyzedBuild {
  const mainWeaponParams = weaponParams().mainWeapons[weaponSplId];
  invariant(mainWeaponParams, `Weapon with splId ${weaponSplId} not found`);

  const subWeaponParams =
    weaponParams().subWeapons[mainWeaponParams.subWeaponId];
  invariant(
    subWeaponParams,
    `Sub weapon with splId ${mainWeaponParams.subWeaponId} not found`
  );

  const input: StatFunctionInput = {
    mainWeaponParams,
    subWeaponParams,
    abilityPoints: buildToAbilityPoints(build),
  };

  return {
    weapon: {
      specialWeaponSplId: mainWeaponParams.specialWeaponId,
      subWeaponSplId: mainWeaponParams.subWeaponId,
    },
    stats: {
      shotsPerInkTank: shotsPerInkTank(input),
      inkCost: inkCost(input),
      specialPoint: specialPoint(input),
      subWeaponWhiteInkFrames: subWeaponParams.InkRecoverStop,
    },
  };
}

function shotsPerInkTank(
  args: StatFunctionInput
): AnalyzedBuild["stats"]["shotsPerInkTank"] {
  return {};
}

function specialPoint({
  abilityPoints,
  mainWeaponParams,
}: StatFunctionInput): AnalyzedBuild["stats"]["specialPoint"] {
  const SPECIAL_POINT_ABILITY = "SCU";

  const effect = abilityPointsToEffect({
    abilityPoints: apFromMap({
      abilityPoints: abilityPoints,
      ability: SPECIAL_POINT_ABILITY,
    }),
    key: "IncreaseRt_Special",
    weapon: mainWeaponParams,
  });

  return {
    baseValue: mainWeaponParams.SpecialPoint,
    modifiedBy: SPECIAL_POINT_ABILITY,
    value: Math.ceil(mainWeaponParams.SpecialPoint / effect),
  };
}

function inkCost(args: StatFunctionInput): AnalyzedBuild["stats"]["inkCost"] {
  return {};
}
