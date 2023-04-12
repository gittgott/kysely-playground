import { atom } from "recoil"
import { Loading } from "src/lib/loading/types/Loading"

export const loadingState = atom<Loading>({
  key: "loading",
  default: {
    monaco: true,
    kysely: true,
    prettier: false,
    share: false,
    typescriptModel: true,
  },
})
