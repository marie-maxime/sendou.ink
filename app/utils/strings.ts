import type { GearType, User } from "~/db/types";
import { assertUnreachable } from "./types";

export const isNewDiscordUniqueName = (discordDiscriminator: string) =>
  discordDiscriminator === "0";

export function discordFullName(
  user: Pick<User, "discordName" | "discordDiscriminator">
) {
  if (isNewDiscordUniqueName(user.discordDiscriminator)) {
    return user.discordName;
  }
  return `${user.discordName}#${user.discordDiscriminator}`;
}

export function inGameNameWithoutDiscriminator(inGameName: string) {
  return inGameName.split("#")[0];
}

export function makeTitle(title: string | string[]) {
  return `${Array.isArray(title) ? title.join(" | ") : title} | sendou.ink`;
}

export function semiRandomId() {
  return String(Math.random());
}

export const rawSensToString = (sens: number) =>
  `${sens > 0 ? "+" : ""}${sens / 10}`;

type WithStart<
  S extends string,
  Start extends string
> = S extends `${Start}${infer Rest}` ? `${Start}${Rest}` : never;

export function startsWith<S extends string, Start extends string>(
  str: S,
  start: Start
  // @ts-expect-error TS 4.9 upgrade
): str is WithStart<S, Start> {
  return str.startsWith(start);
}

type Split<S extends string, Sep extends string> = string extends S
  ? string[]
  : S extends ""
  ? []
  : S extends `${infer T}${Sep}${infer U}`
  ? [T, ...Split<U, Sep>]
  : [S];

export function split<S extends string, Sep extends string>(
  str: S,
  seperator: Sep
) {
  return str.split(seperator) as Split<S, Sep>;
}

export function gearTypeToInitial(gearType: GearType) {
  switch (gearType) {
    case "HEAD":
      return "H";
    case "CLOTHES":
      return "C";
    case "SHOES":
      return "S";
    default:
      assertUnreachable(gearType);
  }
}

export function capitalize(str: string) {
  return str[0].toUpperCase() + str.slice(1);
}
