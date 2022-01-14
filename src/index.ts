import "dotenv/config"
import "reflect-metadata"
import { createConnection } from "typeorm"
import express, { Request, Response } from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import { UserResolver } from "./resolvers/userResolver"
import cookieParser from "cookie-parser"
import { verify } from "jsonwebtoken"
import { User } from "./entities/UserEntity"
import { createAccessToken, createRefreshToken } from "./auth"
import { sendRefreshToken } from "./helpers/sendRefreshToken"
import cors from "cors"

async function main() {
	const corsOptions = {
		origin: ["http://localhost:3000", "https://studio.apollographql.com"],
		credentials: true,
	}
	const app = express()
	app.use(cors(corsOptions))
	app.use(cookieParser())
	await createConnection()

	app.post("/refresh-token", async (req: Request, res: Response) => {
		const token = req.cookies.jid

		if (!token) {
			return res.send({
				ok: false,
				accessToken: null,
			})
		}

		let payload: any = null

		try {
			payload = verify(token, process.env.REFRESH_TOKEN_SECRET!)
		} catch (error) {
			console.log(error)
			return res.send({ ok: false, accessToken: null })
		}

		const userId = payload.userId

		const user = await User.findOne({ where: { id: userId } })

		if (!user) {
			return res.send({ ok: false, accessToken: null })
		}

		if (user.tokenVersion !== payload.tokenVersion) {
			return res.send({ ok: false, accessToken: null })
		}

		sendRefreshToken(res, createRefreshToken(user))

		return res.send({
			ok: true,
			accessToken: createAccessToken(user),
		})
	})

	const server = new ApolloServer({
		schema: await buildSchema({
			resolvers: [UserResolver],
		}),
		context: ({ req, res }) => ({
			req,
			res,
		}),
	})

	await server.start()
	server.applyMiddleware({
		app,
		cors: false,
	})

	app.listen(4000, () => {
		console.log("SERVER IS UP")
	})
}

main()

// createConnection().then(async connection => {

//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await connection.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);

//     console.log("Loading users from the database...");
//     const users = await connection.manager.find(User);
//     console.log("Loaded users: ", users);

//     console.log("Here you can setup and run express/koa/any other framework.");

// }).catch(error => console.log(error));
