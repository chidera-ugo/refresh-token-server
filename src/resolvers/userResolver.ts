import {
	Arg,
	Ctx,
	Field,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	UseMiddleware,
} from "type-graphql"
import argon from "argon2"
import { User } from "../entities/UserEntity"
import { Context } from "src/types"
import { createAccessToken, createRefreshToken } from "../auth"
import { isAuth } from "../middleware/isAuth"
import { sendRefreshToken } from "../helpers/sendRefreshToken"
import { getConnection } from "typeorm"

@ObjectType()
class FieldError {
	@Field()
	field: string

	@Field()
	message: string
}

// @ObjectType()
// class UserResponse {
// 	@Field({ nullable: true })
// 	errors?: FieldError[]

// 	@Field({ nullable: true })
// 	user?: User
// }

@ObjectType()
class LoginResponse {
	@Field(() => String, { nullable: true })
	accessToken?: string

	@Field(() => [FieldError], { nullable: true })
	errors?: FieldError[]
}

@Resolver()
export class UserResolver {
	@Query(() => String)
	hello() {
		return "hi"
	}

	@Query(() => String)
	@UseMiddleware(isAuth)
	bye(@Ctx() { tokenPayload }: Context) {
		return `Your user ID is ${tokenPayload?.userId}`
	}

	@Query(() => [User])
	users(): Promise<User[]> {
		return User.find()
	}

	@Mutation(() => Boolean)
	async register(
		@Arg("email") email: string,
		@Arg("password") password: string
	): Promise<boolean> {
		const hashedPassword = await argon.hash(password)

		try {
			await User.insert({
				email,
				password: hashedPassword,
			})
		} catch (error) {
			console.log(error)
			return false
		}
		return true
	}

	@Mutation(() => LoginResponse)
	async login(
		@Arg("email") email: string,
		@Arg("password") password: string,
		@Ctx() { res }: Context
	): Promise<LoginResponse> {
		const user = await User.findOne({ where: { email } })

		if (!user) {
			return {
				errors: [{ field: "email", message: "user not found" }],
			}
		}

		const validPassword = await argon.verify(user.password, password)

		if (!validPassword) {
			return {
				errors: [{ field: "email", message: "invalid email or password" }],
			}
		}

		sendRefreshToken(res, createRefreshToken(user))

		return {
			accessToken: createAccessToken(user),
		}
	}

	@Mutation(() => Boolean)
	async revokeRefreshTokensForUser(@Arg("userId", () => Int) userId: number) {
		await getConnection()
			.getRepository(User)
			.increment({ id: userId }, "tokenVersion", 1)

		return true
	}
}
