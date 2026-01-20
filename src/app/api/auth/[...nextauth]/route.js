import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "../../../../../models/mongodb";
import User from "../../../../../lib/User";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: {},
        password: {}
      },
      async authorize(credentials) {
        await connectMongoDB();

        const user = await User.findOne({ username: credentials.username });
        if (!user) throw new Error("USERNAME_NOT_FOUND");

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isMatch) throw new Error("WRONG_PASSWORD");

        return {
          id: user._id,
          username: user.username,
        };
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    }
  },

  pages: {
    signIn: "/"
  },

  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
