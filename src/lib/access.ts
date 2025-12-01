import type { ClientUser } from "payload"
import type { User } from "@/payload-types"

export const isAdmin = (user: ClientUser | User | null) => {
	return Boolean(user?.roles?.includes("admin"))
}
