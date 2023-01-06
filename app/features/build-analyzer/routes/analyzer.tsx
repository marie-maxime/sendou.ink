import { type LinksFunction, type MetaFunction } from "@remix-run/node";
import type { ShouldReloadFunction } from "@remix-run/react";
import { Link } from "@remix-run/react";
import * as React from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { AbilitiesSelector } from "~/components/AbilitiesSelector";
import { Ability } from "~/components/Ability";
import { WeaponCombobox } from "~/components/Combobox";
import { Image } from "~/components/Image";
import { Main } from "~/components/Main";
import { Popover } from "~/components/Popover";
import { Toggle } from "~/components/Toggle";
import { useSetTitle } from "~/hooks/useSetTitle";
import {
  abilities,
  ANGLE_SHOOTER_ID,
  INK_MINE_ID,
  INK_STORM_ID,
  isAbility,
  POINT_SENSOR_ID,
  SPLASH_WALL_ID,
  SPRINKLER_ID,
  TOXIC_MIST_ID,
  TORPEDO_ID,
  type BuildAbilitiesTupleWithUnknown,
  type MainWeaponId,
  type SubWeaponId,
} from "~/modules/in-game-lists";
import styles from "../analyzer.css";
import { damageTypeTranslationString } from "~/utils/i18next";
import { type SendouRouteHandle } from "~/utils/remix";
import { makeTitle } from "~/utils/strings";
import {
  ANALYZER_URL,
  navIconUrl,
  objectDamageCalculatorPage,
  specialWeaponImageUrl,
  subWeaponImageUrl,
} from "~/utils/urls";
import clsx from "clsx";
import {
  ABILITIES_WITHOUT_CHUNKS,
  getAbilityChunksMapAsArray,
} from "../core/abilityChunksCalc";
import type {
  AbilityPoints,
  AnalyzedBuild,
  SpecialEffectType,
  Stat,
} from "../analyzer-types";
import {
  lastDitchEffortIntensityToAp,
  SPECIAL_EFFECTS,
} from "../core/specialEffects";
import {
  damageTypeToWeaponType,
  MAX_LDE_INTENSITY,
} from "../analyzer-constants";
import { useAnalyzeBuild } from "../analyzer-hooks";

export const CURRENT_PATCH = "2.0";

export const meta: MetaFunction = () => {
  return {
    title: makeTitle("Build Analyzer"),
  };
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export const handle: SendouRouteHandle = {
  i18n: ["weapons", "analyzer"],
  breadcrumb: () => ({
    imgPath: navIconUrl("analyzer"),
    href: ANALYZER_URL,
    type: "IMAGE",
  }),
};

// Resolves this Github issue: https://github.com/Sendouc/sendou.ink/issues/1053
export const unstable_shouldReload: ShouldReloadFunction = () => false;

export default function BuildAnalyzerPage() {
  const { t } = useTranslation(["analyzer", "common", "weapons"]);
  useSetTitle(t("common:pages.analyzer"));
  const {
    build,
    mainWeaponId,
    handleChange,
    analyzed,
    abilityPoints,
    ldeIntensity,
    effects,
  } = useAnalyzeBuild();

  const objectShredderSelected = build[2][0] === "OS";

  const mainWeaponCategoryItems = [
    analyzed.stats.shotSpreadAir && (
      <StatCard
        abilityPoints={abilityPoints}
        key="jumpShotSpread"
        stat={analyzed.stats.shotSpreadAir}
        title={t("analyzer:stat.jumpShotSpread")}
        suffix="°"
      />
    ),
    typeof analyzed.stats.shotSpreadGround === "number" && (
      <StatCard
        abilityPoints={abilityPoints}
        key="groundShotSpread"
        stat={analyzed.stats.shotSpreadGround}
        title={t("analyzer:stat.groundShotSpread")}
        suffix="°"
      />
    ),
    typeof analyzed.stats.mainWeaponWhiteInkSeconds === "number" && (
      <StatCard
        abilityPoints={abilityPoints}
        key="whiteInkSeconds"
        stat={analyzed.stats.mainWeaponWhiteInkSeconds}
        title={t("analyzer:stat.whiteInk")}
        suffix={t("analyzer:suffix.seconds")}
      />
    ),
    typeof analyzed.weapon.brellaCanopyHp === "number" && (
      <StatCard
        abilityPoints={abilityPoints}
        key="brellaCanopyHp"
        stat={analyzed.weapon.brellaCanopyHp}
        title={t("analyzer:stat.canopyHp")}
        suffix={t("analyzer:suffix.hp")}
      />
    ),
    typeof analyzed.weapon.fullChargeSeconds === "number" && (
      <StatCard
        abilityPoints={abilityPoints}
        key="fullChargeSeconds"
        stat={analyzed.weapon.fullChargeSeconds}
        title={t("analyzer:stat.fullChargeSeconds")}
        suffix={t("analyzer:suffix.seconds")}
      />
    ),
    typeof analyzed.weapon.maxChargeHoldSeconds === "number" && (
      <StatCard
        abilityPoints={abilityPoints}
        key="maxChargeHoldSeconds"
        stat={analyzed.weapon.maxChargeHoldSeconds}
        title={t("analyzer:stat.maxChargeHoldSeconds")}
        suffix={t("analyzer:suffix.seconds")}
      />
    ),
  ].filter(Boolean);

  // Handles edge case where a primary slot-only ability (e.g. Ninja Squid) is selected & the 'abilityPoints' count is still 0,
  //  and also fixes an edge case with Ability Doubler as the only ability in the build
  const showAbilityChunksRequired: boolean = build.some(
    (gear) =>
      gear.filter((ability) => !ABILITIES_WITHOUT_CHUNKS.has(ability)).length
  );

  return (
    <Main>
      <div className="analyzer__container">
        <div className="analyzer__left-column">
          <div className="stack sm items-center w-full">
            <div className="w-full">
              <WeaponCombobox
                inputName="weapon"
                initialWeaponId={mainWeaponId}
                onChange={(opt) =>
                  opt &&
                  handleChange({
                    newMainWeaponId: Number(opt.value) as MainWeaponId,
                  })
                }
                className="w-full-important"
                clearsInputOnFocus
              />
            </div>
            <WeaponInfoBadges analyzed={analyzed} />
          </div>
          <div className="stack md items-center">
            <AbilitiesSelector
              selectedAbilities={build}
              onChange={(newBuild) => handleChange({ newBuild })}
            />
            <EffectsSelector
              build={build}
              ldeIntensity={ldeIntensity}
              handleLdeIntensityChange={(newLdeIntensity) =>
                handleChange({ newLdeIntensity })
              }
              handleAddEffect={(newEffect) =>
                handleChange({ newEffects: [...effects, newEffect] })
              }
              handleRemoveEffect={(effectToRemove) =>
                handleChange({
                  newEffects: effects.filter((e) => e !== effectToRemove),
                })
              }
              effects={effects}
            />
            {abilityPoints.size > 0 && (
              <AbilityPointsDetails abilityPoints={abilityPoints} />
            )}
            {showAbilityChunksRequired && (
              <AbilityChunksRequired build={build} />
            )}
          </div>
          <div className="analyzer__patch">
            {t("analyzer:patch")} {CURRENT_PATCH}
          </div>
        </div>
        <div className="stack md">
          {mainWeaponCategoryItems.length > 0 && (
            <StatCategory title={t("analyzer:stat.category.main")}>
              {mainWeaponCategoryItems}
            </StatCategory>
          )}

          <StatCategory title={t("analyzer:stat.category.sub")}>
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subWeaponInkConsumptionPercentage}
              title={t("analyzer:stat.subWeaponInkConsumptionPercentage")}
              suffix="%"
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subWeaponWhiteInkSeconds}
              title={t("analyzer:stat.whiteInk")}
              suffix={t("analyzer:suffix.seconds")}
            />
            {analyzed.stats.subVelocity && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subVelocity}
                title={t("analyzer:stat.sub.velocity")}
              />
            )}
            {analyzed.stats.subFirstPhaseDuration && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subFirstPhaseDuration}
                title={t("analyzer:stat.sub.firstPhaseDuration")}
                suffix={t("analyzer:suffix.seconds")}
              />
            )}
            {analyzed.stats.subSecondPhaseDuration && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subSecondPhaseDuration}
                title={t("analyzer:stat.sub.secondPhaseDuration")}
                suffix={t("analyzer:suffix.seconds")}
              />
            )}
            {analyzed.stats.subMarkingTimeInSeconds && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subMarkingTimeInSeconds}
                title={t("analyzer:stat.sub.markingTimeInSeconds")}
                suffix={t("analyzer:suffix.seconds")}
              />
            )}
            {analyzed.stats.subMarkingRadius && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subMarkingRadius}
                title={t("analyzer:stat.sub.markingRadius")}
              />
            )}
            {analyzed.stats.subExplosionRadius && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subExplosionRadius}
                title={t("analyzer:stat.sub.explosionRadius")}
              />
            )}
            {analyzed.stats.subHp && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subHp}
                title={t("analyzer:stat.sub.hp")}
                suffix={t("analyzer:suffix.hp")}
              />
            )}
            {analyzed.stats.subQsjBoost && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.subQsjBoost}
                title={t("analyzer:stat.sub.qsjBoost")}
                suffix={t("analyzer:abilityPoints.short")}
              />
            )}
          </StatCategory>

          <StatCategory title={t("analyzer:stat.category.special")}>
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.specialPoint}
              title={t("analyzer:stat.specialPoints")}
              suffix={t("analyzer:suffix.specialPointsShort")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.specialLost}
              title={t("analyzer:stat.specialLost")}
              suffix="%"
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.specialLostSplattedByRP}
              title={t("analyzer:stat.specialLostSplattedByRP")}
              suffix="%"
            />
            {analyzed.stats.specialDurationInSeconds && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialDurationInSeconds}
                title={t("analyzer:stat.special.duration", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
                suffix={t("analyzer:suffix.seconds")}
                popoverInfo={
                  analyzed.weapon.specialWeaponSplId === INK_STORM_ID
                    ? t("analyzer:stat.special.duration.inkStormExplanation")
                    : undefined
                }
              />
            )}
            {analyzed.stats.specialDamageDistance && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialDamageDistance}
                title={t("analyzer:stat.special.damageDistance", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
              />
            )}
            {analyzed.stats.specialPaintRadius && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialPaintRadius}
                title={t("analyzer:stat.special.paintRadius", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
              />
            )}
            {analyzed.stats.specialFieldHp && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialFieldHp}
                title={t("analyzer:stat.special.shieldHp", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
                suffix={t("analyzer:suffix.hp")}
              />
            )}
            {analyzed.stats.specialDeviceHp && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialDeviceHp}
                title={t("analyzer:stat.special.deviceHp", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
                suffix={t("analyzer:suffix.hp")}
              />
            )}
            {analyzed.stats.specialHookInkConsumptionPercentage && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialHookInkConsumptionPercentage}
                title={t("analyzer:stat.special.inkConsumptionHook", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
                suffix="%"
              />
            )}
            {analyzed.stats.specialInkConsumptionPerSecondPercentage && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialInkConsumptionPerSecondPercentage}
                title={t("analyzer:stat.special.inkConsumptionPerSecond", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
                suffix="%"
              />
            )}
            {analyzed.stats.specialReticleRadius && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialReticleRadius}
                title={t("analyzer:stat.special.reticleRadius", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
              />
            )}
            {analyzed.stats.specialThrowDistance && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialThrowDistance}
                title={t("analyzer:stat.special.throwDistance", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
              />
            )}
            {analyzed.stats.specialAutoChargeRate && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialAutoChargeRate}
                title={t("analyzer:stat.special.autoChargeRate", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
              />
            )}
            {analyzed.stats.specialMaxRadius && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialMaxRadius}
                title={t("analyzer:stat.special.maxRadius", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
                popoverInfo={t("analyzer:stat.special.maxRadius.explanation")}
              />
            )}
            {analyzed.stats.specialRadiusRange && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialRadiusRange}
                title={t("analyzer:stat.special.radiusRange", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
              />
            )}
            {analyzed.stats.specialPowerUpDuration && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.specialPowerUpDuration}
                title={t("analyzer:stat.special.powerUpDuration", {
                  weapon: t(
                    `weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`
                  ),
                })}
                suffix={t("analyzer:suffix.seconds")}
              />
            )}
          </StatCategory>
          <StatCategory
            title={t("analyzer:stat.category.subDef")}
            textBelow={t("analyzer:trackingSubDefExplanation")}
          >
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefBombDamageLightPercentage}
              title={t("analyzer:stat.bombLdamage")}
              suffix="%"
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefBombDamageHeavyPercentage}
              title={t("analyzer:stat.bombHdamage")}
              suffix="%"
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefAngleShooterDamage}
              title={t("analyzer:stat.damage", {
                weapon: t(`weapons:SUB_${ANGLE_SHOOTER_ID}`),
              })}
              suffix={t("analyzer:suffix.hp")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefSplashWallDamagePercentage}
              title={t("analyzer:stat.damage", {
                weapon: t(`weapons:SUB_${SPLASH_WALL_ID}`),
              })}
              suffix="%"
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefSprinklerDamagePercentage}
              title={t("analyzer:stat.damage", {
                weapon: t(`weapons:SUB_${SPRINKLER_ID}`),
              })}
              suffix="%"
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefToxicMistMovementReduction}
              title={t("analyzer:stat.movementReduction", {
                weapon: t(`weapons:SUB_${TOXIC_MIST_ID}`),
              })}
              suffix="%"
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefPointSensorMarkedTimeInSeconds}
              title={t("analyzer:stat.markedTime", {
                weapon: t(`weapons:SUB_${POINT_SENSOR_ID}`),
              })}
              suffix={t("analyzer:suffix.seconds")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefInkMineMarkedTimeInSeconds}
              title={t("analyzer:stat.markedTime", {
                weapon: t(`weapons:SUB_${INK_MINE_ID}`),
              })}
              suffix={t("analyzer:suffix.seconds")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.subDefAngleShooterMarkedTimeInSeconds}
              title={t("analyzer:stat.markedTime", {
                weapon: t(`weapons:SUB_${ANGLE_SHOOTER_ID}`),
              })}
              suffix={t("analyzer:suffix.seconds")}
            />
          </StatCategory>

          {analyzed.stats.damages.length > 0 && (
            <StatCategory
              title={t("analyzer:stat.category.damage")}
              containerClassName="analyzer__table-container"
            >
              <DamageTable
                values={analyzed.stats.damages}
                multiShots={analyzed.weapon.multiShots}
                subWeaponId={analyzed.weapon.subWeaponSplId}
              />
            </StatCategory>
          )}

          {analyzed.stats.fullInkTankOptions.length > 0 && (
            <StatCategory
              title={t("analyzer:stat.category.actionsPerInkTank")}
              containerClassName="analyzer__table-container"
            >
              {/** Hack the :has ;) */}
              {(["ISM", "ISS"] as const).some(
                (ability) => (abilityPoints.get(ability)?.ap ?? 0) > 0
              ) ? (
                <div className="analyzer__stat-card-highlighted" />
              ) : null}
              <ConsumptionTable
                options={analyzed.stats.fullInkTankOptions}
                subWeaponId={analyzed.weapon.subWeaponSplId}
              />
            </StatCategory>
          )}

          <StatCategory title={t("analyzer:stat.category.movement")}>
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.swimSpeed}
              title={t("analyzer:stat.swimSpeed")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.swimSpeedHoldingRainmaker}
              title={t("analyzer:stat.swimSpeedHoldingRainmaker")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.runSpeed}
              title={t("analyzer:stat.runSpeed")}
            />
            {analyzed.stats.shootingRunSpeed && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.shootingRunSpeed}
                title={t("analyzer:stat.shootingRunSpeed")}
              />
            )}
            {analyzed.stats.shootingRunSpeedCharging && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.shootingRunSpeedCharging}
                title={t("analyzer:stat.shootingRunSpeedCharging")}
              />
            )}
            {analyzed.stats.shootingRunSpeedFullCharge && (
              <StatCard
                abilityPoints={abilityPoints}
                stat={analyzed.stats.shootingRunSpeedFullCharge}
                title={t("analyzer:stat.shootingRunSpeedFullCharge")}
              />
            )}
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.squidSurgeChargeFrames}
              title={t("analyzer:stat.squidSurgeChargeFrames")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.runSpeedInEnemyInk}
              title={t("analyzer:stat.runSpeedInEnemyInk")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.framesBeforeTakingDamageInEnemyInk}
              title={t("analyzer:stat.framesBeforeTakingDamageInEnemyInk")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.damageTakenInEnemyInkPerSecond}
              title={t("analyzer:stat.damageTakenInEnemyInkPerSecond")}
              suffix={t("analyzer:suffix.hp")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.enemyInkDamageLimit}
              title={t("analyzer:stat.enemyInkDamageLimit")}
              suffix={t("analyzer:suffix.hp")}
            />
          </StatCategory>

          <StatCategory title={t("analyzer:stat.category.misc")}>
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.squidFormInkRecoverySeconds}
              title={t("analyzer:stat.squidFormInkRecoverySeconds")}
              suffix={t("analyzer:suffix.seconds")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.humanoidFormInkRecoverySeconds}
              title={t("analyzer:stat.humanoidFormInkRecoverySeconds")}
              suffix={t("analyzer:suffix.seconds")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.quickRespawnTime}
              title={t("analyzer:stat.quickRespawnTime")}
              suffix={t("analyzer:suffix.seconds")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.quickRespawnTimeSplattedByRP}
              title={t("analyzer:stat.quickRespawnTimeSplattedByRP")}
              suffix={t("analyzer:suffix.seconds")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.superJumpTimeGroundFrames}
              title={t("analyzer:stat.superJumpTimeGround")}
            />
            <StatCard
              abilityPoints={abilityPoints}
              stat={analyzed.stats.superJumpTimeTotal}
              title={t("analyzer:stat.superJumpTimeTotal")}
              suffix={t("analyzer:suffix.seconds")}
            />
          </StatCategory>
          {objectShredderSelected && (
            <Link
              className="analyzer__noticeable-link"
              to={objectDamageCalculatorPage(mainWeaponId)}
            >
              <Image
                path={navIconUrl("object-damage-calculator")}
                width={24}
                height={24}
                alt=""
              />
              {t("analyzer:objCalcAd")}
            </Link>
          )}
        </div>
      </div>
    </Main>
  );
}

function WeaponInfoBadges({ analyzed }: { analyzed: AnalyzedBuild }) {
  const { t } = useTranslation(["weapons", "analyzer"]);

  return (
    <div className="analyzer__weapon-info-badges">
      <div className="analyzer__weapon-info-badge">
        <Image
          path={subWeaponImageUrl(analyzed.weapon.subWeaponSplId)}
          width={20}
          height={20}
          alt={t(`weapons:SUB_${analyzed.weapon.subWeaponSplId}`)}
        />
        {t(`weapons:SUB_${analyzed.weapon.subWeaponSplId}`)}
      </div>
      <div className="analyzer__weapon-info-badge">
        {t("analyzer:attribute.weight")}{" "}
        {t(`analyzer:attribute.weight.${analyzed.weapon.speedType}`)}
      </div>
      <div className="analyzer__weapon-info-badge">
        <Image
          path={specialWeaponImageUrl(analyzed.weapon.specialWeaponSplId)}
          width={20}
          height={20}
          alt={t(`weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`)}
        />
        {t(`weapons:SPECIAL_${analyzed.weapon.specialWeaponSplId}`)}
      </div>
    </div>
  );
}

function EffectsSelector({
  build,
  effects,
  ldeIntensity,
  handleLdeIntensityChange,
  handleAddEffect,
  handleRemoveEffect,
}: {
  build: BuildAbilitiesTupleWithUnknown;
  effects: Array<SpecialEffectType>;
  ldeIntensity: number;
  handleLdeIntensityChange: (newLdeIntensity: number) => void;
  handleAddEffect: (effect: SpecialEffectType) => void;
  handleRemoveEffect: (effect: SpecialEffectType) => void;
}) {
  const { t } = useTranslation(["weapons", "analyzer"]);

  const effectsToShow = SPECIAL_EFFECTS.filter(
    (effect) => !isAbility(effect.type) || build.flat().includes(effect.type)
  ).reverse(); // reverse to show Tacticooler first as it always shows

  return (
    <div className="analyzer__effects-selector">
      {effectsToShow.map((effect) => {
        return (
          <React.Fragment key={effect.type}>
            <div>
              {isAbility(effect.type) ? (
                <Ability ability={effect.type} size="SUB" />
              ) : (
                <Image
                  path={specialWeaponImageUrl(15)}
                  alt={t("weapons:SPECIAL_15")}
                  height={32}
                  width={32}
                />
              )}
            </div>
            <div>
              {effect.type === "LDE" ? (
                <select
                  value={ldeIntensity}
                  onChange={(e) =>
                    handleLdeIntensityChange(Number(e.target.value))
                  }
                  className="analyzer__lde-intensity-select"
                >
                  {new Array(MAX_LDE_INTENSITY + 1).fill(null).map((_, i) => {
                    const percentage = ((i / MAX_LDE_INTENSITY) * 100)
                      .toFixed(2)
                      .replace(".00", "");

                    return (
                      <option key={i} value={i}>
                        {percentage}% (+{lastDitchEffortIntensityToAp(i)}{" "}
                        {t("analyzer:abilityPoints.short")})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <Toggle
                  checked={effects.includes(effect.type)}
                  setChecked={(checked) =>
                    checked
                      ? handleAddEffect(effect.type)
                      : handleRemoveEffect(effect.type)
                  }
                  tiny
                />
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function AbilityPointsDetails({
  abilityPoints,
}: {
  abilityPoints: AbilityPoints;
}) {
  const { t } = useTranslation("analyzer");

  return (
    <details className="w-full">
      <summary className="analyzer__ap-summary">{t("abilityPoints")}</summary>
      <div className="stack sm horizontal flex-wrap mt-4">
        {abilities
          .filter((a) => (abilityPoints.get(a.name)?.ap ?? 0) > 0)
          .sort((a, b) => {
            return (
              abilityPoints.get(b.name)!.ap - abilityPoints.get(a.name)!.ap
            );
          })
          .map((a) => (
            <div
              key={`abilityPointsDetails_${a.name}`}
              className="stack items-center"
            >
              <Ability ability={a.name} size="TINY" />
              <div className="analyzer__ap-text">
                {abilityPoints.get(a.name)?.ap}
              </div>
            </div>
          ))}
      </div>
    </details>
  );
}

function AbilityChunksRequired({
  build,
}: {
  build: BuildAbilitiesTupleWithUnknown;
}) {
  const { t } = useTranslation("analyzer");
  const abilityChunksMapAsArray = getAbilityChunksMapAsArray(build);

  return (
    <details className="w-full">
      <summary className="analyzer__ap-summary">{t("abilityChunks")}</summary>
      <div className="stack sm horizontal flex-wrap mt-4">
        {abilityChunksMapAsArray.map((a) => {
          const mainAbilityName = a[0];
          const numChunksRequired = a[1];

          return (
            <div
              key={`abilityChunksRequired_${mainAbilityName}`}
              className="stack items-center"
            >
              <Ability ability={mainAbilityName} size="TINY" />
              <div className="analyzer__ap-text">{numChunksRequired}</div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function StatCategory({
  title,
  children,
  containerClassName = "analyzer__stat-collection",
  textBelow,
}: {
  title: string;
  children: React.ReactNode;
  containerClassName?: string;
  textBelow?: string;
}) {
  return (
    <details className="analyzer__details">
      <summary className="analyzer__summary">{title}</summary>
      <div className={containerClassName}>{children}</div>
      {textBelow && (
        <div className="analyzer__stat-category-explanation">{textBelow}</div>
      )}
    </details>
  );
}

function StatCard({
  title,
  stat,
  suffix,
  popoverInfo,
  abilityPoints,
}: {
  title: string;
  stat: Stat | Stat<string> | number;
  suffix?: string;
  popoverInfo?: string;
  abilityPoints: AbilityPoints;
}) {
  const { t } = useTranslation("analyzer");

  const baseValue = typeof stat === "number" ? stat : stat.baseValue;
  const showBuildValue = () => {
    if (typeof stat === "number") return false;

    // slightly hacky but handles the edge case
    // where baseValue === value which can happen when
    // you have Ninja Squid and stack swim speed
    // -> we still want to show the build value
    return [stat.modifiedBy].flat().some((ability) => {
      const hasStackable = (abilityPoints.get(ability)?.ap ?? 0) > 0;
      const hasEffect = stat.baseValue !== stat.value;

      return hasEffect || hasStackable;
    });
  };

  return (
    <div
      className={clsx("analyzer__stat-card", {
        "analyzer__stat-card-highlighted": showBuildValue(),
      })}
    >
      <div className="analyzer__stat-card__title-and-value-container">
        <h3 className="analyzer__stat-card__title">
          {title}{" "}
          {popoverInfo && (
            <Popover
              containerClassName="analyzer__stat-card__popover"
              triggerClassName="analyzer__stat-card__popover-trigger"
              buttonChildren={<>?</>}
            >
              {popoverInfo}
            </Popover>
          )}
        </h3>
        <div className="analyzer__stat-card-values">
          <div className="analyzer__stat-card__value">
            <h4 className="analyzer__stat-card__value__title">
              {typeof stat === "number" ? t("value") : t("base")}
            </h4>{" "}
            <div className="analyzer__stat-card__value__number">
              {baseValue}
              {suffix}
            </div>
          </div>
          {showBuildValue() ? (
            <div className="analyzer__stat-card__value">
              <h4 className="analyzer__stat-card__value__title">
                {t("build")}
              </h4>{" "}
              <div className="analyzer__stat-card__value__number">
                {(stat as Stat).value}
                {suffix}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="analyzer__stat-card__ability-container">
        {typeof stat !== "number" && (
          <ModifiedByAbilities abilities={stat.modifiedBy} />
        )}
      </div>
    </div>
  );
}

function ModifiedByAbilities({ abilities }: { abilities: Stat["modifiedBy"] }) {
  const abilitiesArray = Array.isArray(abilities) ? abilities : [abilities];

  return (
    <div className="stack horizontal sm items-center justify-center">
      {abilitiesArray.map((ability) => (
        <Ability key={ability} ability={ability} size="TINY" />
      ))}
    </div>
  );
}

function DamageTable({
  values,
  multiShots,
  subWeaponId,
}: {
  values: AnalyzedBuild["stats"]["damages"];
  multiShots: AnalyzedBuild["weapon"]["multiShots"];
  subWeaponId: SubWeaponId;
}) {
  const { t } = useTranslation(["weapons", "analyzer"]);

  const showDistanceColumn = values.some((val) => val.distance);

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>{t("analyzer:damage.header.type")}</th>
            <th>{t("analyzer:damage.header.damage")}</th>
            {showDistanceColumn && (
              <th>{t("analyzer:damage.header.distance")}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {values.map((val) => {
            const damage =
              multiShots && damageTypeToWeaponType[val.type] === "MAIN"
                ? new Array(multiShots).fill(val.value).join(" + ")
                : val.value;

            const typeRowName = damageTypeTranslationString({
              damageType: val.type,
              subWeaponId,
            });

            return (
              <tr key={val.id}>
                <td>{t(typeRowName)}</td>
                <td>
                  {damage}{" "}
                  {val.shotsToSplat && (
                    <span className="analyzer__shots-to-splat">
                      {t("analyzer:damage.toSplat", {
                        count: val.shotsToSplat,
                      })}
                    </span>
                  )}
                </td>
                {showDistanceColumn && <td>{val.distance}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function ConsumptionTable({
  options,
  subWeaponId,
}: {
  options: AnalyzedBuild["stats"]["fullInkTankOptions"];
  subWeaponId: SubWeaponId;
}) {
  const { t } = useTranslation(["analyzer", "weapons"]);
  const maxSubsToUse =
    subWeaponId === TORPEDO_ID
      ? 1
      : Math.max(...options.map((opt) => opt.subsUsed));
  const types = Array.from(new Set(options.map((opt) => opt.type)));

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>{t(`weapons:SUB_${subWeaponId}`)}</th>
            {types.map((type) => (
              <th key={type}>{t(`analyzer:stat.consumption.${type}`)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {new Array(maxSubsToUse + 1).fill(null).map((_, subsUsed) => {
            return (
              <tr key={subsUsed} className="bg-darker-important">
                <td>×{subsUsed}</td>
                {options
                  .filter((opt) => opt.subsUsed === subsUsed)
                  .map((opt) => {
                    return <td key={opt.id}>{opt.value}</td>;
                  })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="analyzer__consumption-table-explanation">
        {t("analyzer:consumptionExplanation", { maxSubsToUse })}
        {subWeaponId === TORPEDO_ID && <> {t("analyzer:torpedoExplanation")}</>}
      </div>
    </>
  );
}