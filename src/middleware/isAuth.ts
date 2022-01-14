import { Context } from "src/types"
import { MiddlewareFn } from "type-graphql"
import { verify } from "jsonwebtoken"

export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
	const authrorization = context.req.headers["authorization"]

	if (!authrorization) {
		throw new Error("Not authorized")
	}

	try {
		const token = authrorization?.split(" ")[1]

		const payload = verify(token, process.env.ACCESS_TOKEN_SECRET!)
		context.tokenPayload = payload as any
	} catch (error) {
		console.log(error)
		throw new Error(error)
	}

	return next()
}
