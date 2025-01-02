import { DEFUALT_STATE, LEGACY_PLAYGROUND_URL } from "../constants";
import { logger } from "../utility/logger";
import { StringUtils } from "../utility/string-utils";
import { ValidateUtils } from "../utility/validate-utils";
import { State } from "./state";

export class StateManager {
  constructor() {}

  /**
   * Encode the state and update url.
   */
  async save(state: State) {
    validate(state);
    logger.debug("encode state");
    const encoded = await lzEncode(JSON.stringify(state));
    const header: FragmentHeader = "c";
    window.history.replaceState(
      null,
      "",
      window.location.origin + import.meta.env.BASE_URL + window.location.search,
    );
    window.location.hash = header + encoded;
  }

  /**
   * Returns decoded state from url, or DEFAULT_STATE.
   */
  async load(): Promise<State> {
    checkLegacyParams();
    const fragment = StringUtils.trimPrefix(window.location.hash, "#");
    const path = StringUtils.trimPrefix(window.location.pathname, import.meta.env.BASE_URL);
    if (fragment === "" && path === "") {
      return DEFUALT_STATE;
    }

    if (fragment !== "" && path !== "") {
      throw new StateManagerError(`both fragment and path are given`);
    }
    if (fragment !== "") {
      return this.loadFragment(fragment);
    }
    return this.loadPath(path);
  }

  private async loadFragment(fragment: string) {
    const header = fragment.charAt(0) as FragmentHeader;
    const body = fragment.substring(1);
    let json: string;
    switch (header) {
      case "r": {
        logger.debug("raw fragment");
        json = decodeURIComponent(body);
        break;
      }
      case "c": {
        logger.debug("compressed fragment");
        json = await lzDecode(body);
        break;
      }
      default:
        throw new StateManagerError(`unknown fragment header ${header}`);
    }
    const state = JSON.parse(json) as State;
    validate(state);
    return state;
  }

  private async loadPath(path: string) {
    logger.debug(`load path ${path}`);
    const id = path;
    logger.debug(`get state by id ${id}`);
    return JSON.parse(await lzDecode(id));
  }
}

async function lzEncode(v: string) {
  const { compressToEncodedURIComponent } = await import("lz-string");
  return compressToEncodedURIComponent(v);
}

async function lzDecode(v: string) {
  const { decompressFromEncodedURIComponent } = await import("lz-string");
  return decompressFromEncodedURIComponent(v);
}

function checkLegacyParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("i") !== null && params.get("p") !== null) {
    logger.info("legacy params");
    window.location.href = LEGACY_PLAYGROUND_URL + window.location.search;
  }
}

function validate(s: State) {
  ValidateUtils.typeEqual(s.editors, "object", "State.editors");
  ValidateUtils.typeEqual(s.editors.type, "string", "State.editors.type");
  ValidateUtils.typeIncludes(s.hideType, ["boolean", "undefined"], "State.hideType");
}

/**
 * c = compressed
 *
 * r = raw
 */
type FragmentHeader = "c" | "r";

class StateManagerError extends Error {}
